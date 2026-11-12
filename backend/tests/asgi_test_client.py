import asyncio
import json
from collections.abc import Mapping
from typing import Any
from urllib.parse import urlsplit


class ASGIResponse:
    def __init__(self, messages: list[dict[str, Any]]) -> None:
        start = next(message for message in messages if message["type"] == "http.response.start")
        self.status_code = start["status"]
        self.headers = {
            key.decode("latin-1").lower(): value.decode("latin-1")
            for key, value in start.get("headers", [])
        }
        self.content = b"".join(
            message.get("body", b"")
            for message in messages
            if message["type"] == "http.response.body"
        )
        self.text = self.content.decode("utf-8")

    def json(self) -> Any:
        return json.loads(self.content)


class ASGITestClient:
    """Small in-process HTTP/ASGI driver that avoids TestClient transport versions."""

    def __init__(self, app: Any, timeout: float = 1.5) -> None:
        self.app = app
        self.timeout = timeout

    async def get(
        self,
        target: str,
        headers: Mapping[str, str] | None = None,
    ) -> ASGIResponse:
        parsed = urlsplit(target)
        path = parsed.path or "/"
        request_delivered = False
        sent: list[dict[str, Any]] = []

        async def receive() -> dict[str, Any]:
            nonlocal request_delivered
            if not request_delivered:
                request_delivered = True
                return {"type": "http.request", "body": b"", "more_body": False}
            return {"type": "http.disconnect"}

        async def send(message: dict[str, Any]) -> None:
            sent.append(message)

        scope = {
            "type": "http",
            "asgi": {"version": "3.0", "spec_version": "2.3"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": parsed.scheme or "http",
            "path": path,
            "raw_path": path.encode("ascii"),
            "query_string": parsed.query.encode("ascii"),
            "root_path": "",
            "headers": [
                (key.lower().encode("latin-1"), value.encode("latin-1"))
                for key, value in (headers or {}).items()
            ],
            "client": ("testclient", 1234),
            "server": (parsed.netloc or "testserver", 80),
        }
        await asyncio.wait_for(self.app(scope, receive, send), timeout=self.timeout)
        return ASGIResponse(sent)
