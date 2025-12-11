import sys
import os
import uuid
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import create_app from the app.py file
import importlib.util
spec = importlib.util.spec_from_file_location("app_module", "app.py")
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
create_app = app_module.create_app

from extensions import db
from models.user import User
from models.role import Role

def create_admin_user():
    """Create an admin user for testing"""
    app = create_app()
    
    with app.app_context():
        # Create all tables first
        db.create_all()
        
        # Initialize default roles if they don't exist
        if not Role.query.first():
            print("Creating default roles...")
            default_roles = Role.get_default_roles()
            
            for role_data in default_roles:
                role = Role(
                    name=role_data['name'],
                    description=role_data['description'],
                    permissions=role_data['permissions']
                )
                role.id = str(uuid.uuid4())
                db.session.add(role)
            
            db.session.commit()
            print("Default roles created successfully!")
        
        # Check if admin user already exists
        existing_admin = User.query.filter_by(username='admin').first()
        if existing_admin:
            print("Admin user already exists!")
            print(f"Username: admin")
            print(f"Password: admin123")
            return
        
        # Get Super Admin role
        super_admin_role = Role.query.filter_by(name='Super Admin').first()
        if not super_admin_role:
            print("Super Admin role not found! Creating roles first...")
            return
        
        # Create admin user
        admin_user = User(
            username='admin',
            email='admin@municipal.com',
            password='admin123',  # This will be hashed automatically
            first_name='System',
            last_name='Administrator',
            role_id=super_admin_role.id,
            phone='1234567890'
        )
        admin_user.id = str(uuid.uuid4())
        admin_user.is_active = True
        admin_user.is_verified = True
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("Admin user created successfully!")
        print("=" * 40)
        print("LOGIN CREDENTIALS:")
        print("Username: admin")
        print("Password: admin123")
        print("Email: admin@municipal.com")
        print("Role: Super Admin")
        print("=" * 40)

if __name__ == '__main__':
    create_admin_user()
