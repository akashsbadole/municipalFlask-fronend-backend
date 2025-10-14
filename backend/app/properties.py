from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from models.property import Property
from models.property_tax import PropertyTax
from models.user import User
from models.citizen import Citizen
import uuid

properties_bp = Blueprint('properties', __name__)

@properties_bp.route('/', methods=['POST'])
@jwt_required()
def create_property():
    """Create a new property"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['property_id', 'address_line1', 'area', 'ward_number', 'zone', 
                      'city', 'state', 'pincode', 'property_type', 'usage_type', 
                      'building_type', 'plot_area', 'built_up_area', 'owner_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if property_id already exists
    if Property.query.filter_by(property_id=data['property_id']).first():
        return jsonify({'error': 'Property ID already exists'}), 409
    
    # Check if owner exists
    owner = Citizen.query.get(data['owner_id'])
    if not owner:
        return jsonify({'error': 'Owner not found'}), 404
    
    try:
        # Create new property
        new_property = Property(
            property_id=data['property_id'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            city=data['city'],
            state=data['state'],
            pincode=data['pincode'],
            property_type=data['property_type'],
            usage_type=data['usage_type'],
            building_type=data['building_type'],
            plot_area=data['plot_area'],
            built_up_area=data['built_up_area'],
            owner_id=data['owner_id'],
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            construction_year=data.get('construction_year'),
            number_of_floors=data.get('number_of_floors', 1),
            number_of_rooms=data.get('number_of_rooms'),
            ownership_type=data.get('ownership_type', 'Single'),
            ownership_percentage=data.get('ownership_percentage'),
            carpet_area=data.get('carpet_area')
        )
        
        db.session.add(new_property)
        db.session.commit()
        
        return jsonify({
            'message': 'Property created successfully',
            'property': new_property.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@properties_bp.route('/', methods=['GET'])
@jwt_required()
def get_properties():
    """Get all properties with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    ward = request.args.get('ward', '')
    property_type = request.args.get('property_type', '')
    owner_id = request.args.get('owner_id', '')
    
    # Build query
    query = Property.query
    
    # Apply filters
    if search:
        query = query.filter(
            (Property.property_id.ilike(f'%{search}%')) |
            (Property.address_line1.ilike(f'%{search}%')) |
            (Property.area.ilike(f'%{search}%'))
        )
    
    if ward:
        query = query.filter(Property.ward_number == ward)
    
    if property_type:
        query = query.filter(Property.property_type == property_type)
    
    if owner_id:
        try:
            owner_uuid = uuid.UUID(owner_id)
            query = query.filter(Property.owner_id == owner_uuid)
        except ValueError:
            return jsonify({'error': 'Invalid owner_id format'}), 400
    
    # Paginate
    properties = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'properties': [property.to_dict() for property in properties.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': properties.total,
            'pages': properties.pages
        }
    }), 200

@properties_bp.route('/<uuid:property_id>', methods=['GET'])
@jwt_required()
def get_property(property_id):
    """Get a specific property by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    property = Property.query.get(property_id)
    
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    return jsonify({
        'property': property.to_dict()
    }), 200

@properties_bp.route('/<uuid:property_id>', methods=['PUT'])
@jwt_required()
def update_property(property_id):
    """Update a property"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    property = Property.query.get(property_id)
    
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'address_line1', 'address_line2', 'landmark', 'area', 'ward_number', 
            'zone', 'city', 'state', 'pincode', 'latitude', 'longitude',
            'property_type', 'usage_type', 'building_type', 'construction_year',
            'plot_area', 'built_up_area', 'carpet_area', 'number_of_floors', 
            'number_of_rooms', 'ownership_type', 'ownership_percentage'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(property, field, data[field])
        
        property.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Property updated successfully',
            'property': property.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@properties_bp.route('/<uuid:property_id>/tax', methods=['POST'])
@jwt_required()
def create_property_tax(property_id):
    """Create a new tax record for a property"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    property = Property.query.get(property_id)
    
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['tax_id', 'year', 'annual_value', 'tax_rate', 'due_date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if tax already exists for this property and year
    existing_tax = PropertyTax.query.filter_by(
        property_id=property_id, 
        year=data['year']
    ).first()
    
    if existing_tax:
        return jsonify({'error': 'Tax already exists for this property and year'}), 409
    
    try:
        # Parse due date
        due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
        
        # Create new tax
        new_tax = PropertyTax(
            tax_id=data['tax_id'],
            year=data['year'],
            annual_value=data['annual_value'],
            tax_rate=data['tax_rate'],
            due_date=due_date,
            property_id=property_id,
            municipal_tax=data.get('municipal_tax'),
            education_tax=data.get('education_tax'),
            water_tax=data.get('water_tax'),
            sanitation_tax=data.get('sanitation_tax'),
            fire_tax=data.get('fire_tax'),
            penalty_amount=data.get('penalty_amount', 0.0),
            interest_amount=data.get('interest_amount', 0.0)
        )
        
        db.session.add(new_tax)
        db.session.commit()
        
        return jsonify({
            'message': 'Property tax created successfully',
            'tax': new_tax.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@properties_bp.route('/<uuid:property_id>/taxes', methods=['GET'])
@jwt_required()
def get_property_taxes(property_id):
    """Get all tax records for a property"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    property = Property.query.get(property_id)
    
    if not property:
        return jsonify({'error': 'Property not found'}), 404
    
    taxes = PropertyTax.query.filter_by(property_id=property_id).order_by(PropertyTax.year.desc()).all()
    
    return jsonify({
        'taxes': [tax.to_dict() for tax in taxes]
    }), 200

@properties_bp.route('/tax/<uuid:tax_id>/pay', methods=['POST'])
@jwt_required()
def pay_property_tax(tax_id):
    """Make a payment for property tax"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('property.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    tax = PropertyTax.query.get(tax_id)
    
    if not tax:
        return jsonify({'error': 'Tax record not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        success, message = tax.make_payment(
            amount=data['amount'],
            payment_method=data['payment_method'],
            payment_reference=data.get('payment_reference')
        )
        
        if success:
            return jsonify({
                'message': message,
                'tax': tax.to_dict()
            }), 200
        else:
            return jsonify({'error': message}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500