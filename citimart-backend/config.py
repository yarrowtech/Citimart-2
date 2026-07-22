import os

MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
SECRET_KEY = JWT_SECRET_KEY
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")