import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from cloudinary_config import cloudinary
import cloudinary.uploader

load_dotenv()

def create_app():
    app = Flask(__name__)

    from config import ALLOWED_ORIGINS

    # Correct CORS setup — origins come from ALLOWED_ORIGINS env var in production,
    # defaults to the local dev frontend ports so nothing changes locally.
    CORS(
        app,
        supports_credentials=True,
        origins=ALLOWED_ORIGINS,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS", "PUT", "DELETE","PATCH"]
    )

    # Many routes do `ObjectId(some_id_from_the_url_or_body)` with no validation —
    # a malformed id raises InvalidId and would otherwise 500/crash. One handler
    # here covers every such call site instead of patching each route.
    from bson.errors import InvalidId
    @app.errorhandler(InvalidId)
    def handle_invalid_id(e):
        return jsonify({"error": "Invalid ID format"}), 400

    # Catch anything else that slips past route-level try/excepts: return clean
    # JSON instead of leaking a stack trace. Only takes effect when debug=False —
    # in debug mode Flask's interactive debugger takes over regardless, which
    # is what you want for local development.
    from werkzeug.exceptions import HTTPException
    from flask import request as _request
    @app.errorhandler(Exception)
    def handle_uncaught_exception(e):
        # Let Flask's normal handling take proper HTTP errors (404, 405, 415, ...)
        # — otherwise every one of those would get flattened into a 500 here too.
        if isinstance(e, HTTPException):
            return e
        app.logger.exception("Unhandled exception")
        from routes.admin_settings_routes import log_error
        log_error(method=_request.method, path=_request.path, error_message=e)
        return jsonify({"error": "Internal server error"}), 500

    # Maintenance mode — actually enforced, not just a flag sitting unused in
    # the DB. Admin/subuser/auth routes always stay reachable so the site can
    # be un-maintenanced; everything else (storefront, vendor operations)
    # gets a 503 while it's on.
    _MAINTENANCE_ALLOWLIST = ("/admin", "/api/admin", "/subuser", "/auth")

    @app.before_request
    def _enforce_maintenance_mode():
        if _request.method == "OPTIONS":
            return None
        if _request.path.startswith(_MAINTENANCE_ALLOWLIST):
            return None
        from routes.admin_settings_routes import is_maintenance_mode_active, _get_settings_doc
        if is_maintenance_mode_active():
            doc = _get_settings_doc()
            return jsonify({
                "error": "maintenance_mode",
                "message": doc.get("maintenanceMessage") or "We're down for scheduled maintenance. Please check back soon.",
            }), 503
        return None

    # --- Register Blueprints ---
    from routes.auth_routes import auth_bp
    from routes.customer_routes import customer_bp
    from routes.vendor_routes import vendor_bp
    from routes.admin_routes import admin_bp
    from routes.product_routes import product_bp
    from routes.vendor_dashboard_routes import vendor_dashboard_bp
    from routes.admin_dashboard_routes import admin_dashboard_bp
    from routes.offers_routes import offers_bp
    from routes.cart_routes import cart_bp
    from routes.notify import notify_bp
    from routes.category_routes import category_bp 
    from routes.subuser_routes import subuser_bp
    from routes.collection_routes import collection_bp 
    from routes.vendor_settings import vendor_settings_bp
    from routes.inventory_routes import inventory_bp  
    from routes.complaints import complaints_bp
    from routes.home_routes import home_bp
    from routes.public_routes import public_bp
    from routes.customer_auth_routes import customer_auth_bp
    from routes.vendor_auth_routes import vendor_auth_bp
    from routes.guest_routes import guest_bp
    from routes.delivery_routes import delivery_bp
    from routes.subuser_content_routes import subuser_content_bp
    from routes.admin_settings_routes import admin_settings_bp







    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(customer_bp, url_prefix='/customer')
    app.register_blueprint(vendor_bp, url_prefix='/vendor')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(product_bp)
    app.register_blueprint(vendor_dashboard_bp)
    app.register_blueprint(admin_dashboard_bp, url_prefix='/api')
    app.register_blueprint(offers_bp, url_prefix="/api")
    app.register_blueprint(cart_bp)
    app.register_blueprint(notify_bp)
    app.register_blueprint(category_bp, url_prefix="/api")
    app.register_blueprint(subuser_bp, url_prefix="/subuser") 
    app.register_blueprint(collection_bp) 
    app.register_blueprint(vendor_settings_bp, url_prefix='/api/vendor')
    app.register_blueprint(inventory_bp) 
    app.register_blueprint(complaints_bp)
    app.register_blueprint(home_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(customer_auth_bp)
    app.register_blueprint(vendor_auth_bp)
    app.register_blueprint(guest_bp)
    app.register_blueprint(delivery_bp)
    app.register_blueprint(subuser_content_bp)
    app.register_blueprint(admin_settings_bp)


    return app


if __name__ == '__main__':
    app = create_app()
    # Debug defaults to on for local `python app.py` runs (unchanged dev behavior).
    # In production, set FLASK_DEBUG=false and run via a real WSGI server instead
    # of this dev server — see wsgi.py + gunicorn (added to requirements.txt).
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=debug, port=port)
