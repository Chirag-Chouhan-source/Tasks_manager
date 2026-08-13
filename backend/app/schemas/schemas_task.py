from datetime import datetime
from typing import List

from app.schemas.schemas_comments import CommentListResponse
from app.schemas.schemas_enums import StatusEnum
from app.schemas.schemas_subtasks import SubTaskResponse
from app.schemas.schemas_users import UserResponse
from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: StatusEnum | None = None


class TaskCreate(TaskBase):
    sprint: str | None = None
    users: List[int] = Field(default_factory=list)


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: StatusEnum | None = None
    sprint: str | None = None
    users: List[int] = Field(default_factory=list)


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None = None

    status: StatusEnum

    sprint: str | None = None

    created_at: datetime
    updated_at: datetime

    users: List[UserResponse] = Field(default_factory=list)

    subtasks: List[SubTaskResponse] = Field(default_factory=list)
    comments: CommentListResponse

    class Config:
        from_attributes = True


class KanbanColumnResponse(BaseModel):
    count: int
    page: int
    page_size: int
    tasks: List[TaskResponse]


class KanbanResponse(BaseModel):
    backlog: KanbanColumnResponse
    todo: KanbanColumnResponse
    in_progress: KanbanColumnResponse
    in_review: KanbanColumnResponse
    qa: KanbanColumnResponse
    completed: KanbanColumnResponse
