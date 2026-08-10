from app.core.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)
from app.core.security import hash_password, verify_password
from app.core.validators import (
    validate_email,
    validate_password_strength,
    validate_username,
)
from app.models.model_users import User
from app.models.model_role import Role
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette import status


def create_user(db: Session, email: str, username: str, password: str):

    validate_email(email)
    validate_username(username)
    validate_password_strength(password)

    # ✅ 1. Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    existing_username = db.query(User).filter(User.username == username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this username already exists",
        )

    # ✅ 2. Hash password
    password_hash = hash_password(password)

    # ✅ 3. Create user object
    new_user = User(email=email, username=username, password_hash=password_hash)

    default_role = db.query(Role).filter(Role.name == "Developer").first()
    if default_role:
        new_user.roles = [default_role]

    # ✅ 4. Save to DB
    db.add(new_user)

    try:
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user",
        )

    return new_user


def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="user does not exist",
        )

    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
):
    user = login_user(
        db=db,
        email=email,
        password=password,
    )

    access_token = create_access_token({"sub": str(user.id)})

    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def refresh_access_token(
    refresh_token: str,
):
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token is required",
        )

    payload = decode_refresh_token(refresh_token)

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    new_access_token = create_access_token({"sub": str(user_id)})

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


def logout_user():
    return {"message": "Logged out successfully"}


def update_me(
    db,
    current_user,
    payload,
):
    validate_username(payload.username)
    validate_email(payload.email)

    username_exists = (
        db.query(User)
        .filter(
            User.username == payload.username,
            User.id != current_user.id,
        )
        .first()
    )

    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    email_exists = (
        db.query(User)
        .filter(
            User.email == payload.email,
            User.id != current_user.id,
        )
        .first()
    )

    if email_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    current_user.username = payload.username.strip()
    current_user.email = payload.email.strip()

    try:
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating profile",
        )

    db.refresh(current_user)

    return {
        "message": "Profile updated successfully",
    }


def change_password(
    db,
    current_user,
    payload,
):
    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    validate_password_strength(payload.new_password)

    current_user.password_hash = hash_password(payload.new_password)

    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error changing password",
        )

    return {
        "message": "Password changed successfully",
    }
