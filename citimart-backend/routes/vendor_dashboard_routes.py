from flask import Blueprint, jsonify
from bson import ObjectId
from database import products_collection, orders_collection, users_collection
from utils.auth_utils import token_required
from datetime import datetime

vendor_dashboard_bp = Blueprint("vendor_dashboard", __name__)

@vendor_dashboard_bp.route("/vendor/dashboard", methods=["GET"])
@token_required
def vendor_dashboard(current_vendor):
    vendor_id = str(current_vendor["_id"])

    # Total Products
    total_products = products_collection.count_documents({"vendor_id": vendor_id})

    # Vendor's Orders
    vendor_orders = list(orders_collection.find({"order_items.vendor_id": vendor_id}))

    total_orders = len(vendor_orders)

    # Calculate vendor's total sales from their products only
    total_sales = 0
    recent_orders = []

    for order in sorted(vendor_orders, key=lambda x: x.get("created_at", datetime.utcnow()), reverse=True):
        vendor_items = [item for item in order.get("order_items", []) if item.get("vendor_id") == vendor_id]
        vendor_total = sum(item["price"] * item["quantity"] for item in vendor_items)
        total_sales += vendor_total

        customer = users_collection.find_one({"_id": ObjectId(order.get("customer_id"))})
        customer_name = customer.get("name") if customer else "Unknown"

        products_list = []
        for item in vendor_items:
            product_name = item.get("product_name")
            product_image = item.get("product_image")

            # Fallback to products collection if data missing
            if not product_name or not product_image:
                product = products_collection.find_one({"_id": ObjectId(item["product_id"])})
                if product:
                    product_name = product.get("name", "N/A")
                    product_image = product.get("images", [])[0] if product.get("images") else "https://via.placeholder.com/100"
                else:
                    product_name = "N/A"
                    product_image = "https://via.placeholder.com/100"

            products_list.append({
                "name": product_name,
                "image": product_image,
                "size": item.get("size", "N/A"),
                "quantity": item.get("quantity", 1)
            })

        recent_orders.append({
            "id": str(order.get("_id")),
            "customer": customer_name,
            "products": products_list,
            "amount": f"₹{vendor_total}",
            "status": order.get("status"),
            "date": order.get("created_at").strftime("%Y-%m-%d") if order.get("created_at") else "N/A"
        })

    # Limit to last 5 recent orders
    recent_orders = recent_orders[:5]

    # Conversion Rate (dummy logic to simulate engagement)
    conversion_rate = round((total_orders / (total_products * 10 + 1)) * 100, 2)

    return jsonify({
        "stats": [
            {
                "title": "Total Products",
                "value": total_products,
                "icon": "box",
                "change": "+12%",
                "isPositive": True
            },
            {
                "title": "Total Orders",
                "value": total_orders,
                "icon": "shopping-bag",
                "change": "+5%",
                "isPositive": True
            },
            {
                "title": "Total Sales",
                "value": f"₹{total_sales}",
                "icon": "rupee-sign",
                "change": "+3%",
                "isPositive": True
            },
            {
                "title": "Conversion Rate",
                "value": f"{conversion_rate}%",
                "icon": "chart-line",
                "change": "+0.8%",
                "isPositive": True
            }
        ],
        "recentOrders": recent_orders
    })
