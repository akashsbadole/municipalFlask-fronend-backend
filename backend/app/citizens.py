from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from extensions import db
from models.citizen import Citizen
from models.user import User

citizens_bp = Blueprint('citizens', __name__)

@citizens_bp.route('/', methods=['POST'])
@jwt_required()
def create_citizen():
    """Create a new citizen"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('citizen.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'gender', 
                      'address_line1', 'area', 'ward_number', 'zone', 'city', 'state', 'pincode']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Parse date of birth
        dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        
        # Create new citizen
        new_citizen = Citizen(
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data['phone'],
            date_of_birth=dob,
            gender=data['gender'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            city=data['city'],
            state=data['state'],
            pincode=data['pincode'],
            aadhaar_number=data.get('aadhaar_number'),
            email=data.get('email'),
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark')
        )
        
        db.session.add(new_citizen)
        db.session.commit()
        
        return jsonify({
            'message': 'Citizen created successfully',
            'citizen': new_citizen.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@citizens_bp.route('/', methods=['GET'])
@jwt_required()
def get_citizens():
    """Get all citizens with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('citizen.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    ward = request.args.get('ward', '')
    is_verified = request.args.get('is_verified', '')
    
    # Build query
    query = Citizen.query
    
    # Apply filters
    if search:
        query = query.filter(
            (Citizen.first_name.ilike(f'%{search}%')) |
            (Citizen.last_name.ilike(f'%{search}%')) |
            (Citizen.phone.ilike(f'%{search}%')) |
            (Citizen.email.ilike(f'%{search}%'))
        )
    
    if ward:
        query = query.filter(Citizen.ward_number == ward)
    
    if is_verified:
        query = query.filter(Citizen.is_verified == (is_verified.lower() == 'true'))
    
    # Paginate
    citizens = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'citizens': [citizen.to_dict() for citizen in citizens.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': citizens.total,
            'pages': citizens.pages
        }
    }), 200

@citizens_bp.route('/<uuid:citizen_id>', methods=['GET'])
@jwt_required()
def get_citizen(citizen_id):
    """Get a specific citizen by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('citizen.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    citizen = Citizen.query.get(citizen_id)
    
    if not citizen:
        return jsonify({'error': 'Citizen not found'}), 404
    
    return jsonify({
        'citizen': citizen.to_dict()
    }), 200

@citizens_bp.route('/<uuid:citizen_id>', methods=['PUT'])
@jwt_required()
def update_citizen(citizen_id):
    """Update a citizen"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('citizen.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    citizen = Citizen.query.get(citizen_id)
    
    if not citizen:
        return jsonify({'error': 'Citizen not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'first_name', 'last_name', 'phone', 'email', 'address_line1', 
            'address_line2', 'landmark', 'area', 'ward_number', 'zone', 
            'city', 'state', 'pincode'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(citizen, field, data[field])
        
        if 'date_of_birth' in data:
            citizen.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        
        citizen.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Citizen updated successfully',
            'citizen': citizen.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@citizens_bp.route('/<uuid:citizen_id>/verify', methods=['POST'])
@jwt_required()
def verify_citizen(citizen_id):
    """Verify a citizen"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('citizen.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    citizen = Citizen.query.get(citizen_id)
    
    if not citizen:
        return jsonify({'error': 'Citizen not found'}), 404
    
    data = request.get_json()
    verification_method = data.get('method', 'manual')
    
    citizen.verify(verification_method)
    
    return jsonify({
        'message': 'Citizen verified successfully',
        'citizen': citizen.to_dict()
    }), 200