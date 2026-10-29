"""Live ticket statistics calculated from the database."""
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from database import get_session
from models import Ticket
from services.ticket_service import is_overdue

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
SessionDep = Annotated[Session, Depends(get_session)]


class DashboardStats(BaseModel):
    total: int
    open: int
    in_progress: int
    waiting_on_customer: int
    resolved: int
    urgent: int
    overdue: int


@router.get("", response_model=DashboardStats)
def get_dashboard(session: SessionDep):
    tickets = session.exec(select(Ticket)).all()
    return DashboardStats(
        total=len(tickets),
        open=sum(t.status == "Open" for t in tickets),
        in_progress=sum(t.status == "In Progress" for t in tickets),
        waiting_on_customer=sum(t.status == "Waiting on Customer" for t in tickets),
        resolved=sum(t.status == "Resolved" for t in tickets),
        urgent=sum(t.priority == "Urgent" for t in tickets),
        overdue=sum(is_overdue(t) for t in tickets),
    )
