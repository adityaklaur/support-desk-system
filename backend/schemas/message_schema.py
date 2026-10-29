from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    author: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1, max_length=5000)
    is_internal: bool = False


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    author: str
    content: str
    is_internal: bool
    created_at: int
