"""Create activity records inside the caller's database transaction."""
from sqlmodel import Session

from models.activity import Activity


def record_activity(
    session: Session,
    ticket_id: int,
    event_type: str,
    description: str,
) -> Activity:
    event = Activity(
        ticket_id=ticket_id,
        event_type=event_type,
        description=description,
    )
    session.add(event)
    # Do not commit here: the ticket/message and its history must commit together.
    return event
