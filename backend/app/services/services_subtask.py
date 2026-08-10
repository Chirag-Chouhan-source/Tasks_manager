from app.models.model_subtasks import SubTask
from app.models.model_task import Task
from app.models.model_users import User
from app.schemas.schemas_enums import StatusEnum
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def create_subtask(db: Session, task_id: int, subtask_data):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    clean_title = subtask_data.title.strip()
    normalized_title = clean_title.lower()

    existing_subtask = (
        db.query(SubTask)
        .filter(
            SubTask.task_id == task_id,
            func.lower(SubTask.title) == normalized_title,
        )
        .first()
    )

    if existing_subtask:
        raise HTTPException(
            status_code=400,
            detail="Subtask with this title already exists",
        )

    subtask = SubTask(
        title=clean_title,
        status=(subtask_data.status or StatusEnum.backlog),
        task_id=task_id,
    )

    db.add(subtask)

    try:
        if subtask_data.users:
            users = db.query(User).filter(User.id.in_(subtask_data.users)).all()

            if len(users) != len(subtask_data.users):
                raise HTTPException(status_code=400, detail="Invalid user IDs")

            subtask.users = users

        db.commit()

    except HTTPException as e:
        db.rollback()
        raise e

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Subtask with this title already exists"
        )

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating subtask")

    db.refresh(subtask)

    subtask = db.query(SubTask).filter(SubTask.id == subtask.id).first()

    return {
        "id": subtask.id,
        "title": subtask.title,
        "status": subtask.status.value,
        "task_id": subtask.task_id,
        "sprint": subtask.task.sprint,
        "created_at": subtask.created_at,
        "updated_at": subtask.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in subtask.users
        ],
        "comments": {
            "count": 0,
            "data": [],
        },
    }


def get_subtasks(
    db: Session,
    task_id: int,
    status=None,
    user_id=None,
    search=None,
    sprint=None,
    skip: int = 0,
    limit: int = 5,
    sort_by="created_at",
    sort_order="desc",
):
    # Check if task exists
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # ✅ ✅ CHANGE: JOIN TASK
    query = db.query(SubTask).join(Task).filter(Task.id == task_id)

    # ✅ status
    if status:
        query = query.filter(SubTask.status == status)

    # ✅ user
    if user_id:
        query = query.join(SubTask.users).filter(User.id == user_id)

    # ✅ search
    if search:
        search = search.strip()
        if search:
            query = query.filter(SubTask.title.ilike(f"%{search}%"))

    if sort_by == "updated_at":
        sort_column = SubTask.updated_at
    elif sort_by == "title":
        sort_column = SubTask.title
    else:
        sort_column = SubTask.created_at

    query = query.order_by(
        sort_column.asc() if sort_order == "asc" else sort_column.desc()
    )

    total_count = query.count()

    subtasks = query.offset(skip).limit(limit).all()

    result = []

    for subtask in subtasks:
        result.append(
            {
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status.value,
                "task_id": subtask.task_id,
                "sprint": subtask.task.sprint,
                "created_at": subtask.created_at,
                "updated_at": subtask.updated_at,
                "users": [
                    {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "team_name": user.team_name,
                    }
                    for user in subtask.users
                ],
                "comments": {
                    "count": len(subtask.comments),
                    "data": [
                        {
                            "id": comment.id,
                            "content": comment.content,
                            "task_id": comment.task_id,
                            "subtask_id": comment.subtask_id,
                            "created_at": comment.created_at,
                            "updated_at": comment.updated_at,
                            "user": (
                                {
                                    "id": comment.user.id,
                                    "username": comment.user.username,
                                    "email": comment.user.email,
                                    "team_name": comment.user.team_name,
                                }
                                if comment.user
                                else None
                            ),
                        }
                        for comment in subtask.comments
                    ],
                },
            }
        )

    return result, total_count


