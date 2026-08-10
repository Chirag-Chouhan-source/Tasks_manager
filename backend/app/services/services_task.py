from app.models.model_task import Task
from app.models.model_users import User
from app.schemas.schemas_enums import StatusEnum
from fastapi import HTTPException
from sqlalchemy import func  # ✅ ADD THIS IMPORT
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def create_task(db: Session, task):

    # ✅ FIX: normalize title for comparison
    normalized_title = task.title.strip().lower()

    exiting_task = (
        db.query(Task).filter(func.lower(Task.title) == normalized_title).first()
    )

    if exiting_task:
        raise HTTPException(status_code=400, detail="Task already exists")

    # ✅ FIX: save trimmed title (no trailing spaces)
    db_task = Task(
        title=task.title.strip(),
        description=task.description,
        status=(task.status or StatusEnum.backlog),
        sprint=task.sprint,
    )

    if task.users:
        users = db.query(User).filter(User.id.in_(task.users)).all()

        if len(users) != len(task.users):
            raise HTTPException(status_code=400, detail="Invalid user IDs")

        db_task.users = users

    db.add(db_task)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Duplicate entry detected")
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error Creating Task")

    db.refresh(db_task)

    return {
        "id": db_task.id,
        "title": db_task.title,
        "description": db_task.description,
        "status": db_task.status.value,
        "sprint": db_task.sprint,
        "created_at": db_task.created_at,
        "updated_at": db_task.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in db_task.users
        ],
        "subtasks": [],
        "comments": {"count": 0, "data": []},
    }


def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    status=None,
    sprint=None,
    user_id=None,
    search=None,
    sort_by="created_at",
    sort_order="desc",
):
    # ✅ Base query
    query = db.query(Task)

    # ✅ Filters
    if status:
        query = query.filter(Task.status == status)

    if sprint:
        query = query.filter(Task.sprint == sprint)

    if user_id:
        query = query.join(Task.users).filter(User.id == user_id)

    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    if sort_by == "updated_at":
        sort_column = Task.updated_at
    elif sort_by == "title":
        sort_column = Task.title
    else:
        sort_column = Task.created_at

    query = query.order_by(
        sort_column.asc() if sort_order == "asc" else sort_column.desc()
    )

    # ✅ ✅ Total count
    total = query.count()

    # ✅ Pagination
    tasks = query.offset(skip).limit(limit).all()

    result = []

    for task in tasks:
        result.append(
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status.value,
                "sprint": task.sprint,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "users": [
                    {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "team_name": user.team_name,
                    }
                    for user in task.users
                ],
                "subtasks": [
                    {
                        "id": subtask.id,
                        "title": subtask.title,
                        "status": subtask.status.value,
                        "task_id": subtask.task_id,
                        "sprint": task.sprint,
                        "users": [
                            {
                                "id": user.id,
                                "username": user.username,
                                "email": user.email,
                                "team_name": user.team_name,
                            }
                            for user in subtask.users
                        ],
                        # ✅ FIXED SUBTASK COMMENTS
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
                        "created_at": subtask.created_at,
                        "updated_at": subtask.updated_at,
                    }
                    for subtask in sorted(
                        task.subtasks,
                        key=lambda x: x.created_at,
                        reverse=True,
                    )
                ],
                # ✅ FIXED TASK COMMENTS
                "comments": {
                    "count": len(task.comments),
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
                        for comment in task.comments
                    ],
                },
            }
        )

    # ✅ Return both
    return result, total


def get_task(db: Session, task_id: int):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "sprint": task.sprint,
        "status": task.status.value,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in task.users
        ],
        "subtasks": [
            {
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status.value,
                "task_id": subtask.task_id,
                "sprint": subtask.task.sprint,  # ✅ ADD
                "users": [  # ✅ ADD
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
                "created_at": subtask.created_at,
                "updated_at": subtask.updated_at,
            }
            for subtask in task.subtasks
        ],
        "comments": {
            "count": len(task.comments),
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
                for comment in task.comments
            ],
        },
    }


