from app.core.validators import validate_email, validate_username
from app.models.model_role import Role
from app.models.model_users import User
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette import status
from app.core.redis_client import redis_client


def get_users(db: Session):
    return db.query(User).order_by(func.lower(User.username)).all()


def update_user(db: Session, user_id: int, user):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    try:
        update_data = user.dict(exclude_unset=True)

        if "username" in update_data:
            validate_username(update_data["username"])

            existing = (
                db.query(User)
                .filter(
                    User.username == update_data["username"],
                    User.id != user_id,
                )
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already exists",
                )

        if "email" in update_data:
            validate_email(update_data["email"])

            existing = (
                db.query(User)
                .filter(
                    User.email == update_data["email"],
                    User.id != user_id,
                )
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already exists",
                )

        if "role_id" in update_data:
            role = db.query(Role).filter(Role.id == update_data["role_id"]).first()

            if not role:
                raise HTTPException(
                    status_code=404,
                    detail="Role not found",
                )
            is_admin = any(r.name == "Admin" for r in db_user.roles)
            admin_count = (
                db.query(User).join(User.roles).filter(Role.name == "Admin").count()
            )
            if is_admin and role.name != "Admin" and admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last admin user",
                )

            db_user.roles = [role]

            del update_data["role_id"]

        for key, value in update_data.items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)

        return db_user

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    except HTTPException:
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user",
        )


def delete_user(
    db: Session,
    user_id: int,
    current_user,
):
    db_user = db.query(User).filter(User.id == user_id).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account",
        )

    admin_count = db.query(User).join(User.roles).filter(Role.name == "Admin").count()

    is_admin = any(role.name == "Admin" for role in db_user.roles)

    if is_admin and admin_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last admin user",
        )

    try:
        db_user.tasks = []

        db_user.subtasks = []

        db.delete(db_user)

        db.commit()

        try:

            for key in redis_client.scan_iter("tasks:*"):
                redis_client.delete(key)
            for key in redis_client.scan_iter("task:*"):
                redis_client.delete(key)
            for key in redis_client.scan_iter("subtasks:*"):
                redis_client.delete(key)
            for key in redis_client.scan_iter("subtask:*"):
                redis_client.delete(key)
        except Exception:
            pass

        return {
            "detail": "User deleted successfully",
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user",
        )


def get_roles(db: Session):
    return db.query(Role).all()
