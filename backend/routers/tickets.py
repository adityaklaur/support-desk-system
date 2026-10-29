"""Ticket creation, editing, listing and detail endpoints."""
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from database import get_session
from schemas.ticket_schema import (
    TicketCreate,
    TicketDetail,
    TicketPriority,
    TicketRead,
    TicketStatus,
    TicketUpdate,
)
from services.ticket_service import (
    SortBy,
    create_ticket,
    get_ticket_detail,
    list_tickets,
    update_ticket,
)

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[TicketRead])
def get_tickets(
    session: SessionDep,
    search: Annotated[str | None, Query(max_length=255)] = None,
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    assignee: Annotated[str | None, Query(max_length=100)] = None,
    sort_by: SortBy = "updated",
):
    return list_tickets(session, search, status, priority, assignee, sort_by)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TicketRead)
def post_ticket(payload: TicketCreate, session: SessionDep):
    return create_ticket(session, payload)


@router.get("/{ticket_id}", response_model=TicketDetail)
def get_single_ticket(ticket_id: int, session: SessionDep):
    return get_ticket_detail(session, ticket_id)


@router.patch("/{ticket_id}", response_model=TicketRead)
def patch_ticket(ticket_id: int, payload: TicketUpdate, session: SessionDep):
    return update_ticket(session, ticket_id, payload)
