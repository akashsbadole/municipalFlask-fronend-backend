from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid
from app import db
from models.trade_license import TradeLicense
from models.user import User
from models.citizen import Citizen

licenses_bp = Blueprint('licenses', __name__)

def generate_license_number():
    """Generate a unique license number"""
    year = datetime.now().year
    count = TradeLicense.query.filter(
        TradeLicense.created_at >= datetime(year, 1, 1)
    ).count() + 1
    return f"TL{year}{count:05d}"

@licenses_bp.route('/', methods=['GET'])
@jwt_required()
def get_licenses():
    """Get all trade licenses with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    business_type = request.args.get('business_type', '')
    ward = request.args.get('ward', '')
    
    # Build query
    query = TradeLicense.query
    
    # Apply filters
    if search:
        query = query.filter(
            (TradeLicense.license_number.ilike(f'%{search}%')) |
            (TradeLicense.business_name.ilike(f'%{search}%')) |
            (TradeLicense.owner_name.ilike(f'%{search}%'))
        )
    
    if status:
        query = query.filter(TradeLicense.status == status)
    
    if business_type:
        query = query.filter(TradeLicense.business_type == business_type)
    
    if ward:
        query = query.filter(TradeLicense.ward_number == ward)
    
    # Order by creation date (newest first)
    query = query.order_by(TradeLicense.created_at.desc())
    
    # Paginate
    licenses = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'licenses': [license.to_dict() for license in licenses.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': licenses.total,
            'pages': licenses.pages
        }
    }), 200

@licenses_bp.route('/', methods=['POST'])
@jwt_required()
def create_license():
    """Create a new trade license application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['business_name', 'business_type', 'owner_name', 'address_line1',
                      'area', 'ward_number', 'zone', 'city', 'state', 'pincode']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Get citizen ID (from user if citizen role, or from request data)
    if user.role.name == 'Citizen':
        applicant_id = user.citizen_id
        if not applicant_id:
            return jsonify({'error': 'User account not linked to citizen profile'}), 400
    else:
        applicant_id = data.get('applicant_id')
        if not applicant_id:
            return jsonify({'error': 'applicant_id is required for non-citizen users'}), 400
    
    # Check if citizen exists
    citizen = Citizen.query.get(applicant_id)
    if not citizen:
        return jsonify({'error': 'Applicant not found'}), 404
    
    try:
        # Generate license number
        license_number = generate_license_number()
        
        # Create new license
        new_license = TradeLicense(
            license_number=license_number,
            business_name=data['business_name'],
            business_type=data['business_type'],
            owner_name=data['owner_name'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            city=data['city'],
            state=data['state'],
            pincode=data['pincode'],
            applicant_id=applicant_id,
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark'),
            phone=data.get('phone'),
            email=data.get('email'),
            pan_number=data.get('pan_number'),
            gst_number=data.get('gst_number'),
            establishment_year=data.get('establishment_year'),
            number_of_employees=data.get('number_of_employees'),
            business_description=data.get('business_description')
        )
        
        db.session.add(new_license)
        db.session.commit()
        
        return jsonify({
            'message': 'Trade license application created successfully',
            'license': new_license.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/<uuid:license_id>', methods=['GET'])
@jwt_required()
def get_license(license_id):
    """Get a specific trade license by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    return jsonify({
        'license': license.to_dict()
    }), 200

@licenses_bp.route('/<uuid:license_id>', methods=['PUT'])
@jwt_required()
def update_license(license_id):
    """Update a trade license"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'business_name', 'business_type', 'owner_name', 'address_line1',
            'address_line2', 'landmark', 'area', 'ward_number', 'zone',
            'city', 'state', 'pincode', 'phone', 'email', 'pan_number',
            'gst_number', 'establishment_year', 'number_of_employees',
            'business_description'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(license, field, data[field])
        
        license.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'License updated successfully',
            'license': license.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/<uuid:license_id>/approve', methods=['POST'])
@jwt_required()
def approve_license(license_id):
    """Approve a trade license application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.approve'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    if license.status != 'Pending':
        return jsonify({'error': 'Only pending applications can be approved'}), 400
    
    data = request.get_json()
    remarks = data.get('remarks', '')
    valid_from = data.get('valid_from')
    valid_until = data.get('valid_until')
    
    if not valid_from or not valid_until:
        return jsonify({'error': 'valid_from and valid_until are required'}), 400
    
    try:
        # Parse dates
        valid_from_date = datetime.strptime(valid_from, '%Y-%m-%d').date()
        valid_until_date = datetime.strptime(valid_until, '%Y-%m-%d').date()
        
        # Approve license
        license.approve(
            approved_by=current_user_id,
            remarks=remarks,
            valid_from=valid_from_date,
            valid_until=valid_until_date
        )
        
        return jsonify({
            'message': 'License approved successfully',
            'license': license.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/<uuid:license_id>/reject', methods=['POST'])
@jwt_required()
def reject_license(license_id):
    """Reject a trade license application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.approve'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    if license.status != 'Pending':
        return jsonify({'error': 'Only pending applications can be rejected'}), 400
    
    data = request.get_json()
    remarks = data.get('remarks', '')
    
    if not remarks:
        return jsonify({'error': 'Remarks are required for rejection'}), 400
    
    try:
        # Reject license
        license.reject(
            rejected_by=current_user_id,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'License rejected successfully',
            'license': license.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/<uuid:license_id>/renew', methods=['POST'])
@jwt_required()
def renew_license(license_id):
    """Renew a trade license"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    if license.status != 'Approved':
        return jsonify({'error': 'Only approved licenses can be renewed'}), 400
    
    data = request.get_json()
    valid_until = data.get('valid_until')
    
    if not valid_until:
        return jsonify({'error': 'valid_until is required for renewal'}), 400
    
    try:
        # Parse date
        valid_until_date = datetime.strptime(valid_until, '%Y-%m-%d').date()
        
        # Renew license
        license.renew(valid_until_date)
        
        return jsonify({
            'message': 'License renewed successfully',
            'license': license.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/<uuid:license_id>/fee', methods=['POST'])
@jwt_required()
def pay_license_fee(license_id):
    """Pay fee for a trade license"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    license = TradeLicense.query.get(license_id)
    
    if not license:
        return jsonify({'error': 'License not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        success, message = license.pay_fee(
            amount=data['amount'],
            payment_method=data['payment_method'],
            payment_reference=data.get('payment_reference')
        )
        
        if success:
            return jsonify({
                'message': message,
                'license': license.to_dict()
            }), 200
        else:
            return jsonify({'error': message}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@licenses_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_license_dashboard_stats():
    """Get license dashboard statistics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('license.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get overall stats
    total_licenses = TradeLicense.query.count()
    pending = TradeLicense.query.filter_by(status='Pending').count()
    approved = TradeLicense.query.filter_by(status='Approved').count()
    rejected = TradeLicense.query.filter_by(status='Rejected').count()
    expired = TradeLicense.query.filter_by(status='Expired').count()
    
    # Get expiring soon (within 30 days)
    thirty_days_from_now = datetime.now() + timedelta(days=30)
    expiring_soon = TradeLicense.query.filter(
        TradeLicense.status == 'Approved',
        TradeLicense.valid_until <= thirty_days_from_now
    ).count()
    
    # Get stats by business type
    business_type_stats = db.session.query(
        TradeLicense.business_type,
        db.func.count(TradeLicense.id).label('count')
    ).group_by(TradeLicense.business_type).all()
    
    # Get stats by ward
    ward_stats = db.session.query(
        TradeLicense.ward_number,
        db.func.count(TradeLicense.id).label('count')
    ).group_by(TradeLicense.ward_number).all()
    
    return jsonify({
        'overall': {
            'total': total_licenses,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'expired': expired,
            'expiring_soon': expiring_soon
        },
        'by_business_type': [{'type': bt, 'count': count} for bt, count in business_type_stats],
        'by_ward': [{'ward': ward, 'count': count} for ward, count in ward_stats]
    }), 200