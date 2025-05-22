from fastapi import Request
from uuid import uuid4

def get_or_create_session_id(request: Request) -> (str, bool):
    session_id = request.cookies.get("session_id")
    is_new = False
    if not session_id:
        session_id = str(uuid4())
        is_new = True
    return session_id, is_new