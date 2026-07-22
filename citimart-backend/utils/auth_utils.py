import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from bson import ObjectId

from config import JWT_SECRET_KEY
from database import users_collection, vendors_collection

# ------------------ Generate JWT Token ------------------
def generate_token(user_id, role, expires_in=86400):
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')


# ------------------ Verify JWT Token ------------------
def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ------------------ Token Required Decorator ------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            role = data.get("role")
            user_id = data.get("user_id")

            if not user_id:
                return jsonify({'error': 'Invalid token data'}), 400

            if role == "vendor":
                current_user = vendors_collection.find_one({"_id": ObjectId(user_id)})
            else:
                current_user = users_collection.find_one({"_id": ObjectId(user_id)})

            if not current_user:
                return jsonify({'error': 'User not found'}), 404

            # Ensure user ID is always a string for consistent comparison
            current_user["_id"] = str(current_user["_id"])
            current_user["role"] = role

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            role = data.get("role")
            user_id = data.get("user_id")

            if not user_id or role != "admin":
                return jsonify({'error': 'Unauthorized access'}), 403

            current_admin = users_collection.find_one({"_id": ObjectId(user_id)})
            if not current_admin:
                return jsonify({'error': 'Admin not found'}), 404

            current_admin["_id"] = str(current_admin["_id"])
            current_admin["role"] = role

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_admin, *args, **kwargs)

    return decorated
