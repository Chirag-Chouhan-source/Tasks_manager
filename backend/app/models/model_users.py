from app.db.base import Base
from app.models.model_association import user_task_association
from app.models.model_subtask_association import user_subtask_association
from app.models.model_user_role_association import user_role_association
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    team_name = Column(String(255), nullable=True)

    tasks = relationship(
        "Task", secondary=user_task_association, back_populates="users"
    )

    comments = relationship("Comment", back_populates="user", cascade="all, delete")

    subtasks = relationship(
        "SubTask", secondary=user_subtask_association, back_populates="users"
    )

    roles = relationship(
        "Role",
        secondary=user_role_association,
        back_populates="users",
    )
