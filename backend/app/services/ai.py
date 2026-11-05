"""Thin wrapper over the Anthropic SDK.

Every caller has a deterministic fallback, so any failure here (no key, network,
refusal, malformed output) raises AIUnavailable and the caller switches to it.
"""

import logging
from functools import lru_cache
from typing import TypeVar

import anthropic
from pydantic import BaseModel

from app.config import settings

log = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# "default" lets the API retry a declined request on the recommended model.
FALLBACK_BETA = "server-side-fallback-2026-07-01"


class AIUnavailable(Exception):
    pass


@lru_cache
def _client(api_key: str) -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=api_key, timeout=120.0, max_retries=2)


def _check_enabled() -> anthropic.Anthropic:
    if not settings.ai_enabled:
        raise AIUnavailable("ANTHROPIC_API_KEY is not set")
    return _client(settings.anthropic_api_key)


def _call(*, stream: bool = False, **kwargs):
    client = _check_enabled()
    params = {"model": settings.ai_model, "betas": [FALLBACK_BETA], "fallbacks": "default"}
    try:
        if stream:
            # Long outputs stream so the request is not cut by HTTP timeouts.
            with client.beta.messages.stream(**params, **kwargs) as s:
                response = s.get_final_message()
        else:
            response = client.beta.messages.parse(**params, **kwargs)
    except anthropic.APIConnectionError as e:
        log.warning("AI connection failed: %s", e)
        raise AIUnavailable("connection") from e
    except anthropic.APIStatusError as e:
        log.warning("AI request failed (%s, request %s): %s", e.status_code, e.request_id, e)
        raise AIUnavailable(str(e.status_code)) from e
    except ValueError as e:  # structured output that does not match the schema
        log.warning("AI output did not parse: %s", e)
        raise AIUnavailable("parse") from e
    if response.stop_reason in ("refusal", "max_tokens"):
        log.warning("AI stopped with %s", response.stop_reason)
        raise AIUnavailable(response.stop_reason)
    return response


def structured(
    schema: type[T],
    system: str,
    content: str | list,
    *,
    max_tokens: int = 4000,
    effort: str = "low",
    timeout: float | None = None,
    stream: bool = False,
) -> T:
    """One request whose answer is validated against `schema`."""
    response = _call(
        stream=stream,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": content}],
        output_format=schema,
        output_config={"effort": effort},
        **({"timeout": timeout} if timeout else {}),
    )
    if response.parsed_output is None:
        raise AIUnavailable("empty")
    return response.parsed_output


def chat(system: str, messages: list[dict], *, max_tokens: int = 2000) -> str:
    response = _call(
        max_tokens=max_tokens,
        system=system,
        messages=messages,
        output_config={"effort": "low"},
    )
    text = "".join(b.text for b in response.content if b.type == "text").strip()
    if not text:
        raise AIUnavailable("empty")
    return text


def image_block(data: str, media_type: str) -> dict:
    return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}}