def update_task(db: Session, task_id: int, task_data):
    # ✅ Fetch task
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # ✅ Get only provided fields
    update_data = task_data.dict(exclude_unset=True)

    # ✅ Duplicate title validation
    if "title" in update_data:
        normalized_title = update_data["title"].strip().lower()

        existing_task = (
            db.query(Task)
            .filter(
                func.lower(Task.title) == normalized_title,
                Task.id != task_id,
            )
            .first()
        )

        if existing_task:
            raise HTTPException(
                status_code=400,
                detail="Task title already exists",
            )

        update_data["title"] = update_data["title"].strip()

    # ✅ Handle users (many-to-many)
    if "users" in update_data:
        users = db.query(User).filter(User.id.in_(update_data["users"])).all()

        if len(users) != len(update_data["users"]):
            raise HTTPException(status_code=400, detail="Invalid user IDs")

        task.users = users
        del update_data["users"]

    # ✅ Apply updates dynamically
    for key, value in update_data.items():
        setattr(task, key, value)

    # ✅ Commit with proper error handling
    try:
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Task title already exists",
        )

    except Exception as e:
        db.rollback()
        print("Error updating task:", e)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while updating task",
        )

    db.refresh(task)

    # ✅ Structured response
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status.value,
        "sprint": task.sprint,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "team_name": user.team_name,
            }
            for user in task.users
        ],
        "subtasks": [
            {
                "id": subtask.id,
                "title": subtask.title,
                "status": subtask.status.value,
                "task_id": subtask.task_id,
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
                "created_at": subtask.created_at,
                "updated_at": subtask.updated_at,
            }
            for subtask in task.subtasks[:1]
        ],
        "comments": {
            "count": len(task.comments),
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
                for comment in task.comments[:1]
            ],
        },
    }


def delete_task(db: Session, task_id: int):

    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    try:
        db.delete(task)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Cannot delete task with existing subtasks"
        )

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting task")

    return {"message": "Task deleted successfully"}


def get_tasks_by_user(db: Session, user_id: int):

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tasks = user.tasks

    result = []

    for task in tasks:

        user_subtasks = [subtask for subtask in task.subtasks if user in subtask.users]

        result.append(
            {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status.value,
                "sprint": task.sprint,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
                "subtasks": [
                    {
                        "id": subtask.id,
                        "title": subtask.title,
                        "status": subtask.status.value,
                        "task_id": subtask.task_id,
                        "created_at": subtask.created_at,
                        "updated_at": subtask.updated_at,
                    }
                    for subtask in user_subtasks
                ],
                "comments": {
                    "count": len(task.comments),
                    "data": [],
                },
            }
        )
    return result


def get_kanban_tasks(
    db: Session,
    sprint=None,
    user_id=None,
    search=None,
    sort_by="created_at",
    sort_order="desc",
    backlog_page: int = 1,
    todo_page: int = 1,
    in_progress_page: int = 1,
    in_review_page: int = 1,
    qa_page: int = 1,
    completed_page: int = 1,
):
    result = {}

    statuses = [
        StatusEnum.backlog,
        StatusEnum.todo,
        StatusEnum.in_progress,
        StatusEnum.in_review,
        StatusEnum.qa,
        StatusEnum.completed,
    ]

    page_map = {
        StatusEnum.backlog: backlog_page,
        StatusEnum.todo: todo_page,
        StatusEnum.in_progress: in_progress_page,
        StatusEnum.in_review: in_review_page,
        StatusEnum.qa: qa_page,
        StatusEnum.completed: completed_page,
    }

    for status in statuses:

        page = page_map[status]

        tasks, total = get_tasks(
            db=db,
            skip=(page - 1) * 10,
            limit=10,
            status=status,
            sprint=sprint,
            user_id=user_id,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        result[status.value] = {
            "count": total,
            "page": page,
            "page_size": 10,
            "tasks": tasks,
        }

    return result
