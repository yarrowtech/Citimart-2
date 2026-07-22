from flask import request, jsonify
from functools import wraps
from utils.auth_utils import verify_token

# Middleware to verify JWT and optionally role
def token_required(role=None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            token = None

            # Get token from headers
            if 'Authorization' in request.headers:
                token = request.headers['Authorization'].split(" ")[1]  # Expecting "Bearer <token>"

            if not token:
                return jsonify({"error": "Token is missing"}), 401

            decoded = verify_token(token)
            if not decoded:
                return jsonify({"error": "Invalid or expired token"}), 401

            if role and decoded['role'] != role:
                return jsonify({"error": "Unauthorized"}), 403

            # Attach user info to request context
            request.user = decoded
            return f(*args, **kwargs)

        return wrapper
    return decorator
