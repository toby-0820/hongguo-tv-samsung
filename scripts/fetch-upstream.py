"""Fetch pinned external build inputs; no external bundle is committed."""
import hashlib
import io
import pathlib
import tarfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
INPUTS = [
    ("117", "48661d322449464bfcb6ea2a5f63a9f512da08b84790254c1a21205cf1acb84c"),
    ("127", "6b1fe06eff96f3520b3a728044b02d82a987b0765f1d43e16b3314e8d5fbd838"),
]


def ar_members(data):
    if data[:8] != b"!<arch>\n":
        raise ValueError("Invalid IPK/ar header")
    offset = 8
    while offset < len(data):
        header = data[offset:offset + 60]
        if len(header) != 60 or header[58:60] != b"`\n":
            raise ValueError("Invalid ar member")
        size = int(header[48:58])
        start = offset + 60
        if start + size > len(data):
            raise ValueError("Truncated ar member")
        yield header[:16].decode("ascii").strip().rstrip("/"), data[start:start + size]
        offset = start + size + size % 2


for version, expected in INPUTS:
    cache = ROOT / ".cache" / ("upstream-" + version)
    cache.mkdir(parents=True, exist_ok=True)
    archive = cache / "upstream.ipk"
    if not archive.exists():
        url = ("https://github.com/aston314/hongguo-tv-releases/releases/download/"
               f"webos-v0.2.{version}-test.25/hongguo-webos-0.2.{version}-test.25.ipk")
        request = urllib.request.Request(url, headers={"User-Agent": "Samsung-adapter-build"})
        with urllib.request.urlopen(request, timeout=90) as response:
            data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise ValueError("Unexpected archive size")
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError("SHA256 mismatch; refusing changed upstream bundle")
        archive.write_bytes(data)
    data = archive.read_bytes()
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError("Cached archive SHA256 mismatch")
    members = dict(ar_members(data))
    payload = members["data.tar.gz"]
    with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as contents:
        total = 0
        for member in contents.getmembers():
            destination = (cache / member.name).resolve()
            if not destination.is_relative_to(cache.resolve()):
                raise ValueError("Unsafe archive path")
            if not (member.isfile() or member.isdir()):
                raise ValueError("Links and special files are not accepted")
            if member.isdir():
                destination.mkdir(parents=True, exist_ok=True)
                continue
            total += member.size
            if total > 32 * 1024 * 1024:
                raise ValueError("Unexpected expanded size")
            destination.parent.mkdir(parents=True, exist_ok=True)
            with contents.extractfile(member) as source:
                destination.write_bytes(source.read())
    print("Verified external input:", version, expected)
