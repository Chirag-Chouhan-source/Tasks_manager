from app.core.redis_client import redis_client
from app.models.model_comments import Comment
from app.models.model_subtasks import SubTask
from app.models.model_task import Task
from app.models.model_users import User
from fastapi import HTTPException
from sqlalchemy.orm import Session


def create_task_comment(db: Session, task_id: int, data):

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, detail="Task not found")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(400, detail="Invalid user")

    comment = Comment(content=data.content, task_id=task_id, user_id=data.user_id)

    db.add(comment)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating comment")

    db.refresh(comment)
    try:
        redis_client.delete(f"task:{task_id}")
        for key in redis_client.scan_iter("tasks:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return {
        "id": comment.id,
        "content": comment.content,
        "task_id": comment.task_id,
        "subtask_id": comment.subtask_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "team_name": user.team_name,
        },
    }


def create_subtask_comment(db: Session, subtask_id: int, data):

    subtask = db.query(SubTask).filter(SubTask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(404, "Subtask not found")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(400, "Invalid user")

    comment = Comment(
        content=data.content,
        subtask_id=subtask_id,
        user_id=data.user_id,
    )

    db.add(comment)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating comment")

    db.refresh(comment)

    try:
        redis_client.delete(f"task:{subtask.task_id}")
        redis_client.delete(f"subtask:{subtask_id}")
        for key in redis_client.scan_iter(f"subtasks:{subtask.task_id}:*"):
            redis_client.delete(key)
        for key in redis_client.scan_iter("tasks:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return {
        "id": comment.id,
        "content": comment.content,
        "task_id": comment.task_id,
        "subtask_id": comment.subtask_id,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "team_name": user.team_name,
        },
    }


def get_task_comments(db: Session, task_id: int):

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    comments = db.query(Comment).filter(Comment.task_id == task_id).all()

    result = []

    for comment in comments:
        result.append(
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
        )

    return result


def get_subtask_comments(db: Session, subtask_id: int):

    subtask = db.query(SubTask).filter(SubTask.id == subtask_id).first()
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")

    comments = db.query(Comment).filter(Comment.subtask_id == subtask_id).all()

    result = []

    for comment in comments:
        result.append(
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
        )

    return result
