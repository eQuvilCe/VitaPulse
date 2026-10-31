"""Checks for uploaded images: the bytes decide the type, not the client's header."""

from fastapi import HTTPException, UploadFile, status

SIGNATURES = [
    (b"\xff\xd8\xff", "image/jpeg", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", "png"),
    (b"GIF87a", "image/gif", "gif"),
    (b"GIF89a", "image/gif", "gif"),
]


def sniff(data: bytes) -> tuple[str, str] | None:
    """(media type, extension) for a supported image, else None."""
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp", "webp"
    for magic, media_type, ext in SIGNATURES:
        if data.startswith(magic):
            return media_type, ext
    return None


async def read_image(file: UploadFile, max_bytes: int, allowed: set[str]) -> tuple[bytes, str, str]:
    data = await file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status.HTTP_413_CONTENT_TOO_LARGE, f"Image is larger than {max_bytes // 2**20} MB"
        )
    kind = sniff(data)
    if kind is None or kind[0] not in allowed:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported image type")
    return data, kind[0], kind[1]
