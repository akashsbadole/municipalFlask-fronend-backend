from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models.user import User

def require_permission(permission_name):
    """
    Decorator to check if the current user has the required permission
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                current_user_id = get_jwt_identity()
                user = User.query.get(current_user_id)
                
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                
                if not user.is_active:
                    return jsonify({'error': 'Account is deactivated'}), 401
                
                # Check if user has the required permission
                if not user.has_permission(permission_name):
                    return jsonify({'error': 'Permission denied'}), 403
                
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({'error': 'Authentication error'}), 401
        return decorated_function
    return decorator