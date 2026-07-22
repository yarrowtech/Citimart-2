from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from cloudinary_config import cloudinary
import cloudinary.uploader

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Correct CORS setup
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:3000", "http://localhost:3001"],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS", "PUT", "DELETE","PATCH"]
    )

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


    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
