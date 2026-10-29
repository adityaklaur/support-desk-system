"""Ticket operations, search, filtering, business rules, and serialization."""
import time
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy import case, func, or_
from sqlmodel import Session, select

from models import Activity, Message, Ticket
from schemas.message_schema import MessageCreate, MessageRead
from schemas.ticket_schema import (
    ActivityRead,
    TicketCreate,
    TicketDetail,
    TicketPriority,
    TicketRead,
    TicketStatus,
    TicketUpdate,
)
from services.history_service import record_activity

SECONDS_IN_24_HOURS = 24 * 60 * 60
SortBy = Literal["updated", "priority"]


def is_overdue(ticket: Ticket, now: int | None = None) -> bool:
    if now is None:
        now = int(time.time())
    return ticket.status != "Resolved" and (now - ticket.created_at) > SECONDS_IN_24_HOURS


def as_ticket_read(ticket: Ticket) -> TicketRead:
    return TicketRead.model_validate(
        {**ticket.model_dump(), "overdue": is_overdue(ticket)}
    )


def require_ticket(session: Session, ticket_id: int) -> Ticket:
    ticket = session.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} not found",
        )
    return ticket


def get_ticket_detail(session: Session, ticket_id: int) -> TicketDetail:
    ticket = require_ticket(session, ticket_id)
    messages = session.exec(
        select(Message)
        .where(Message.ticket_id == ticket_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    ).all()
    history = session.exec(
        select(Activity)
        .where(Activity.ticket_id == ticket_id)
        .order_by(Activity.created_at.asc(), Activity.id.asc())
    ).all()
    return TicketDetail(
        **as_ticket_read(ticket).model_dump(),
        messages=[MessageRead.model_validate(message) for message in messages],
        history=[ActivityRead.model_validate(event) for event in history],
    )


def _touch(ticket: Ticket) -> None:
    # Unix seconds are used by Stage 3. Ensure consecutive quick edits
    # still sort in their actual update order.
    ticket.updated_at = max(int(time.time()), ticket.updated_at + 1)


def create_ticket(session: Session, payload: TicketCreate) -> TicketRead:
    ticket = Ticket(**payload.model_dump())
    try:
        session.add(ticket)
        session.flush()  # Assign ticket.id without committing yet.
        assert ticket.id is not None
        record_activity(session, ticket.id, "ticket_created", "Ticket created")
        if ticket.assignee:
            record_activity(
                session,
                ticket.id,
                "assignee_changed",
                f"Assigned to {ticket.assignee}",
            )
        session.commit()
        session.refresh(ticket)
        return as_ticket_read(ticket)
    except Exception:
        session.rollback()
        raise


def update_ticket(
    session: Session, ticket_id: int, payload: TicketUpdate
) -> TicketRead:
    ticket = require_ticket(session, ticket_id)
    changes = payload.model_dump(exclude_unset=True)
    try:
        changed = False
        for field, new_value in changes.items():
            old_value = getattr(ticket, field)
            if old_value == new_value:
                continue
            changed = True
            setattr(ticket, field, new_value)
            if field == "status":
                event_type = "status_changed"
                description = f"Status changed from {old_value} to {new_value}"
            elif field == "priority":
                event_type = "priority_changed"
                description = f"Priority changed from {old_value} to {new_value}"
            elif field == "assignee":
                event_type = "assignee_changed"
                description = (
                    f"Assignee changed from {old_value or 'Unassigned'} "
                    f"to {new_value or 'Unassigned'}"
                )
            else:
                event_type = "ticket_edited"
                description = f"{field.replace('_', ' ').capitalize()} updated"
            record_activity(session, ticket_id, event_type, description)
        if changed:
            _touch(ticket)
            session.add(ticket)
            session.commit()
            session.refresh(ticket)
        return as_ticket_read(ticket)
    except Exception:
        session.rollback()
        raise


def add_message(
    session: Session, ticket_id: int, payload: MessageCreate
) -> MessageRead:
    ticket = require_ticket(session, ticket_id)
    message = Message(ticket_id=ticket_id, **payload.model_dump())
    try:
        session.add(message)
        _touch(ticket)
        session.add(ticket)
        record_activity(
            session,
            ticket_id,
            "internal_note_added" if payload.is_internal else "public_reply_added",
            f"{'Internal note' if payload.is_internal else 'Public reply'} added by {payload.author}",
        )
        session.commit()
        session.refresh(message)
        return MessageRead.model_validate(message)
    except Exception:
        session.rollback()
        raise


def _escaped_like(value: str) -> str:
    """Treat %, _ and backslash as ordinary search characters."""
    value = value.lower().replace("\\", "\\\\")
    return value.replace("%", "\\%").replace("_", "\\_")


def list_tickets(
    session: Session,
    search: str | None = None,
    status_filter: TicketStatus | None = None,
    priority_filter: TicketPriority | None = None,
    assignee: str | None = None,
    sort_by: SortBy = "updated",
) -> list[TicketRead]:
    query = select(Ticket)
    if search and search.strip():
        pattern = f"%{_escaped_like(search.strip())}%"
        query = query.where(
            or_(
                func.lower(Ticket.subject).like(pattern, escape="\\"),
                func.lower(Ticket.customer).like(pattern, escape="\\"),
            )
        )
    if status_filter is not None:
        query = query.where(Ticket.status == status_filter)
    if priority_filter is not None:
        query = query.where(Ticket.priority == priority_filter)
    if assignee and assignee.strip():
        query = query.where(func.lower(Ticket.assignee) == assignee.strip().lower())

    if sort_by == "priority":
        priority_order = case(
            (Ticket.priority == "Urgent", 1),
            (Ticket.priority == "High", 2),
            (Ticket.priority == "Medium", 3),
            (Ticket.priority == "Low", 4),
            else_=5,
        )
        query = query.order_by(
            priority_order.asc(), Ticket.updated_at.desc(), Ticket.id.desc()
        )
    else:
        query = query.order_by(Ticket.updated_at.desc(), Ticket.id.desc())

    return [as_ticket_read(ticket) for ticket in session.exec(query).all()]
