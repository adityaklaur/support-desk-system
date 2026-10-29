import time

from sqlmodel import Field, SQLModel


class Activity(SQLModel, table=True):
    __tablename__ = "activities"

    id: int | None = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="tickets.id", index=True)
    event_type: str = Field(max_length=60)
    description: str = Field(max_length=500)
    created_at: int = Field(default_factory=lambda: int(time.time()), index=True)
