from flask import Blueprint, request, jsonify
from database import vendors_collection
from utils.auth_utils import token_required

vendor_settings_bp = Blueprint('vendor_settings', __name__)

# ------------------ PROFILE ------------------
@vendor_settings_bp.route('/settings/profile', methods=['GET', 'POST'])
@token_required
def vendor_profile(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'profile': 1})
        return jsonify(data.get('profile', {})), 200

    profile_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'profile': profile_data}})
    return jsonify({'message': 'Profile updated successfully'}), 200


# ------------------ ACCOUNT ------------------
@vendor_settings_bp.route('/settings/account', methods=['GET', 'POST'])
@token_required
def vendor_account(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'account': 1})
        return jsonify(data.get('account', {})), 200

    account_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'account': account_data}})
    return jsonify({'message': 'Account settings updated'}), 200


# ------------------ PAYMENTS ------------------
@vendor_settings_bp.route('/settings/payments', methods=['GET', 'POST'])
@token_required
def vendor_payments(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'payments': 1})
        return jsonify(data.get('payments', {})), 200

    payment_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'payments': payment_data}})
    return jsonify({'message': 'Payment info saved'}), 200


# ------------------ SHIPPING ------------------
@vendor_settings_bp.route('/settings/shipping', methods=['GET', 'POST'])
@token_required
def vendor_shipping(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'shipping': 1})
        return jsonify(data.get('shipping', {})), 200

    shipping_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'shipping': shipping_data}})
    return jsonify({'message': 'Shipping info updated'}), 200


# ------------------ CATALOG ------------------
@vendor_settings_bp.route('/settings/catalog', methods=['GET', 'POST'])
@token_required
def vendor_catalog(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'catalog': 1})
        return jsonify(data.get('catalog', {})), 200

    catalog_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'catalog': catalog_data}})
    return jsonify({'message': 'Catalog settings saved'}), 200


# ------------------ NOTIFICATIONS ------------------
@vendor_settings_bp.route('/settings/notifications', methods=['GET', 'POST'])
@token_required
def vendor_notifications(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'notifications': 1})
        return jsonify(data.get('notifications', {})), 200

    notif_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'notifications': notif_data}})
    return jsonify({'message': 'Notifications updated'}), 200


# ------------------ COMPLIANCE ------------------
@vendor_settings_bp.route('/settings/compliance', methods=['GET', 'POST'])
@token_required
def vendor_compliance(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'compliance': 1})
        return jsonify(data.get('compliance', {})), 200

    compliance_data = request.form.to_dict()
    uploaded_files = {}

    # Handle uploaded files (e.g. GST, Trade License)
    for key, file in request.files.items():
        # Example Cloudinary upload
        import cloudinary.uploader
        upload_result = cloudinary.uploader.upload(file)
        uploaded_files[key] = upload_result['secure_url']

    vendors_collection.update_one(
        {'_id': vendor_id},
        {'$set': {'compliance': {**compliance_data, **uploaded_files}}}
    )

    return jsonify({'message': 'Compliance info saved'}), 200


# ------------------ REPORTS ------------------
@vendor_settings_bp.route('/settings/reports', methods=['GET', 'POST'])
@token_required
def vendor_reports(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'reports': 1})
        return jsonify(data.get('reports', {})), 200

    report_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'reports': report_data}})
    return jsonify({'message': 'Report settings saved'}), 200


# ------------------ SUPPORT ------------------
@vendor_settings_bp.route('/settings/support', methods=['GET', 'POST'])
@token_required
def vendor_support(current_vendor):
    vendor_id = current_vendor['_id']
    if request.method == 'GET':
        data = vendors_collection.find_one({'_id': vendor_id}, {'support': 1})
        return jsonify(data.get('support', {})), 200

    support_data = request.json
    vendors_collection.update_one({'_id': vendor_id}, {'$set': {'support': support_data}})
    return jsonify({'message': 'Support preferences updated'}), 200
