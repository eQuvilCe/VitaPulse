from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models import ChatMessage, DailyTip
from app.schemas.plan import PlanLanguage
from app.services import advisor, userdata

router = APIRouter(tags=["coach"])

CHAT_CONTEXT_MESSAGES = 20


class TipRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day: date
    title: str
    text: str
    category: str
    source: Literal["ai", "template"]


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: PlanLanguage | None = None


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ChatReply(BaseModel):
    reply: ChatMessageRead
    source: Literal["ai", "template"]


@router.get("/tips/daily", response_model=TipRead)
def daily_tip(
    user: CurrentUser, db: DbSession, day: date | None = None, refresh: bool = False
) -> DailyTip:
    day = day or date.today()
    tip = db.scalar(select(DailyTip).where(DailyTip.user_id == user.id, DailyTip.day == day))
    if tip is not None and not refresh:
        return tip
    lang = userdata.language(user)
    source, generated = advisor.daily_tip(advisor.user_context(db, user, day), lang, day)
    if tip is None:
        tip = DailyTip(user_id=user.id, day=day)
        db.add(tip)
    tip.title, tip.text = generated.title, generated.text
    tip.category, tip.source = generated.category, source
    try:
        db.commit()
    except IntegrityError:
        # A parallel request stored today's tip first; serve that one.
        db.rollback()
        tip = db.scalar(select(DailyTip).where(DailyTip.user_id == user.id, DailyTip.day == day))
    return tip


@router.post("/chat", response_model=ChatReply)
def chat(data: ChatIn, user: CurrentUser, db: DbSession) -> ChatReply:
    recent = list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.user_id == user.id)
            .order_by(ChatMessage.id.desc())
            .limit(CHAT_CONTEXT_MESSAGES)
        )
    )[::-1]
    history = [{"role": m.role, "content": m.content} for m in recent]
    ctx = advisor.user_context(db, user, date.today())
    source, text = advisor.reply(history, data.message, ctx, userdata.language(user, data.language))
    db.add(ChatMessage(user_id=user.id, role="user", content=data.message))
    answer = ChatMessage(user_id=user.id, role="assistant", content=text)
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return ChatReply(reply=ChatMessageRead.model_validate(answer), source=source)


@router.get("/chat", response_model=list[ChatMessageRead])
def chat_history(
    user: CurrentUser, db: DbSession, limit: int = Query(default=50, ge=1, le=200)
) -> list[ChatMessage]:
    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
    )
    return list(rows)[::-1]


@router.delete("/chat", status_code=status.HTTP_204_NO_CONTENT)
def clear_chat(user: CurrentUser, db: DbSession) -> None:
    db.execute(delete(ChatMessage).where(ChatMessage.user_id == user.id))
    db.commit()
