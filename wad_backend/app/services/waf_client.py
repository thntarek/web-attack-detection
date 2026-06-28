import httpx

WAF_URL = "http://192.168.122.109/submit"

TIMEOUT = 10


async def waf_prediction(session: httpx.AsyncClient, payload: str) -> int:
    """Return 1 if malicious (403), 0 if benign (200). Raises on other status codes."""
    try:
        response = await session.get(
            WAF_URL,
            params={"data": payload},
            timeout=TIMEOUT,
        )
        if response.status_code == 403:
            return 1
        elif response.status_code == 200:
            return 0
        else:
            print(
                f"Unexpected status {response.status_code} for payload: {payload[:50]}..."
            )
            return 0
    except httpx.RequestError as e:
        print(f"Request failed for payload {payload[:50]}...: {e}")
        return None


async def call_waf(payload: str) -> int | None:
    """Create a session and call the WAF endpoint."""
    async with httpx.AsyncClient() as client:
        return await waf_prediction(client, payload)
