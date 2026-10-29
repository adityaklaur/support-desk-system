import time

from sqlmodel import Field, SQLModel


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: int | None = Field(default=None, primary_key=True)
    subject: str = Field(max_length=200)
    customer: str = Field(index=True, max_length=255)
    description: str = Field(max_length=5000)
    status: str = Field(default="Open", index=True, max_length=40)
    priority: str = Field(default="Medium", index=True, max_length=20)
    assignee: str | None = Field(default=None, index=True, max_length=100)
    created_at: int = Field(default_factory=lambda: int(time.time()), index=True)
    updated_at: int = Field(default_factory=lambda: int(time.time()), index=True)
