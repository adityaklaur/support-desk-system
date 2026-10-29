from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from schemas.message_schema import MessageRead

TicketStatus = Literal["Open", "In Progress", "Waiting on Customer", "Resolved"]
TicketPriority = Literal["Low", "Medium", "High", "Urgent"]


class TicketCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    subject: str = Field(min_length=1, max_length=200)
    customer: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=5000)
    status: TicketStatus = "Open"
    priority: TicketPriority = "Medium"
    assignee: str | None = Field(default=None, max_length=100)

    @field_validator("assignee")
    @classmethod
    def normalize_assignee(cls, value: str | None) -> str | None:
        return value or None


class TicketUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    subject: str | None = Field(default=None, min_length=1, max_length=200)
    customer: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=5000)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    assignee: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def reject_null_for_required_fields(self):
        for field_name in ("subject", "customer", "description", "status", "priority"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null")
        return self

    @field_validator("assignee")
    @classmethod
    def normalize_assignee(cls, value: str | None) -> str | None:
        return value or None


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    customer: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    assignee: str | None
    created_at: int
    updated_at: int
    overdue: bool  # Compute when building API responses; never store in the DB.


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    event_type: str
    description: str
    created_at: int


class TicketDetail(TicketRead):
    messages: list[MessageRead] = Field(default_factory=list)
    history: list[ActivityRead] = Field(default_factory=list)
