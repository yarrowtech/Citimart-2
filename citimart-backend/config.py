import os

MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
SECRET_KEY = JWT_SECRET_KEY
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Comma-separated list, e.g. "https://citimart.com,https://www.citimart.com".
# Defaults to the local dev frontend ports so nothing changes for local development.
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
    if o.strip()
]

# Fail fast with a clear message instead of a confusing error later
# (e.g. pymongo hanging on MONGO_URI=None, or JWTs silently failing to sign).
if not MONGO_URI:
    raise RuntimeError("MONGO_URI environment variable is not set — check your .env file.")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set — check your .env file.")