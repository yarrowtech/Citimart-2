from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from datetime import datetime
from pymongo import MongoClient, DESCENDING
from config import MONGO_URI


client = MongoClient(MONGO_URI)
db = client["citimart_db"]

users_collection = db["users"]
vendors_collection = db["vendors"]
orders_collection = db["orders"]
products_collection = db["products"]

admin_dashboard_bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/admin")

# ---------- Helpers ----------
def parse_limit(default_val=10, max_val=100):
    try:
        n = int(request.args.get("limit", default_val))
        return max(1, min(n, max_val))
    except Exception:
        return default_val

def parse_since(param="since"):
    val = request.args.get(param)
    if not val:
        return None
    try:
        return datetime.strptime(val, "%Y-%m-%d")
    except Exception:
        return None

def fix_image_url(image_path):
    if not image_path:
        return "http://localhost:5000/static/default-product.jpg"
    if image_path.startswith("http://") or image_path.startswith("https://"):
        return image_path
    return f"http://localhost:5000{image_path}"

# ---------- 1) New Users ----------
@admin_dashboard_bp.route("/users/new", methods=["GET"])
@cross_origin()
def users_new():
    limit = parse_limit(10, 100)
    since = parse_since("since")
    query = {}
    if since:
        query["created_at"] = {"$gte": since}
    cursor = users_collection.find(query).sort([("created_at", DESCENDING), ("_id", DESCENDING)]).limit(limit)
    names = [u.get("name") or u.get("full_name") or u.get("email", "") for u in cursor if u]
    return jsonify({"data": names})

# ---------- 2) Active Vendors ----------
@admin_dashboard_bp.route("/vendors/active", methods=["GET"])
@cross_origin()
def vendors_active():
    limit = parse_limit(10, 100)
    query = {"status": {"$regex": "^approved$", "$options": "i"}}
    cursor = vendors_collection.find(query).sort([("_id", DESCENDING)]).limit(limit)
    business_names = [v.get("businessName", "No Name") for v in cursor]
    return jsonify({"data": business_names})

# ---------- 3) Best Seller Items ----------
@admin_dashboard_bp.route("/dashboard/best-items", methods=["GET"])
@cross_origin()
def best_seller_items():
    limit = parse_limit(5, 50)
    cursor = orders_collection.aggregate([
        {"$unwind": "$order_items"},
        {"$group": {"_id": "$order_items.name", "total_sold": {"$sum": "$order_items.quantity"}}},
        {"$sort": {"total_sold": -1}},
        {"$limit": limit}
    ])
    items = [{"name": doc["_id"], "sold": doc["total_sold"]} for doc in cursor if doc.get("_id")]
    return jsonify({"data": items})

# ---------- 4) Latest Orders ----------
def serialize_order(order):
    return {
        "order_id": str(order["_id"]), 
        "customer_id": str(order.get("customer_id")),
        "customer_name": get_customer_name(order.get("customer_id")),
        "order_items": [
            {
                "product_id": item.get("product_id"),
                "name": item.get("name"),
                "image":fix_image_url(item.get("image")),  
                "size": item.get("size"),
                "quantity": int(item.get("quantity", 0)), 
                "price": float(item.get("price", 0)),     
                "added_by": item.get("added_by"),
                "vendor_id": str(item.get("vendor_id")) if item.get("vendor_id") else None
            } for item in order.get("order_items", [])
        ],
        "total_amount": float(order.get("total_amount", 0)),
        "discount_applied": int(order.get("discount_applied", 0)),
        "final_amount": float(order.get("final_amount", 0)),
        "applied_offer": order.get("applied_offer"),
        "phone": order.get("phone"),
        "address": order.get("address"),
        "payment_method": order.get("payment_method"),
        "status": order.get("status"),
        "created_at": (
            order["created_at"].isoformat() 
            if isinstance(order.get("created_at"), datetime) 
            else str(order.get("created_at"))
        )
    }

def get_customer_name(customer_id):
    if not customer_id:
        return "Unknown"
    customer = users_collection.find_one({"_id": ObjectId(customer_id)})
    return customer.get("name", "Unknown") if customer else "Unknown"


