from flask import Blueprint, request, jsonify
from database import categories_collection
from bson import ObjectId

category_bp = Blueprint("category_bp", __name__)

# -----------------------------
# GET all categories (for frontend dropdowns)
# -----------------------------
@category_bp.route("/categories", methods=["GET"])
def get_categories():
    try:
        categories = list(categories_collection.find({}))
        for c in categories:
            c["_id"] = str(c["_id"])
            if "subCategories" not in c:
                c["subCategories"] = []
            else:
                for sub in c["subCategories"]:
                    if "childCategories" not in sub:
                        sub["childCategories"] = []
        return jsonify({"categories": categories}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -----------------------------
# ADD / MERGE CATEGORY
# -----------------------------
@category_bp.route("/categories", methods=["POST"])
def add_category():
    try:
        data = request.get_json()
        category = data.get("category", "").strip()
        if not category:
            return jsonify({"error": "Category is required"}), 400

        subcategories = [
            {
                "name": sub.get("name", "").strip(),
                "childCategories": [c.strip() for c in sub.get("children", []) if c.strip()]
            }
            for sub in data.get("subcategories", [])
            if sub.get("name", "").strip()
        ]

        cat_doc = categories_collection.find_one({"name": category})

        if not cat_doc:
            new_doc = {"name": category, "subCategories": subcategories}
            categories_collection.insert_one(new_doc)
        else:
            sub_list = cat_doc.get("subCategories", [])
            for sub in subcategories:
                sub_doc = next((s for s in sub_list if s["name"].lower() == sub["name"].lower()), None)
                if not sub_doc:
                    sub_list.append(sub)
                else:
                    if "childCategories" not in sub_doc:
                        sub_doc["childCategories"] = []
                    for child in sub["childCategories"]:
                        if child.lower() not in [c.lower() for c in sub_doc["childCategories"]]:
                            sub_doc["childCategories"].append(child)
            categories_collection.update_one(
                {"_id": cat_doc["_id"]},
                {"$set": {"subCategories": sub_list}}
            )

        return jsonify({"message": "Added successfully"}), 201

    except Exception as e:
        print("Error in /categories POST:", e)
        return jsonify({"error": str(e)}), 500


# -----------------------------
# EDIT Category / Subcategory / Child
# -----------------------------
@category_bp.route("/categories/edit", methods=["PUT"])
def edit_category():
    try:
        data = request.json
        type_ = data.get("type")
        old_name = data.get("old_name") or data.get("oldName")
        new_name = data.get("new_name") or data.get("newName")
        parent_category = data.get("parentCategory")
        parent_sub = data.get("parentSub")

        if type_ == "category":
            categories_collection.update_one({"name": old_name}, {"$set": {"name": new_name}})
        elif type_ == "subcategory":
            categories_collection.update_one(
                {"name": parent_category, "subCategories.name": old_name},
                {"$set": {"subCategories.$.name": new_name}}
            )
        elif type_ == "child":
            # Fetch category doc
            cat_doc = categories_collection.find_one({"name": parent_category})
            if not cat_doc:
                return jsonify({"error": "Parent category not found"}), 400
            sub_doc = next((s for s in cat_doc.get("subCategories", []) if s["name"] == parent_sub), None)
            if not sub_doc:
                return jsonify({"error": "Parent subcategory not found"}), 400
            # Replace child
            try:
                idx = sub_doc["childCategories"].index(old_name)
                sub_doc["childCategories"][idx] = new_name
                categories_collection.update_one(
                    {"_id": cat_doc["_id"]},
                    {"$set": {"subCategories": cat_doc["subCategories"]}}
                )
            except ValueError:
                return jsonify({"error": "Child category not found"}), 400
        else:
            return jsonify({"error": "Invalid type"}), 400

        return jsonify({"message": "Updated successfully"}), 200

    except Exception as e:
        print("Error in /categories/edit:", e)
        return jsonify({"error": str(e)}), 500


# -----------------------------
# DELETE Category / Subcategory / Child
# -----------------------------
@category_bp.route("/categories/delete", methods=["DELETE"])
def delete_category():
    try:
        data = request.json
        type_ = data.get("type")
        name = data.get("name")
        parent_category = data.get("parentCategory")
        parent_sub = data.get("parentSub")

        if type_ == "category":
            categories_collection.delete_one({"name": name})
        elif type_ == "subcategory":
            categories_collection.update_one(
                {"name": parent_category},
                {"$pull": {"subCategories": {"name": name}}}
            )
        elif type_ == "child":
            categories_collection.update_one(
                {"name": parent_category, "subCategories.name": parent_sub},
                {"$pull": {"subCategories.$.childCategories": name}}
            )
        else:
            return jsonify({"error": "Invalid type"}), 400

        return jsonify({"message": "Deleted successfully"}), 200

    except Exception as e:
        print("Error in /categories/delete:", e)
        return jsonify({"error": str(e)}), 500



# -----------------------------
# GET Approved Categories for a Vendor
# -----------------------------
@category_bp.route("/categories/vendor/<vendor_id>", methods=["GET"])
def get_vendor_approved_categories(vendor_id):
    from database import vendors_collection  # import inside to avoid circular imports

    try:
        vendor = vendors_collection.find_one({"_id": ObjectId(vendor_id)})
        if not vendor:
            return jsonify({"error": "Vendor not found"}), 404

        approved_categories = vendor.get("approved_categories", [])
        approved_subcategories = vendor.get("approved_subcategories", {})
        approved_childcategories = vendor.get("approved_childcategories", {})

        # Fetch full categories from DB to structure properly
        categories = list(categories_collection.find({"name": {"$in": approved_categories}}))
        formatted = []

        for cat in categories:
            cat_name = cat["name"]
            sub_list = cat.get("subCategories", [])
            approved_subs = approved_subcategories.get(cat_name, [])

            filtered_subs = []
            for sub in sub_list:
                if sub["name"] in approved_subs:
                    children = sub.get("childCategories", [])
                    allowed_children = approved_childcategories.get(sub["name"], [])
                    filtered_children = [c for c in children if c in allowed_children]
                    filtered_subs.append({
                        "name": sub["name"],
                        "childCategories": filtered_children
                    })

            formatted.append({
                "name": cat_name,
                "subCategories": filtered_subs
            })

        return jsonify({"categories": formatted}), 200

    except Exception as e:
        print("Error in /categories/vendor/<vendor_id>:", e)
        return jsonify({"error": str(e)}), 500
