"""Public replies and internal notes."""
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from database import get_session
from schemas.message_schema import MessageCreate, MessageRead
from services.ticket_service import add_message

router = APIRouter(prefix="/api/tickets", tags=["Messages"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.post(
    "/{ticket_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
def post_message(ticket_id: int, payload: MessageCreate, session: SessionDep):
    return add_message(session, ticket_id, payload)