def get_subtask_by_id(db: Session, subtask_id: int):
    subtask = db.query(SubTask).filter(SubTask.id == subtask_id).first()

    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    return {
        "id": subtask.id,
        "title": subtask.title,
        "status": subtask.status.value,
        "task_id": subtask.task_id,
        "sprint": subtask.task.sprint,
        "created_at": subtask.created_at,
        "updated_at": subtask.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in subtask.users
        ],
        "comments": {
            "count": len(subtask.comments),
            "data": [
                {
                    "id": comment.id,
                    "content": comment.content,
                    "task_id": comment.task_id,
                    "subtask_id": comment.subtask_id,
                    "created_at": comment.created_at,
                    "updated_at": comment.updated_at,
                    "user": (
                        {
                            "id": comment.user.id,
                            "username": comment.user.username,
                            "email": comment.user.email,
                            "team_name": comment.user.team_name,
                        }
                        if comment.user
                        else None
                    ),
                }
                for comment in subtask.comments
            ],
        },
    }


def get_subtasks_by_user(db: Session, user_id: int):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    subtasks = user.subtasks

    result = []

    for subtask in subtasks:
        result.append(
            {
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status.value,
                "task_id": subtask.task_id,
                "sprint": subtask.task.sprint,
                "created_at": subtask.created_at,
                "updated_at": subtask.updated_at,
                "comments": {
                    "count": len(subtask.comments),
                    "data": [],
                },
            }
        )

    return result


def update_subtask(db: Session, subtask_id: int, subtask_data):

    subtask = db.query(SubTask).filter(SubTask.id == subtask_id).first()

    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    update_data = subtask_data.dict(exclude_unset=True)

    try:

        if "users" in update_data:
            users = db.query(User).filter(User.id.in_(update_data["users"])).all()

            if len(users) != len(update_data["users"]):
                raise HTTPException(status_code=400, detail="Invalid user IDs")

            subtask.users = users
            del update_data["users"]

        # ✅ NEW
        if "title" in update_data:
            clean_title = update_data["title"].strip()
            normalized_title = clean_title.lower()

            existing_subtask = (
                db.query(SubTask)
                .filter(
                    SubTask.task_id == subtask.task_id,
                    func.lower(SubTask.title) == normalized_title,
                    SubTask.id != subtask_id,
                )
                .first()
            )

            if existing_subtask:
                raise HTTPException(
                    status_code=400,
                    detail="Subtask with this title already exists",
                )

            update_data["title"] = clean_title

        for key, value in update_data.items():
            setattr(subtask, key, value)

        db.commit()

    except HTTPException as e:
        db.rollback()
        raise e

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Subtask with this title already exists for this task",
        )

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error updating subtask")

    db.refresh(subtask)

    subtask = db.query(SubTask).filter(SubTask.id == subtask.id).first()

    return {
        "id": subtask.id,
        "title": subtask.title,
        "status": subtask.status.value,
        "task_id": subtask.task_id,
        "sprint": subtask.task.sprint,
        "created_at": subtask.created_at,
        "updated_at": subtask.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in subtask.users
        ],
        "comments": {
            "count": len(subtask.comments),
            "data": [
                {
                    "id": comment.id,
                    "content": comment.content,
                    "task_id": comment.task_id,
                    "subtask_id": comment.subtask_id,
                    "created_at": comment.created_at,
                    "updated_at": comment.updated_at,
                    "user": (
                        {
                            "id": comment.user.id,
                            "username": comment.user.username,
                            "email": comment.user.email,
                            "team_name": comment.user.team_name,
                        }
                        if comment.user
                        else None
                    ),
                }
                for comment in subtask.comments[:1]
            ],
        },
    }


def delete_subtask(db: Session, subtask_id: int):

    subtask = db.query(SubTask).filter(SubTask.id == subtask_id).first()

    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    try:
        db.delete(subtask)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting subtask")

    return {"message": "Subtask deleted successfully"}


def delete_subtasks_bulk(db: Session, task_id: int, ids: list[int]):
    subtasks = (
        db.query(SubTask)
        .filter(
            SubTask.task_id == task_id,
            SubTask.id.in_(ids),
        )
        .all()
    )

    if not subtasks:
        raise HTTPException(status_code=404, detail="No Subtasks found to delete")

    deleted_ids = [subtask.id for subtask in subtasks]

    try:
        for subtask in subtasks:
            db.delete(subtask)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting subtasks")

    return {
        "message": f"{len(deleted_ids)} Subtasks deleted successfully",
        "deleted_ids": deleted_ids,
    }