# --- API route: latest orders for admin dashboard ---
@admin_dashboard_bp.route("/admin/latest-orders", methods=["GET"])
def get_latest_orders():
    try:
        limit = int(request.args.get("limit", 10))  # default 10
        orders = list(orders_collection.find().sort("created_at", -1).limit(limit))
        serialized_orders = [serialize_order(order) for order in orders]
        return jsonify(serialized_orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- 5) Users Roles Summary ----------
@admin_dashboard_bp.route("/users/roles", methods=["GET"])
@cross_origin()
def users_roles_summary():
    data = list(users_collection.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "name": "$_id", "count": 1}}
    ]))
    return jsonify({"data": data})

# ---------- 6) Vendors Status Summary ----------
@admin_dashboard_bp.route("/vendors/status", methods=["GET"])
@cross_origin()
def vendors_status_summary():
    data = list(vendors_collection.aggregate([
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$project": {"_id": 0, "name": "$_id", "count": 1}}
    ]))
    return jsonify({"data": data})


# ---------- 7) Stock Analysis ----------
@admin_dashboard_bp.route("/dashboard/stock-analysis", methods=["GET"])
def stock_analysis():
    try:
        DEFAULT_IMAGE = "https://res.cloudinary.com/<your-cloud-name>/image/upload/v123456789/default-product.jpg"
        products = list(db["products"].find({}))

        stock_data = []
        for product in products:
            name = product.get("name", "Unnamed Product")

            # Go through variants if they exist
            variants = product.get("variants", [])
            if not variants:
                stock_data.append({
                    "image": product.get("image") or DEFAULT_IMAGE,
                    "name": name,
                    "productId": product.get("productId", "N/A"),
                    "quantity": product.get("quantity", 0),
                    "size": "-",
                    "status": "Out of Stock" if product.get("quantity", 0) == 0 else "Low Stock"
                })
            else:
                for variant in variants:
                    qty = variant.get("quantity", 0)
                    status = (
                        "Out of Stock" if qty == 0
                        else "Low Stock" if qty < 5
                        else "High Stock"
                    )

                    stock_data.append({
                        "image": variant.get("image") or product.get("image") or DEFAULT_IMAGE,
                        "name": f"{name} ({variant.get('color', '')})".strip(),
                        "productId": variant.get("sku") or product.get("productId", "N/A"),
                        "quantity": qty,
                        "size": variant.get("size", "-"),
                        "status": status,
                    })

        return jsonify({"data": stock_data}), 200

    except Exception as e:
        print("Error in stock_analysis:", e)
        return jsonify({"error": str(e)}), 500


# ---------- 8) Dashboard Summary Stats ----------

