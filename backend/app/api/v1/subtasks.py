import json
from typing import Optional

from app.core.rbac import require_permission
from app.core.redis_client import redis_client
from app.db.session import get_db
from app.schemas.schemas_subtasks import (
    SubTaskCreate,
    SubTaskListResponse,
    SubTaskResponse,
    SubTaskUpdate,
    SubTaskBulkDeleteResponse,
    SubTaskBulkDelete,
)
from app.services import services_subtask
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(
    tags=["Subtasks"],
)


@router.post("/tasks/{task_id}/subtasks", response_model=SubTaskResponse)
def create_subtask(
    task_id: int,
    subtask: SubTaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("subtask.create")),
):

    result = services_subtask.create_subtask(db, task_id, subtask)

    # ✅ cache single subtask
    try:
        redis_client.setex(
            f"subtask:{result['id']}",
            180,
            json.dumps(SubTaskResponse.model_validate(result).model_dump()),
        )
    except Exception:
        pass

    # ✅ invalidate list cache
    try:
        for key in redis_client.scan_iter(f"subtasks:{task_id}:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return result


@router.get("/tasks/{task_id}/subtasks", response_model=SubTaskListResponse)
def get_subtasks(
    task_id: int,
    status: Optional[str] = Query(default=None),
    user_id: Optional[int] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1),
    page_size: int = Query(default=5),
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
        f"subtasks:"
        f"{task_id}:"
        f"{normalize(status)}:"
        f"{normalize(user_id)}:"
        f"{normalize(search)}:"
        f"{sort_by}:"
        f"{sort_order}:"
        f"{page}:"
        f"{page_size}"
    )

    # ✅ safe cache read
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

    # ✅ service call
    subtasks, total_count = services_subtask.get_subtasks(
        db,
        task_id=task_id,
        status=status,
        user_id=user_id,
        search=search,
        skip=(page - 1) * page_size,
        limit=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    response = {
        "count": total_count,
        "page": page,
        "page_size": page_size,
        "results": subtasks,
    }

    # ✅ safe cache write
    if subtasks:
        try:
            redis_client.setex(
                cache_key,
                180,
                json.dumps(response),
            )
        except Exception:
            pass

    return response


@router.get("/subtasks/{subtask_id}", response_model=SubTaskResponse)
def get_subtask_by_id(subtask_id: int, db: Session = Depends(get_db)):

    cache_key = f"subtask:{subtask_id}"

    # ✅ safe cache read
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

    # ✅ service call
    subtask = services_subtask.get_subtask_by_id(db, subtask_id)

    # ✅ cache write
    try:
        redis_client.setex(
            cache_key,
            300,
            json.dumps(SubTaskResponse.model_validate(subtask).model_dump()),
        )
    except Exception:
        pass

    return subtask


@router.patch("/subtasks/{subtask_id}", response_model=SubTaskResponse)
def update_subtask(
    subtask_id: int,
    subtask: SubTaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("subtask.update")),
):

    result = services_subtask.update_subtask(db, subtask_id, subtask)

    # ✅ update cache
    try:
        redis_client.setex(
            f"subtask:{subtask_id}",
            60,
            json.dumps(SubTaskResponse.model_validate(result).model_dump()),
        )
    except Exception:
        pass

    # ✅ invalidate list cache
    try:
        for key in redis_client.scan_iter("subtasks:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return result


@router.delete("/subtasks/bulk", response_model=SubTaskBulkDeleteResponse)
def delete_subtasks_bulk(
    payload: SubTaskBulkDelete,
    db: session = Depends(get_db),
    current_user=Depends(require_permission("subtask.delete")),
):

    result = services_subtask.delete_subtasks_bulk(
        db,
        task_id=payload.task_id,
        ids=payload.ids,
    )

    try:
        for subtask_id in result["deleted_ids"]:
            redis_client.delete(f"subtask:{subtask_id}")

        for key in redis_client.scan_iter(f"subtasks:{payload.task_id}:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return result


@router.delete("/subtasks/{subtask_id}")
def delete_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("subtask.delete")),
):

    result = services_subtask.delete_subtask(db, subtask_id)

    # ✅ delete cache
    try:
        redis_client.delete(f"subtask:{subtask_id}")

        for key in redis_client.scan_iter("subtasks:*"):
            redis_client.delete(key)
    except Exception:
        pass

    return result
