from app import create_app, db
from models.role import Role
from models.complaint_category import ComplaintCategory

def init_database():
    """Initialize the database with default data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Initialize default roles
        if not Role.query.first():
            print("Creating default roles...")
            default_roles = Role.get_default_roles()
            
            for role_data in default_roles:
                role = Role(
                    name=role_data['name'],
                    description=role_data['description'],
                    permissions=role_data['permissions']
                )
                db.session.add(role)
            
            db.session.commit()
            print("Default roles created successfully!")
        
        # Initialize default complaint categories
        if not ComplaintCategory.query.first():
            print("Creating default complaint categories...")
            default_categories = ComplaintCategory.get_default_categories()
            
            for category_data in default_categories:
                category = ComplaintCategory(
                    name=category_data['name'],
                    department=category_data['department'],
                    description=category_data.get('description'),
                    priority=category_data.get('priority', 'Medium'),
                    resolution_time_hours=category_data.get('resolution_time_hours', 48),
                    escalation_matrix=category_data.get('escalation_matrix', [])
                )
                db.session.add(category)
            
            db.session.commit()
            print("Default complaint categories created successfully!")
        
        print("Database initialization completed!")

if __name__ == '__main__':
    init_database()