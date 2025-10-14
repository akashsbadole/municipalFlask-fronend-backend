from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid
from app import db
from models.water_connection import WaterConnection
from models.water_meter_reading import WaterMeterReading
from models.user import User
from models.citizen import Citizen
from models.property import Property

water_bp = Blueprint('water', __name__)

def generate_connection_number():
    """Generate a unique water connection number"""
    year = datetime.now().year
    count = WaterConnection.query.filter(
        WaterConnection.created_at >= datetime(year, 1, 1)
    ).count() + 1
    return f"WC{year}{count:05d}"

@water_bp.route('/connections', methods=['GET'])
@jwt_required()
def get_water_connections():
    """Get all water connections with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    connection_type = request.args.get('connection_type', '')
    ward = request.args.get('ward', '')
    
    # Build query
    query = WaterConnection.query
    
    # Apply filters
    if search:
        query = query.filter(
            (WaterConnection.connection_number.ilike(f'%{search}%')) |
            (WaterConnection.consumer_name.ilike(f'%{search}%')) |
            (WaterConnection.address.ilike(f'%{search}%'))
        )
    
    if status:
        query = query.filter(WaterConnection.status == status)
    
    if connection_type:
        query = query.filter(WaterConnection.connection_type == connection_type)
    
    if ward:
        query = query.filter(WaterConnection.ward_number == ward)
    
    # Order by creation date (newest first)
    query = query.order_by(WaterConnection.created_at.desc())
    
    # Paginate
    connections = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'connections': [connection.to_dict() for connection in connections.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': connections.total,
            'pages': connections.pages
        }
    }), 200

@water_bp.route('/connections', methods=['POST'])
@jwt_required()
def create_water_connection():
    """Create a new water connection application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['consumer_name', 'address_line1', 'area', 'ward_number',
                      'zone', 'city', 'state', 'pincode', 'connection_type']
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
    
    # Check if property exists if property_id is provided
    property_id = data.get('property_id')
    if property_id:
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
    
    try:
        # Generate connection number
        connection_number = generate_connection_number()
        
        # Create new connection
        new_connection = WaterConnection(
            connection_number=connection_number,
            consumer_name=data['consumer_name'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            city=data['city'],
            state=data['state'],
            pincode=data['pincode'],
            connection_type=data['connection_type'],
            applicant_id=applicant_id,
            property_id=property_id,
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark'),
            phone=data.get('phone'),
            email=data.get('email'),
            purpose=data.get('purpose'),
            property_type=data.get('property_type'),
            pipe_size=data.get('pipe_size'),
            estimated_monthly_consumption=data.get('estimated_monthly_consumption'),
            meter_number=data.get('meter_number'),
            meter_make=data.get('meter_make'),
            installation_date=data.get('installation_date'),
            lat=data.get('lat'),
            lng=data.get('lng')
        )
        
        db.session.add(new_connection)
        db.session.commit()
        
        return jsonify({
            'message': 'Water connection application created successfully',
            'connection': new_connection.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/connections/<uuid:connection_id>', methods=['GET'])
@jwt_required()
def get_water_connection(connection_id):
    """Get a specific water connection by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    return jsonify({
        'connection': connection.to_dict()
    }), 200

@water_bp.route('/connections/<uuid:connection_id>', methods=['PUT'])
@jwt_required()
def update_water_connection(connection_id):
    """Update a water connection"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'consumer_name', 'address_line1', 'address_line2', 'landmark', 'area',
            'ward_number', 'zone', 'city', 'state', 'pincode', 'phone', 'email',
            'purpose', 'property_type', 'pipe_size', 'estimated_monthly_consumption',
            'meter_number', 'meter_make', 'installation_date', 'lat', 'lng', 'status'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(connection, field, data[field])
        
        connection.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Water connection updated successfully',
            'connection': connection.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/connections/<uuid:connection_id>/approve', methods=['POST'])
@jwt_required()
def approve_water_connection(connection_id):
    """Approve a water connection application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.approve'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    if connection.status != 'Pending':
        return jsonify({'error': 'Only pending applications can be approved'}), 400
    
    data = request.get_json()
    remarks = data.get('remarks', '')
    installation_date = data.get('installation_date')
    
    if not installation_date:
        return jsonify({'error': 'installation_date is required'}), 400
    
    try:
        # Parse installation date
        install_date = datetime.strptime(installation_date, '%Y-%m-%d').date()
        
        # Approve connection
        connection.approve(
            approved_by=current_user_id,
            remarks=remarks,
            installation_date=install_date
        )
        
        return jsonify({
            'message': 'Water connection approved successfully',
            'connection': connection.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/connections/<uuid:connection_id>/reject', methods=['POST'])
@jwt_required()
def reject_water_connection(connection_id):
    """Reject a water connection application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.approve'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    if connection.status != 'Pending':
        return jsonify({'error': 'Only pending applications can be rejected'}), 400
    
    data = request.get_json()
    remarks = data.get('remarks', '')
    
    if not remarks:
        return jsonify({'error': 'Remarks are required for rejection'}), 400
    
    try:
        # Reject connection
        connection.reject(
            rejected_by=current_user_id,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'Water connection rejected successfully',
            'connection': connection.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/connections/<uuid:connection_id>/meter-readings', methods=['GET'])
@jwt_required()
def get_meter_readings(connection_id):
    """Get all meter readings for a water connection"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Get meter readings
    readings = WaterMeterReading.query.filter_by(
        connection_id=connection_id
    ).order_by(WaterMeterReading.reading_date.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'readings': [reading.to_dict() for reading in readings.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': readings.total,
            'pages': readings.pages
        }
    }), 200

@water_bp.route('/connections/<uuid:connection_id>/meter-readings', methods=['POST'])
@jwt_required()
def add_meter_reading(connection_id):
    """Add a new meter reading for a water connection"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['reading_date', 'current_reading', 'units_consumed']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Parse reading date
        reading_date = datetime.strptime(data['reading_date'], '%Y-%m-%d').date()
        
        # Create new meter reading
        new_reading = WaterMeterReading(
            connection_id=connection_id,
            reading_date=reading_date,
            current_reading=data['current_reading'],
            previous_reading=data.get('previous_reading', 0),
            units_consumed=data['units_consumed'],
            amount=data.get('amount', 0),
            reading_status=data.get('reading_status', 'Normal'),
            remarks=data.get('remarks'),
            recorded_by=current_user_id
        )
        
        db.session.add(new_reading)
        db.session.commit()
        
        return jsonify({
            'message': 'Meter reading added successfully',
            'reading': new_reading.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/connections/<uuid:connection_id>/bills', methods=['GET'])
@jwt_required()
def get_water_bills(connection_id):
    """Get all water bills for a connection"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    connection = WaterConnection.query.get(connection_id)
    
    if not connection:
        return jsonify({'error': 'Water connection not found'}), 404
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status', '')
    
    # Build query
    query = WaterMeterReading.query.filter_by(connection_id=connection_id)
    
    if status:
        query = query.filter(WaterMeterReading.payment_status == status)
    
    # Order by reading date (newest first)
    query = query.order_by(WaterMeterReading.reading_date.desc())
    
    # Paginate
    bills = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'bills': [bill.to_dict() for bill in bills.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': bills.total,
            'pages': bills.pages
        }
    }), 200

@water_bp.route('/bills/<uuid:bill_id>/pay', methods=['POST'])
@jwt_required()
def pay_water_bill(bill_id):
    """Pay a water bill"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    bill = WaterMeterReading.query.get(bill_id)
    
    if not bill:
        return jsonify({'error': 'Bill not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        success, message = bill.pay_bill(
            amount=data['amount'],
            payment_method=data['payment_method'],
            payment_reference=data.get('payment_reference')
        )
        
        if success:
            return jsonify({
                'message': message,
                'bill': bill.to_dict()
            }), 200
        else:
            return jsonify({'error': message}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@water_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_water_dashboard_stats():
    """Get water supply dashboard statistics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('water.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get overall stats
    total_connections = WaterConnection.query.count()
    pending = WaterConnection.query.filter_by(status='Pending').count()
    active = WaterConnection.query.filter_by(status='Active').count()
    inactive = WaterConnection.query.filter_by(status='Inactive').count()
    rejected = WaterConnection.query.filter_by(status='Rejected').count()
    
    # Get stats by connection type
    connection_type_stats = db.session.query(
        WaterConnection.connection_type,
        db.func.count(WaterConnection.id).label('count')
    ).group_by(WaterConnection.connection_type).all()
    
    # Get stats by ward
    ward_stats = db.session.query(
        WaterConnection.ward_number,
        db.func.count(WaterConnection.id).label('count')
    ).group_by(WaterConnection.ward_number).all()
    
    # Get consumption stats (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    consumption_stats = db.session.query(
        db.func.sum(WaterMeterReading.units_consumed).label('total_consumption'),
        db.func.sum(WaterMeterReading.amount).label('total_amount'),
        db.func.count(WaterMeterReading.id).label('total_readings')
    ).filter(
        WaterMeterReading.reading_date >= six_months_ago.date()
    ).first()
    
    # Get monthly consumption trend
    monthly_trend = db.session.query(
        db.func.date_trunc('month', WaterMeterReading.reading_date).label('month'),
        db.func.sum(WaterMeterReading.units_consumed).label('consumption'),
        db.func.count(WaterMeterReading.id).label('readings')
    ).filter(
        WaterMeterReading.reading_date >= six_months_ago.date()
    ).group_by(
        db.func.date_trunc('month', WaterMeterReading.reading_date)
    ).order_by('month').all()
    
    return jsonify({
        'overall': {
            'total_connections': total_connections,
            'pending': pending,
            'active': active,
            'inactive': inactive,
            'rejected': rejected
        },
        'by_connection_type': [
            {'type': ct, 'count': count} for ct, count in connection_type_stats
        ],
        'by_ward': [
            {'ward': ward, 'count': count} for ward, count in ward_stats
        ],
        'consumption': {
            'total_consumption': float(consumption_stats.total_consumption or 0),
            'total_amount': float(consumption_stats.total_amount or 0),
            'total_readings': consumption_stats.total_readings or 0
        },
        'monthly_trend': [
            {
                'month': month.isoformat() if month else None,
                'consumption': float(consumption or 0),
                'readings': readings
            } for month, consumption, readings in monthly_trend
        ]
    }), 200