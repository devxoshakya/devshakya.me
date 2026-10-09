def sniff_image_type(head: bytes) -> str | None:
    """Sniffs leading magic bytes of a file buffer to verify true content type.
    Requires at least 12 bytes.
    """
    if len(head) < 12:
        return None

    # JPEG magic bytes: FF D8 FF
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    # WebP magic bytes: RIFF....WEBP
    if head[0:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"

    # AVIF magic bytes: ....ftypavif or ....ftypavis
    if head[4:8] == b"ftyp" and head[8:12] in (b"avif", b"avis"):
        return "image/avif"

    return None
