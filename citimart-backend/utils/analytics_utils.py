from database import orders_collection, products_collection, vendors_collection, users_collection
from bson import ObjectId

def clean_mongo_data(data):
    if isinstance(data, list):
        return [clean_mongo_data(item) for item in data]
    elif isinstance(data, dict):
        new_data = {}
        for key, value in data.items():
            if isinstance(value, ObjectId):
                new_data[key] = str(value)
            elif isinstance(value, (dict, list)):
                new_data[key] = clean_mongo_data(value)
            else:
                new_data[key] = value
        return new_data
    else:
        return data

def calculate_dashboard_metrics():
    total_orders = orders_collection.count_documents({})
    vendor_orders = orders_collection.count_documents({"order_type": "vendor"})
    citimart_orders = orders_collection.count_documents({"order_type": "citimart"})

    total_customers = users_collection.count_documents({"role": "customer"})

    sales = list(orders_collection.aggregate([
        {"$group": {"_id": "$order_type", "total_sales": {"$sum": "$total"}}}
    ]))

    sales_data = {"citimart": 0, "vendor": 0}
    for s in sales:
        sales_data[s['_id']] = s['total_sales']

    top_selling = list(products_collection.aggregate([
        {"$match": {"added_by": "admin"}},
        {"$unwind": "$sold"},
        {"$group": {"_id": "$name", "qty": {"$sum": "$sold.quantity"}, "revenue": {"$sum": "$sold.amount"}}},
        {"$sort": {"qty": -1}},
        {"$limit": 5}
    ]))

    top_vendors = list(vendors_collection.aggregate([
        {"$project": {"name": 1, "sales": 1, "growth": 1}},
        {"$sort": {"sales": -1}},
        {"$limit": 5}
    ]))

    category_data = list(products_collection.aggregate([
        {"$group": {
            "_id": "$category",
            "sales": {"$sum": "$total_sales"}
        }}
    ]))

    logistics_data = {
        "shipments": {"total": 5000}
    }

    trend = [50000, 70000, 65000, 80000, 90000, 75000, 85000]
    trend_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    return {
        "salesOverview": {
            "totalPlatformSales": sales_data["citimart"] + sales_data["vendor"],
            "vendorSales": sales_data["vendor"],
            "citimartSales": sales_data["citimart"],
            "trend": trend,
            "trendLabels": trend_labels
        },
        "citimartPerformance": {
            "topSelling": clean_mongo_data([{
                "name": p["_id"],
                "qty": p["qty"],
                "revenue": p["revenue"]
            } for p in top_selling])
        },
        "vendorPerformance": {
            "topVendors": clean_mongo_data(top_vendors)
        },
        "customerAnalytics": {
            "total": total_customers
        },
        "orderInsights": {
            "total": total_orders
        },
        "revenueFinancials": {
            "totalEarnings": sales_data["citimart"] + sales_data["vendor"]
        },
        "returnsQuality": {
            "totalReturns": {"citimart": 10}  # Hardcoded for simplicity, adjust as needed
        },
        "categoryBreakdown": [{
            "category": c["_id"],
            "sales": c["sales"]
        } for c in category_data],
        "logistics": logistics_data
    }
