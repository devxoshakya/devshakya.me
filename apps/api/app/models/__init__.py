# Importing every model here registers it on Base.metadata.
# Alembic's env.py must import this package, otherwise autogenerate sees nothing.
from app.db.base import Base
from app.models.admin import Admin
from app.models.passkey_credential import PasskeyCredential
from app.models.pin import Pin
from app.models.refresh_token import RefreshToken
from app.models.visitor import Visitor

__all__ = [
    "Admin",
    "Base",
    "PasskeyCredential",
    "Pin",
    "RefreshToken",
    "Visitor",
]
