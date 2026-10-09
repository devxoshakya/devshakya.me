import asyncio
import getpass
import sys
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path

import typer
from redis.asyncio import Redis
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings
from app.db.engine import create_engine
from app.db.redis import create_redis
from app.db.session import create_session_factory
from app.models.admin import Admin
from app.models.passkey_credential import PasskeyCredential
from app.models.refresh_token import RefreshToken
from app.services.auth import hash_password
from app.services.passkey import PasskeyService

app = typer.Typer(help="Portfolio API Auth Management CLI")


@asynccontextmanager
async def cli_resources() -> AsyncGenerator[tuple[AsyncSession, Redis]]:
    settings = get_settings()
    engine = create_engine(settings.POSTGRES_URL)
    redis = create_redis(settings.REDIS_URL)

    try:
        session_factory = create_session_factory(engine)
        async with session_factory() as db:
            yield db, redis
    finally:
        await redis.aclose()
        await engine.dispose()


def verify_environment(env: str):
    print(f"Target Environment: [{env.upper()}]")
    if env.lower() == "prod":
        confirm = typer.prompt(
            "Type 'prod' to confirm operations on PRODUCTION database"
        )
        if confirm != "prod":
            print("Operation aborted.")
            raise typer.Exit(code=1)


async def _create_admin():
    async with cli_resources() as (db, _redis):
        stmt = select(Admin).where(Admin.id == 1)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            typer.echo("Error: Admin user (id = 1) already exists.")
            raise typer.Exit(code=1)

        password = getpass.getpass("Enter Admin Passphrase (min 14 chars): ")
        if len(password) < 14:
            typer.echo("Error: Passphrase must be at least 14 characters long.")
            raise typer.Exit(code=1)

        hashed = await hash_password(password)
        admin = Admin()
        admin.id = 1
        admin.password_hash = hashed
        db.add(admin)
        await db.commit()
        typer.echo("Admin user successfully created with ID 1.")


@app.command()
def create_admin(
    env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)"),
):
    """Bootstraps the single admin account (ID 1)."""
    verify_environment(env)
    asyncio.run(_create_admin())


async def _reset_password():
    async with cli_resources() as (db, redis):
        stmt = select(Admin).where(Admin.id == 1)
        admin = (await db.execute(stmt)).scalar_one_or_none()
        if not admin:
            typer.echo("Error: Admin user does not exist. Run create-admin first.")
            raise typer.Exit(code=1)

        password = getpass.getpass("Enter New Admin Passphrase (min 14 chars): ")
        if len(password) < 14:
            typer.echo("Error: Passphrase must be at least 14 characters long.")
            raise typer.Exit(code=1)

        admin.password_hash = await hash_password(password)

        # Revoke all refresh tokens in DB
        now = datetime.now(UTC)
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.commit()

        # Flag active families in Redis
        stmt_fids = select(RefreshToken.family_id).distinct()
        fids = (await db.execute(stmt_fids)).scalars().all()
        for fid in fids:
            await redis.set(f"rt:fam:revoked:{fid}", "1", ex=30 * 86400)

        typer.echo("Password updated successfully and all active sessions revoked.")


@app.command()
def reset_password(
    env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)"),
):
    """Resets the admin password and revokes all active sessions."""
    verify_environment(env)
    asyncio.run(_reset_password())


async def _revoke_sessions():
    async with cli_resources() as (db, redis):
        now = datetime.now(UTC)
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        stmt_fids = select(RefreshToken.family_id).distinct()
        fids = (await db.execute(stmt_fids)).scalars().all()
        await db.commit()

        for fid in fids:
            await redis.set(f"rt:fam:revoked:{fid}", "1", ex=30 * 86400)

        typer.echo(f"Revoked {len(fids)} session families.")


@app.command()
def revoke_sessions(
    env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)"),
):
    """Revokes all active sessions without changing the password."""
    verify_environment(env)
    asyncio.run(_revoke_sessions())


async def _list_passkeys():
    async with cli_resources() as (db, _redis):
        stmt = select(PasskeyCredential)
        credentials = (await db.execute(stmt)).scalars().all()
        if not credentials:
            typer.echo("No registered passkeys found.")
            return

        for cred in credentials:
            typer.echo(
                f"ID: {cred.id} | Label: {cred.label or 'Unlabeled'} | Counter: {cred.sign_count} | Created: {cred.created_at}"
            )


@app.command()
def list_passkeys(
    env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)"),
):
    """Lists all registered passkey credentials."""
    verify_environment(env)
    asyncio.run(_list_passkeys())


async def _revoke_passkey(credential_id: str):
    async with cli_resources() as (db, _redis):
        stmt_passkeys = select(func.count(PasskeyCredential.id))
        total_passkeys = (await db.execute(stmt_passkeys)).scalar_one()

        stmt_admin = select(Admin).where(Admin.id == 1)
        admin = (await db.execute(stmt_admin)).scalar_one_or_none()

        if total_passkeys == 1 and not (admin and admin.password_hash):
            typer.echo(
                "Error: Refusing to delete the last credential. No password authentication method exists."
            )
            raise typer.Exit(code=1)

        stmt = select(PasskeyCredential).where(PasskeyCredential.id == credential_id)
        cred = (await db.execute(stmt)).scalar_one_or_none()
        if not cred:
            typer.echo(f"Error: Passkey with ID {credential_id} not found.")
            raise typer.Exit(code=1)

        await db.delete(cred)
        await db.commit()
        typer.echo(f"Passkey {credential_id} removed.")


@app.command()
def revoke_passkey(
    credential_id: str,
    env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)"),
):
    """Revokes a specific passkey credential by its credential ID."""
    verify_environment(env)
    asyncio.run(_revoke_passkey(credential_id))
    
    
@app.command()
def enroll_passkey(env: str = typer.Option("dev", "--env", help="Target environment (dev/prod)")):
    """Generates a secure 10-minute passkey enrollment URL."""
    verify_environment(env)

    async def _enroll():
        async with cli_resources() as (db, redis):
            service = PasskeyService(db, redis)
            token = await service.generate_enrollment_token()
            frontend_host = "http://localhost:3000" if env != "prod" else "https://devexoshakya.xyz"
            typer.echo(f"\nEnrollment Link (expires in 10 mins):\n{frontend_host}/admin/enroll#{token}\n")

    asyncio.run(_enroll())


if __name__ == "__main__":
    app()
