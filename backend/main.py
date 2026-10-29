import os
"""SupportDesk REST API application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers import dashboard, messages, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="SupportDesk API",
    description="Comhard SupportDesk full-stack coding assessment",
    version="0.2.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_origin = os.getenv("FRONTEND_ORIGIN")

if frontend_origin:
    origins.append(frontend_origin.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://supportdesk-rouge.vercel.app",
        "https://supportdesk-git-main-adityaklaurs-projects.vercel.app",
        "https://supportdesk-igovoayep-adityaklaurs-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


app.include_router(tickets.router)
app.include_router(messages.router)
app.include_router(dashboard.router)
