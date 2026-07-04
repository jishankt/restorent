"""
extensions.py — shared Flask extension instances.

Imported by both app.py (to bind to the Flask app) and routes.py (to use as a decorator).
This avoids circular imports while keeping limiter at module scope.
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],          # no blanket default — each route opts in explicitly
    storage_uri="memory://",    # swap to redis:// for multi-worker deployments
)