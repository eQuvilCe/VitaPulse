import asyncio
import io

import pytest
from fastapi import HTTPException, UploadFile

from app.services.uploads import read_image, sniff

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 16
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 16


def upload(data: bytes) -> UploadFile:
    return UploadFile(io.BytesIO(data), filename="photo")


def test_sniff_recognises_supported_formats():
    assert sniff(PNG) == ("image/png", "png")
    assert sniff(JPEG) == ("image/jpeg", "jpg")
    assert sniff(WEBP) == ("image/webp", "webp")
    assert sniff(b"GIF89a" + b"\x00" * 8) == ("image/gif", "gif")


def test_sniff_rejects_unknown_bytes():
    assert sniff(b"<html></html>") is None
    assert sniff(b"") is None


def test_read_image_rejects_disallowed_type():
    with pytest.raises(HTTPException) as err:
        asyncio.run(read_image(upload(PNG), 1024, {"image/jpeg"}))
    assert err.value.status_code == 415


def test_read_image_rejects_oversized_file():
    with pytest.raises(HTTPException) as err:
        asyncio.run(read_image(upload(PNG + b"\x00" * 2048), 1024, {"image/png"}))
    assert err.value.status_code == 413


def test_read_image_returns_bytes_and_extension():
    data, media_type, ext = asyncio.run(read_image(upload(JPEG), 1024, {"image/jpeg"}))
    assert (data, media_type, ext) == (JPEG, "image/jpeg", "jpg")