@admin_dashboard_bp.route("/dashboard/total-sales", methods=["GET"])
def total_sales():
    try:
        pipeline = [
            {"$group": {"_id": None, "total_sales": {"$sum": "$final_amount"}}}
        ]
        result = list(orders_collection.aggregate(pipeline))
        total_sales = result[0]["total_sales"] if result else 0
        return jsonify({"total_sales": float(total_sales)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_dashboard_bp.route("/dashboard/total-revenue", methods=["GET"])
def total_revenue():
    try:
        pipeline = [
            {"$match": {"status": {"$in": ["Delivered", "Completed", "Paid"]}}},
            {"$group": {"_id": None, "total_revenue": {"$sum": "$final_amount"}}}
        ]
        result = list(orders_collection.aggregate(pipeline))
        total_revenue = result[0]["total_revenue"] if result else 0
        return jsonify({"total_revenue": float(total_revenue)}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@admin_dashboard_bp.route("/dashboard/monthly-revenue", methods=["GET"])
def monthly_revenue():
    try:
        pipeline = [
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
                    "total": {"$sum": "$final_amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        result = list(orders_collection.aggregate(pipeline))
        data = [{"name": r["_id"], "revenue": r["total"]} for r in result]
        return jsonify({"data": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from database import subusers_collection  # make sure this import is at the top of your admin_dashboard_routes.py

@admin_dashboard_bp.route("/dashboard/subusers", methods=["GET"])
def subusers_count():
    try:
        # ✅ count directly from subusers_collection
        subusers = subusers_collection.count_documents({})
        
        # ✅ get names for preview
        data = list(subusers_collection.find({}, {"email": 1, "role": 1, "_id": 0}).limit(10))
        names = [d.get("email", "Unnamed") for d in data]

        return jsonify({"count": subusers, "names": names}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

from datetime import datetime, timedelta
@admin_dashboard_bp.route("/admin/dashboard/summary", methods=["GET"])
def dashboard_summary():
    try:
        period = request.args.get("period", "yearly").lower()
        now = datetime.utcnow()

        # -------------------------------
        # Define Time Ranges
        # -------------------------------
        if period == "daily":
            start_date = now - timedelta(days=1)
            group_format = "%Y-%m-%d"
        elif period == "weekly":
            start_date = now - timedelta(weeks=1)
            group_format = "%Y-%m-%d"
        elif period == "monthly":
            start_date = now - timedelta(days=30)
            group_format = "%Y-%m-%d"
        else:  # yearly
            start_date = now - timedelta(days=365)
            group_format = "%Y-%m"

        # -------------------------------
        # Total Sales (all orders)
        # -------------------------------
        total_sales_result = list(orders_collection.aggregate([
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {"_id": None, "total": {"$sum": "$final_amount"}}}
        ]))
        total_sales = total_sales_result[0]["total"] if total_sales_result else 0

        # -------------------------------
        # Total Revenue (delivered/paid)
        # -------------------------------
        total_revenue_result = list(orders_collection.aggregate([
            {"$match": {
                "created_at": {"$gte": start_date},
                "status": {"$in": ["Delivered", "Completed", "Paid"]}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$final_amount"}}}
        ]))
        total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0

        # -------------------------------
        # Monthly (or period-based) revenue chart data
        # -------------------------------
        revenue_pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": group_format, "date": "$created_at"}},
                    "total": {"$sum": "$final_amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        monthly_data = list(orders_collection.aggregate(revenue_pipeline))
        monthly_revenue = [{"name": m["_id"], "revenue": m["total"]} for m in monthly_data]

        # -------------------------------
        # Subuser data
        # -------------------------------
        subusers = list(subusers_collection.find({}, {"email": 1, "_id": 0}))
        subuser_names = [u["email"] for u in subusers]

        # -------------------------------
        # Stock analysis
        # -------------------------------
        DEFAULT_IMAGE = "https://res.cloudinary.com/demo/image/upload/v123456789/default-product.jpg"
        products = list(products_collection.find({}, {"name": 1, "variants": 1, "image": 1, "quantity": 1, "productId": 1}))
        stock_data = []
        for p in products:
            name = p.get("name", "Unnamed")
            variants = p.get("variants", [])
            if not variants:
                qty = p.get("quantity", 0)
                status = "Out of Stock" if qty == 0 else "Low Stock" if qty < 5 else "High Stock"
                stock_data.append({
                    "name": name,
                    "image": p.get("image", DEFAULT_IMAGE),
                    "quantity": qty,
                    "status": status
                })
            else:
                for v in variants:
                    qty = v.get("quantity", 0)
                    status = "Out of Stock" if qty == 0 else "Low Stock" if qty < 5 else "High Stock"
                    stock_data.append({
                        "name": f"{name} ({v.get('color', '-')})",
                        "image": v.get("image", p.get("image", DEFAULT_IMAGE)),
                        "quantity": qty,
                        "status": status
                    })

        summary = {
            "period": period,
            "total_sales": float(total_sales),
            "total_revenue": float(total_revenue),
            "monthly_revenue": monthly_revenue,
            "subusers": subuser_names,
            "stock_analysis": stock_data
        }

        return jsonify(summary), 200

    except Exception as e:
        print("❌ Error in dashboard_summary:", e)
        return jsonify({"error": str(e)}), 500