from pymongo import MongoClient
from config import MONGO_URI

client = MongoClient(MONGO_URI)
db = client["citimart_db"]

users_collection = db["users"]
vendors_collection = db["vendors"]
products_collection = db["products"]
orders_collection = db["orders"]
wishlist_collection = db["wishlists"]
cart_collection = db["carts"]
offers_collection = db["offers"]
reviews_collection = db["reviews_collection"] 
complaints_collection = db["complaints"]
contact_messages_collection = db["contact_messages"]


#  admin dashboard
returns_collection = db["returns"]
logistics_collection = db["logistics"]
complaints_collection = db["complaints"]
promotions_collection = db["promotions"]
expenses_collection = db["expenses"]
payouts_collection = db["payouts"]
views_collection = db["views"]
subusers_collection = db["subusers"]

notify_collection = db["notify"]
categories_collection = db["categories"]
collections_collection = db["collections"]
checkout_sessions_collection = db["checkout_sessions"]
guest_leads_collection = db["guest_leads"]