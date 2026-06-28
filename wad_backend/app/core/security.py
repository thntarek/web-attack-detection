from datetime import datetime, timedelta, timezone
from typing import Annotated, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select

from app.core.config import get_settings
from app.core.database import DBSession
from app.core.models import User
from app.http_exceptions.auth_exception import credentials_exception

settings = get_settings()

SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES)

hash_context = PasswordHash.recommended()


def hash_maker(plain_text: str) -> str:
    return hash_context.hash(plain_text)


def verify_hash(plain_text: str, hashed_text: str) -> bool:
    return hash_context.verify(plain_text, hashed_text)


def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    if "sub" not in to_encode:
        to_encode["sub"] = str(data.get("sub"))
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("token_type")

        if user_id is None:
            raise credentials_exception

        return {"sub": int(user_id), "role": role, "token_type": token_type}

    except InvalidTokenError:
        raise credentials_exception


security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBSession,
) -> User:
    token = credentials.credentials
    token_data = verify_token(token)
    user_id = int(token_data.get("sub"))

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_role(*roles: str):
    async def role_checker(current_user: CurrentUser) -> User:
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required role(s): {', '.join(roles)}",
            )
        return current_user

    return role_checker


AdminUser = Annotated[User, Depends(require_role("admin"))]
ModeratorUser = Annotated[User, Depends(require_role("moderator"))]
NormalUser = Annotated[User, Depends(require_role("user"))]
ModeratorOrAdmin = Annotated[User, Depends(require_role("moderator", "admin"))]
