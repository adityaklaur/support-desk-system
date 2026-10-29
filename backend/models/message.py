import time

from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="tickets.id", index=True)
    author: str = Field(max_length=100)
    content: str = Field(max_length=5000)
    is_internal: bool = Field(default=False)
    created_at: int = Field(default_factory=lambda: int(time.time()), index=True)
