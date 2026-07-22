import os

from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")

if not all((mongo_uri, admin_email, admin_password)):
    raise RuntimeError("MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set")

client = MongoClient(mongo_uri)
db = client["citimart"]
users = db["users"]

if users.find_one({"email": admin_email, "role": "admin"}):
    print("Admin already exists")
else:
    users.insert_one({
        "name": "Admin",
        "email": admin_email,
        "password": generate_password_hash(admin_password),
        "role": "admin",
    })
    print("Admin created successfully")