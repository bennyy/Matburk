"""Firebase authentication helpers for FastAPI.

This module verifies Firebase ID tokens from the client and exposes a
FastAPI dependency for protected routes. Set FIREBASE_AUTH_DISABLED=true
in local dev if you need to run without authentication (not recommended
for production).

To use the Firebase Auth Emulator:
1. Install Firebase CLI: npm install -g firebase-tools
2. Run: firebase emulators:start --only auth
3. Set FIREBASE_USE_EMULATOR=true
"""

import base64
import json
import os
from typing import Any, Dict, Optional

import firebase_admin
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from sqlalchemy.orm import Session

# When true, auth checks are bypassed (useful for local dev only)
AUTH_DISABLED = os.getenv("FIREBASE_AUTH_DISABLED", "false").lower() == "true"

# When true, use Firebase Auth Emulator for local development
USE_EMULATOR = os.getenv("FIREBASE_USE_EMULATOR", "false").lower() == "true"

# Firebase configuration options
_FIREBASE_CREDENTIALS_BASE64 = os.getenv("FIREBASE_CREDENTIALS_BASE64")
_FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "demo-project")

_security = HTTPBearer(auto_error=True)
_firebase_app: Optional[firebase_admin.App] = None


def _init_firebase_app() -> Optional[firebase_admin.App]:
    """Initialize the Firebase Admin SDK once and reuse the app."""

    global _firebase_app

    if AUTH_DISABLED:
        return None

    if _firebase_app:
        return _firebase_app

    # For emulator, we don't need real credentials
    if USE_EMULATOR:
        try:
            _firebase_app = firebase_admin.get_app()
        except ValueError:
            # Initialize with no credentials for emulator (it doesn't validate them)
            _firebase_app = firebase_admin.initialize_app(None, {"projectId": _FIREBASE_PROJECT_ID})
        print(f"🔥 Firebase Admin SDK initialized for emulator (project: {_FIREBASE_PROJECT_ID})")
        return _firebase_app

    # Choose credential source for production
    cred: credentials.Base = None  # type: ignore[assignment]
    try:
        if _FIREBASE_CREDENTIALS_BASE64:
            decoded_json = base64.b64decode(_FIREBASE_CREDENTIALS_BASE64).decode("utf-8")
            cred_dict = json.loads(decoded_json)
            cred = credentials.Certificate(cred_dict)
        else:
            cred = credentials.ApplicationDefault()
    except Exception as exc:  # pragma: no cover - setup failure
        raise RuntimeError(
            "Failed to load Firebase credentials. Set FIREBASE_CREDENTIALS_BASE64"
            " or provide Application Default Credentials."
        ) from exc

    options = {"projectId": _FIREBASE_PROJECT_ID} if _FIREBASE_PROJECT_ID else None

    try:
        _firebase_app = firebase_admin.get_app()
    except ValueError:
        _firebase_app = firebase_admin.initialize_app(cred, options=options)

    return _firebase_app


def _verify_token(id_token: str) -> Dict[str, Any]:
    """Verify and decode a Firebase ID token."""
    # Emulator: decode without signature verification and extract claims
    if USE_EMULATOR:
        try:
            decoded = jwt.decode(
                id_token,
                options={"verify_signature": False, "verify_exp": False},
                algorithms=["RS256", "HS256", "none"],
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid emulator auth token",
            ) from exc

        uid = decoded.get("user_id") or decoded.get("uid") or decoded.get("sub")
        email = decoded.get("email")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Auth token missing UID",
            )
        return {"uid": uid, "email": email}

    # Production: verify via Firebase Admin SDK
    app = _init_firebase_app()
    if AUTH_DISABLED:
        print("⚠️  Firebase auth is disabled - running without authentication")
        return {"uid": "dev-user", "email": "dev@example.com"}

    try:
        decoded = firebase_auth.verify_id_token(id_token, app=app)
    except Exception as exc:  # pragma: no cover - depends on runtime tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired auth token",
        ) from exc

    if not decoded.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Auth token missing UID",
        )

    return {"uid": decoded.get("uid"), "email": decoded.get("email")}


async def verify_token(
    credentials_header: HTTPAuthorizationCredentials = Depends(_security),
) -> Dict[str, Any]:
    """FastAPI dependency that returns the decoded Firebase user info."""

    if not credentials_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    return _verify_token(credentials_header.credentials)


def ensure_user_exists(decoded_token: Dict[str, Any], db: Session) -> Any:
    """Ensure a User record exists for the Firebase account.

    Args:
        decoded_token: Decoded Firebase token with uid and email
        db: Database session

    Returns:
        The User model instance
    """
    import models  # Avoid circular imports

    firebase_uid = decoded_token.get("uid")
    email = decoded_token.get("email")

    if not firebase_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid or email",
        )

    # Try find by firebase_uid first
    user = db.query(models.User).filter(models.User.firebase_uid == firebase_uid).first()

    if not user:
        # Fallback: find by email to handle emulator uid changes
        user = db.query(models.User).filter(models.User.email == email).first()

        if user:
            # Update firebase_uid to current token's uid
            user.firebase_uid = firebase_uid
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Create new user
            user = models.User(firebase_uid=firebase_uid, email=email)
            db.add(user)
            db.commit()
            db.refresh(user)

    return user
