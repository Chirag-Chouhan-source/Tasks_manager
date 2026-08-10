from datetime import datetime
from typing import List, Optional

from app.schemas.schemas_comments import CommentListResponse
from app.schemas.schemas_enums import StatusEnum
from app.schemas.schemas_users import UserResponse
from pydantic import BaseModel, Field


class SubTaskBase(BaseModel):
    title: str
    status: StatusEnum | None = None


class SubTaskCreate(SubTaskBase):
    users: Optional[List[int]] = []


class SubTaskUpdate(SubTaskBase):
    title: str | None = None
    status: StatusEnum | None = None
    users: List[int] = Field(default_factory=list)


class SubTaskResponse(BaseModel):
    id: int
    title: str
    status: StatusEnum
    task_id: int

    sprint: str | None = None

    created_at: datetime
    updated_at: datetime

    users: List[UserResponse] = Field(default_factory=list)

    comments: CommentListResponse

    class Config:
        from_attributes = True


class SubTaskListResponse(BaseModel):
    count: int
    page: int
    page_size: int
    results: list[SubTaskResponse]


class SubTaskBulkDelete(BaseModel):
    task_id: int
    ids: List[int] = Field(..., min_length=1)


class SubTaskBulkDeleteResponse(BaseModel):
    message: str
    deleted_ids: List[int]
