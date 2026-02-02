import base64
import json
import os
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

CLERK_PUBLIC_KEY_BASE64 = os.getenv("CLERK_PUBLIC_KEY_BASE64")

if CLERK_PUBLIC_KEY_BASE64:
    CLERK_PUBLIC_KEY = base64.b64decode(CLERK_PUBLIC_KEY_BASE64).decode("utf-8")
    print(CLERK_PUBLIC_KEY)
else:
    raise RuntimeError("CLERK_PUBLIC_KEY_BASE64 environment variable is not set")

_security = HTTPBearer(auto_error=True)


async def verify_token(
    credentials_header: HTTPAuthorizationCredentials = Depends(_security),
) -> Dict[str, Any]:
    """FastAPI dependency that returns the decoded Clerk user info."""
    if not credentials_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    token = credentials_header.credentials

    try:
        payload = jwt.decode(
            token,
            key=CLERK_PUBLIC_KEY,
            algorithms=["RS256"],
        )

        return {"uid": payload.get("sub"), "email": payload.get("email")}

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        print("INVALID TOKEN")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_user(decoded_token: Dict[str, Any], db: Session) -> Any:
    """Get an existing User record from a Clerk token.

    Args:
        decoded_token: Decoded Clerk token with uid and email
        db: Database session

    Returns:
        The User model instance

    Raises:
        HTTPException: If user not found or token is invalid
    """
    import models  # Avoid circular imports

    clerk_uid = decoded_token.get("uid")
    email = decoded_token.get("email")

    if not clerk_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid or email",
        )

    # Try find by clerk_uid first
    user = db.query(models.User).filter(models.User.clerk_uid == clerk_uid).first()

    # Fallback: find by email to handle emulator uid changes
    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Update clerk_uid to current token's uid
            user.clerk_uid = clerk_uid
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


def register_user(decoded_token: Dict[str, Any], db: Session) -> Any:
    """Register or fetch a User record from a Clerk token.

    Creates a new User if one doesn't exist. If the user exists but the
    clerk_uid differs, updates it.

    Args:
        decoded_token: Decoded Clerk token with uid and email
        db: Database session

    Returns:
        The User model instance
    """
    import models  # Avoid circular imports

    clerk_uid = decoded_token.get("uid")
    email = decoded_token.get("email")

    if not clerk_uid or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing uid or email",
        )

    # Try find by clerk_uid first
    user = db.query(models.User).filter(models.User.clerk_uid == clerk_uid).first()

    if not user:
        # Fallback: find by email to handle emulator uid changes
        user = db.query(models.User).filter(models.User.email == email).first()

        if user:
            # Update clerk_uid to current token's uid
            user.clerk_uid = clerk_uid
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Create new user
            user = models.User(clerk_uid=clerk_uid, email=email)
            db.add(user)
            db.commit()
            db.refresh(user)

    return user
