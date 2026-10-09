import logging
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any, cast

import boto3  # pyright: ignore[reportMissingTypeStubs]
from botocore.config import Config  # pyright: ignore[reportMissingTypeStubs]
from botocore.exceptions import BotoCoreError  # pyright: ignore[reportMissingTypeStubs]
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)


class StorageService(ABC):
    @abstractmethod
    async def presign_put(
        self,
        key: str,
        content_type: str,
        content_length: int,
        expires_in: int = 600,
    ) -> str:
        pass

    @abstractmethod
    async def head(self, key: str) -> dict[str, Any] | None:
        pass

    @abstractmethod
    async def read_range(self, key: str, start: int = 0, end: int = 31) -> bytes:
        pass

    @abstractmethod
    async def copy(
        self,
        src_key: str,
        dst_key: str,
        content_type: str,
        cache_control: str = "public, max-age=31536000, immutable",
    ) -> None:
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        pass

    @abstractmethod
    async def list_prefix(self, prefix: str) -> AsyncIterator[dict[str, Any]]:
        if False:
            yield {}


class R2StorageService(StorageService):
    def __init__(
        self,
        account_id: str,
        access_key_id: str,
        secret_access_key: str,
        bucket: str,
    ):
        self.bucket = bucket
        boto3_api = cast(Any, boto3)
        self.client = boto3_api.client(
            "s3",
            endpoint_url=f"https://{account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name="auto",
            config=Config(
                signature_version="s3v4",
                retries={"max_attempts": 2, "mode": "standard"},
                connect_timeout=3,
                read_timeout=8,
        )
        )

    async def presign_put(
        self,
        key: str,
        content_type: str,
        content_length: int,
        expires_in: int = 600,
    ) -> str:
        # SigV4 local computation (no network I/O)
        return self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": self.bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )

    async def head(self, key: str) -> dict[str, Any] | None:
        def _head() -> dict[str, Any] | None:
            try:
                res = self.client.head_object(Bucket=self.bucket, Key=key)
                return {
                    "size": res.get("ContentLength", 0),
                    "content_type": res.get("ContentType", ""),
                }
            except BotoCoreError:
                logger.warning("storage_head_failed key=%s", key, exc_info=True)
                return None

        return await run_in_threadpool(_head)

    async def read_range(self, key: str, start: int = 0, end: int = 31) -> bytes:
        def _read() -> bytes:
            res = self.client.get_object(
                Bucket=self.bucket, Key=key, Range=f"bytes={start}-{end}"
            )
            return res["Body"].read()

        return await run_in_threadpool(_read)

    async def copy(
        self,
        src_key: str,
        dst_key: str,
        content_type: str,
        cache_control: str = "public, max-age=31536000, immutable",
    ) -> None:
        def _copy() -> None:
            self.client.copy_object(
                Bucket=self.bucket,
                CopySource={"Bucket": self.bucket, "Key": src_key},
                Key=dst_key,
                MetadataDirective="REPLACE",
                ContentType=content_type,
                CacheControl=cache_control,
            )

        await run_in_threadpool(_copy)

    async def delete(self, key: str) -> None:
        def _delete() -> None:
            try:
                self.client.delete_object(Bucket=self.bucket, Key=key)
            except BotoCoreError:
                logger.warning("storage_delete_failed key=%s", key, exc_info=True)

        await run_in_threadpool(_delete)

    async def list_prefix(self, prefix: str) -> AsyncIterator[dict[str, Any]]:
        token: str | None = None
        while True:

            def _fetch(t: str | None = token) -> dict[str, Any]:
                kwargs: dict[str, Any] = {
                    "Bucket": self.bucket,
                    "Prefix": prefix,
                }
                if t:
                    kwargs["ContinuationToken"] = t
                return self.client.list_objects_v2(**kwargs)

            page = await run_in_threadpool(_fetch)
            for item in page.get("Contents", []):
                yield {"key": item["Key"], "size": item["Size"]}
            if page.get("IsTruncated"):
                token = page.get("NextContinuationToken")
            else:
                break
