import json
from typing import Optional

from app.core.rbac import require_permission
from app.core.redis_client import redis_client
from app.db.session import get_db
from app.models.model_task import Task
from app.schemas.schemas_enums import StatusEnum
from app.schemas.schemas_task import (
    KanbanResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.services import services_task
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("task.create")),
):

    result = services_task.create_task(db, task)

    try:
        redis_client.setex(
            f"task:{result['id']}",
            300,
            json.dumps(TaskResponse.model_validate(result).model_dump(mode="json")),
        )
    except Exception:
        pass

    try:
        for key in redis_client.scan_iter("tasks:*"):
            redis_client.delete(key)
        redis_client.delete("tasks:sprints")

    except Exception:
        pass

    return result


@router.get("/", response_model=dict)
def get_tasks(
    page: int = 1,
    page_size: int = 10,
    status: Optional[StatusEnum] = Query(default=None),
    sprint: Optional[str] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_by: str = Query(
        default="created_at",
        pattern="^(created_at|updated_at|title)$",
    ),
    sort_order: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
    ),
    db: Session = Depends(get_db),
):

    skip = (page - 1) * page_size
    limit = page_size

    def normalize(value):
        if value is None:
            return "null"
        if hasattr(value, "value"):
            return value.value
        return str(value).strip().lower() if value != "" else "null"

    cache_key = (
        f"tasks:"
        f"{normalize(status)}:"
        f"{normalize(sprint)}:"
        f"{normalize(user_id)}:"
        f"{normalize(search)}:"
        f"{sort_by}:"
        f"{sort_order}:"
        f"{page}:{page_size}"
    )

    cached_data = None
    try:
        cached_data = redis_client.get(cache_key)
    except Exception:
        pass

    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception:
            redis_client.delete(cache_key)

    tasks, total = services_task.get_tasks(
        db,
        skip=skip,
        limit=limit,
        status=status,
        sprint=sprint,
        user_id=user_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    response = {
        "results": tasks,
        "count": total,
        "page": page,
        "page_size": page_size,
    }

    if tasks:
        try:
            redis_client.setex(cache_key, 180, json.dumps(response, default=str))
        except Exception:
            pass

    return response


@router.get("/sprints")
def get_sprints(db: Session = Depends(get_db)):
    cache_key = "tasks:sprints"

    cached_data = None
    try:
        cached_data = redis_client.get(cache_key)
    except Exception:
        pass

    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception:
            redis_client.delete(cache_key)

    sprints = db.query(Task.sprint).filter(Task.sprint.isnot(None)).distinct().all()
    sprint_list = [s[0] for s in sprints if s[0]]

    if sprint_list:
        try:
            redis_client.setex(cache_key, 900, json.dumps(sprint_list))
        except Exception:
            pass

    return sprint_list


@router.get("/kanban", response_model=KanbanResponse)
def get_kanban_tasks(
    sprint: Optional[str] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    backlog_page: int = Query(default=1),
    todo_page: int = Query(default=1),
    in_progress_page: int = Query(default=1),
    in_review_page: int = Query(default=1),
    qa_page: int = Query(default=1),
    completed_page: int = Query(default=1),
    sort_by: str = Query(
        default="created_at",
        pattern="^(created_at|updated_at|title)$",
    ),
    sort_order: str = Query(
        default="desc",
        pattern="^(asc|desc)$",
    ),
    db: Session = Depends(get_db),
):
    def normalize(value):
        if value is None or value == "":
            return "null"
        return str(value).strip().lower()

    cache_key = (
        f"tasks:kanban:"
        f"{normalize(sprint)}:"
        f"{normalize(user_id)}:"
        f"{normalize(search)}:"
        f"{sort_by}:"
        f"{sort_order}:"
        f"{backlog_page}:{todo_page}:{in_progress_page}:"
        f"{in_review_page}:{qa_page}:{completed_page}"
    )

    cached_data = None
    try:
        cached_data = redis_client.get(cache_key)
    except Exception:
        pass

    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception:
            redis_client.delete(cache_key)

    result = services_task.get_kanban_tasks(
        db=db,
        sprint=sprint,
        user_id=user_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        backlog_page=backlog_page,
        todo_page=todo_page,
        in_progress_page=in_progress_page,
        in_review_page=in_review_page,
        qa_page=qa_page,
        completed_page=completed_page,
    )

    try:
        redis_client.setex(cache_key, 180, json.dumps(result, default=str))
    except Exception:
        pass

    return result


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    cache_key = f"task:{task_id}"

    cached_data = None
    try:
        cached_data = redis_client.get(cache_key)
    except Exception:
        pass

    if cached_data:
        try:
            return json.loads(cached_data)
        except Exception:
            redis_client.delete(cache_key)

    task = services_task.get_task(db, task_id)

    try:
        redis_client.setex(
            cache_key,
            300,
            json.dumps(TaskResponse.model_validate(task).model_dump(mode="json")),
        )
    except Exception:
        pass

    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("task.update")),
):

    result = services_task.update_task(db, task_id, task)

    try:
        redis_client.setex(
            f"task:{task_id}",
            300,
            json.dumps(TaskResponse.model_validate(result).model_dump(mode="json")),
        )
    except Exception:
        pass

    try:
        for key in redis_client.scan_iter("tasks:*"):
            redis_client.delete(key)
        redis_client.delete("tasks:sprints")
    except Exception:
        pass

    return result


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("task.delete")),
):

    result = services_task.delete_task(db, task_id)

    try:
        redis_client.delete(f"task:{task_id}")

        for key in redis_client.scan_iter("tasks:*"):
            redis_client.delete(key)

        redis_client.delete("tasks:sprints")
    except Exception:
        pass

    return result
