# routes/delivery_routes.py
# Lightweight pincode serviceability check.
#
# There's no official "tier 1/2/3" dataset for India — tier labels are a business
# judgment call, not government data. Rather than fake precision we don't have,
# this keeps an explicit allowlist of pincode prefixes we currently ship to
# (major metro / Tier-1 cities) and treats everything else as not-yet-serviceable.
# Expand SERVICEABLE_PREFIXES as delivery coverage grows.
from flask import Blueprint, request, jsonify

delivery_bp = Blueprint("delivery_bp", __name__, url_prefix="/api/delivery")

# 3-digit pincode prefix -> city currently served
SERVICEABLE_PREFIXES = {
    "110": "Delhi",
    "122": "Gurugram",
    "201": "Noida",
    "400": "Mumbai",
    "411": "Pune",
    "380": "Ahmedabad",
    "500": "Hyderabad",
    "560": "Bangalore",
    "600": "Chennai",
    "700": "Kolkata",
}


@delivery_bp.route("/check", methods=["GET"])
def check_delivery():
    pincode = (request.args.get("pincode") or "").strip()

    if not pincode.isdigit() or len(pincode) != 6 or pincode[0] == "0":
        return jsonify({"error": "Enter a valid 6-digit pincode"}), 400

    city = SERVICEABLE_PREFIXES.get(pincode[:3])

    if city:
        return jsonify({
            "pincode": pincode,
            "serviceable": True,
            "city": city,
            "message": f"Delivery available in 3-5 days 🚚 ({city})",
        }), 200

    return jsonify({
        "pincode": pincode,
        "serviceable": False,
        "city": None,
        "message": "Not deliverable at your location for now",
    }), 200
