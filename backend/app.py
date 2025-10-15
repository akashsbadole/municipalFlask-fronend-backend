from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_marshmallow import Marshmallow
from datetime import timedelta
import os
from dotenv import load_dotenv
from extensions import db, migrate, jwt, cors, bcrypt, ma

# Load environment variables
load_dotenv()

# Initialize extensions

def create_app(config_name='development'):
    app = Flask(__name__)
    
    # Configuration
    if config_name == 'development':
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/municipal_db')
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app)
    bcrypt.init_app(app)
    ma.init_app(app)
    
    # Register blueprints
    from app.auth import auth_bp
    from app.citizens import citizens_bp
    from app.properties import properties_bp
    from app.complaints import complaints_bp
    from app.licenses import licenses_bp
    from app.buildings import buildings_bp
    from app.waste import waste_bp
    from app.water import water_bp
    from app.streetlights import streetlights_bp
    from app.health import health_bp
    from app.finance import finance_bp
    from app.hr import hr_bp
    from app.public_works import public_works_bp
    from app.egovernance import egovernance_bp
    from app.disaster import disaster_bp
    from app.reports import reports_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(citizens_bp, url_prefix='/api/citizens')
    app.register_blueprint(properties_bp, url_prefix='/api/properties')
    app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
    app.register_blueprint(licenses_bp, url_prefix='/api/licenses')
    app.register_blueprint(buildings_bp, url_prefix='/api/buildings')
    app.register_blueprint(waste_bp, url_prefix='/api/waste')
    app.register_blueprint(water_bp, url_prefix='/api/water')
    app.register_blueprint(streetlights_bp, url_prefix='/api/streetlights')
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(hr_bp, url_prefix='/api/hr')
    app.register_blueprint(public_works_bp, url_prefix='/api/public-works')
    app.register_blueprint(egovernance_bp, url_prefix='/api/egovernance')
    app.register_blueprint(disaster_bp, url_prefix='/api/disaster')
    app.register_blueprint(reports_bp, url_prefix='/api')
    
    # Root route
    @app.route('/')
    def root():
        return {
            'message': 'Municipal Management System API',
            'version': '1.0.0',
            'status': 'Running',
            'endpoints': {
                'auth': '/api/auth',
                'citizens': '/api/citizens',
                'properties': '/api/properties',
                'complaints': '/api/complaints',
                'licenses': '/api/licenses',
                'buildings': '/api/buildings',
                'waste': '/api/waste',
                'water': '/api/water',
                'streetlights': '/api/streetlights',
                'health': '/api/health',
                'finance': '/api/finance',
                'hr': '/api/hr',
                'public_works': '/api/public-works',
                'egovernance': '/api/egovernance',
                'disaster': '/api/disaster',
                'reports': '/'
            }
        }
    
    # Create upload directories if they don't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)