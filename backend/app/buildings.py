from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import uuid
from extensions import db
from models.building_plan import BuildingPlan
from models.user import User
from models.citizen import Citizen
from models.property import Property

buildings_bp = Blueprint('buildings', __name__)

def generate_plan_number():
    """Generate a unique building plan number"""
    year = datetime.now().year
    count = BuildingPlan.query.filter(
        BuildingPlan.created_at >= datetime(year, 1, 1)
    ).count() + 1
    return f"BP{year}{count:05d}"

@buildings_bp.route('/', methods=['GET'])
@jwt_required()
def get_building_plans():
    """Get all building plans with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    plan_type = request.args.get('plan_type', '')
    ward = request.args.get('ward', '')
    
    # Build query
    query = BuildingPlan.query
    
    # Apply filters
    if search:
        query = query.filter(
            (BuildingPlan.plan_number.ilike(f'%{search}%')) |
            (BuildingPlan.building_name.ilike(f'%{search}%')) |
            (BuildingPlan.applicant_name.ilike(f'%{search}%'))
        )
    
    if status:
        query = query.filter(BuildingPlan.status == status)
    
    if plan_type:
        query = query.filter(BuildingPlan.plan_type == plan_type)
    
    if ward:
        query = query.filter(BuildingPlan.ward_number == ward)
    
    # Order by creation date (newest first)
    query = query.order_by(BuildingPlan.created_at.desc())
    
    # Paginate
    plans = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'plans': [plan.to_dict() for plan in plans.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': plans.total,
            'pages': plans.pages
        }
    }), 200

@buildings_bp.route('/', methods=['POST'])
@jwt_required()
def create_building_plan():
    """Create a new building plan application"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['building_name', 'plan_type', 'applicant_name', 'address_line1',
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
    
    # Check if property exists if property_id is provided
    property_id = data.get('property_id')
    if property_id:
        property = Property.query.get(property_id)
        if not property:
            return jsonify({'error': 'Property not found'}), 404
    
    try:
        # Generate plan number
        plan_number = generate_plan_number()
        
        # Create new building plan
        new_plan = BuildingPlan(
            plan_number=plan_number,
            building_name=data['building_name'],
            plan_type=data['plan_type'],
            applicant_name=data['applicant_name'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            city=data['city'],
            state=data['state'],
            pincode=data['pincode'],
            applicant_id=applicant_id,
            property_id=property_id,
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark'),
            phone=data.get('phone'),
            email=data.get('email'),
            architect_name=data.get('architect_name'),
            architect_contact=data.get('architect_contact'),
            engineer_name=data.get('engineer_name'),
            engineer_contact=data.get('engineer_contact'),
            plot_area=data.get('plot_area'),
            existing_built_up_area=data.get('existing_built_up_area'),
            proposed_built_up_area=data.get('proposed_built_up_area'),
            number_of_floors=data.get('number_of_floors'),
            floor_height=data.get('floor_height'),
            building_height=data.get('building_height'),
            setback_front=data.get('setback_front'),
            setback_back=data.get('setback_back'),
            setback_left=data.get('setback_left'),
            setback_right=data.get('setback_right'),
            parking_spaces=data.get('parking_spaces'),
            building_usage=data.get('building_usage'),
            construction_type=data.get('construction_type'),
            estimated_cost=data.get('estimated_cost')
        )
        
        db.session.add(new_plan)
        db.session.commit()
        
        return jsonify({
            'message': 'Building plan application created successfully',
            'plan': new_plan.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>', methods=['GET'])
@jwt_required()
def get_building_plan(plan_id):
    """Get a specific building plan by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    return jsonify({
        'plan': plan.to_dict()
    }), 200

@buildings_bp.route('/<uuid:plan_id>', methods=['PUT'])
@jwt_required()
def update_building_plan(plan_id):
    """Update a building plan"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'building_name', 'plan_type', 'applicant_name', 'address_line1',
            'address_line2', 'landmark', 'area', 'ward_number', 'zone',
            'city', 'state', 'pincode', 'phone', 'email', 'architect_name',
            'architect_contact', 'engineer_name', 'engineer_contact', 'plot_area',
            'existing_built_up_area', 'proposed_built_up_area', 'number_of_floors',
            'floor_height', 'building_height', 'setback_front', 'setback_back',
            'setback_left', 'setback_right', 'parking_spaces', 'building_usage',
            'construction_type', 'estimated_cost'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(plan, field, data[field])
        
        plan.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Building plan updated successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/submit', methods=['POST'])
@jwt_required()
def submit_building_plan(plan_id):
    """Submit a building plan for review"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    if plan.status != 'Draft':
        return jsonify({'error': 'Only draft plans can be submitted'}), 400
    
    try:
        plan.submit_for_review()
        
        return jsonify({
            'message': 'Building plan submitted for review successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/review', methods=['POST'])
@jwt_required()
def review_building_plan(plan_id):
    """Review a building plan (Junior Engineer)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.review'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    if plan.status != 'Under Review':
        return jsonify({'error': 'Only plans under review can be reviewed'}), 400
    
    data = request.get_json()
    review_status = data.get('status')
    remarks = data.get('remarks', '')
    
    if not review_status:
        return jsonify({'error': 'status is required'}), 400
    
    valid_statuses = ['Approved by JE', 'Rejected by JE']
    if review_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        plan.review_by_je(
            reviewed_by=current_user_id,
            status=review_status,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'Building plan reviewed successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/verify', methods=['POST'])
@jwt_required()
def verify_building_plan(plan_id):
    """Verify a building plan (Assistant Engineer)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.verify'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    if plan.status != 'Approved by JE':
        return jsonify({'error': 'Only plans approved by JE can be verified'}), 400
    
    data = request.get_json()
    verification_status = data.get('status')
    remarks = data.get('remarks', '')
    
    if not verification_status:
        return jsonify({'error': 'status is required'}), 400
    
    valid_statuses = ['Approved by AE', 'Rejected by AE']
    if verification_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        plan.verify_by_ae(
            verified_by=current_user_id,
            status=verification_status,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'Building plan verified successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/sanction', methods=['POST'])
@jwt_required()
def sanction_building_plan(plan_id):
    """Sanction a building plan (Town Planner)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.sanction'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    if plan.status != 'Approved by AE':
        return jsonify({'error': 'Only plans approved by AE can be sanctioned'}), 400
    
    data = request.get_json()
    sanction_status = data.get('status')
    remarks = data.get('remarks', '')
    
    if not sanction_status:
        return jsonify({'error': 'status is required'}), 400
    
    valid_statuses = ['Approved by TP', 'Rejected by TP']
    if sanction_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        plan.sanction_by_tp(
            sanctioned_by=current_user_id,
            status=sanction_status,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'Building plan sanctioned successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/final-approval', methods=['POST'])
@jwt_required()
def final_approve_building_plan(plan_id):
    """Give final approval to a building plan (Commissioner)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.approve'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    if plan.status != 'Approved by TP':
        return jsonify({'error': 'Only plans approved by TP can receive final approval'}), 400
    
    data = request.get_json()
    approval_status = data.get('status')
    remarks = data.get('remarks', '')
    
    if not approval_status:
        return jsonify({'error': 'status is required'}), 400
    
    valid_statuses = ['Approved', 'Rejected']
    if approval_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        plan.final_approval(
            approved_by=current_user_id,
            status=approval_status,
            remarks=remarks
        )
        
        return jsonify({
            'message': 'Building plan final approval completed successfully',
            'plan': plan.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/<uuid:plan_id>/fee', methods=['POST'])
@jwt_required()
def pay_building_fee(plan_id):
    """Pay fee for a building plan"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    plan = BuildingPlan.query.get(plan_id)
    
    if not plan:
        return jsonify({'error': 'Building plan not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['amount', 'payment_method']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        success, message = plan.pay_fee(
            amount=data['amount'],
            payment_method=data['payment_method'],
            payment_reference=data.get('payment_reference')
        )
        
        if success:
            return jsonify({
                'message': message,
                'plan': plan.to_dict()
            }), 200
        else:
            return jsonify({'error': message}), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@buildings_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_building_dashboard_stats():
    """Get building plan dashboard statistics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('building.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get overall stats
    total_plans = BuildingPlan.query.count()
    draft = BuildingPlan.query.filter_by(status='Draft').count()
    under_review = BuildingPlan.query.filter_by(status='Under Review').count()
    approved_je = BuildingPlan.query.filter_by(status='Approved by JE').count()
    approved_ae = BuildingPlan.query.filter_by(status='Approved by AE').count()
    approved_tp = BuildingPlan.query.filter_by(status='Approved by TP').count()
    approved = BuildingPlan.query.filter_by(status='Approved').count()
    rejected = BuildingPlan.query.filter(BuildingPlan.status.like('%Rejected%')).count()
    
    # Get stats by plan type
    plan_type_stats = db.session.query(
        BuildingPlan.plan_type,
        db.func.count(BuildingPlan.id).label('count')
    ).group_by(BuildingPlan.plan_type).all()
    
    # Get stats by ward
    ward_stats = db.session.query(
        BuildingPlan.ward_number,
        db.func.count(BuildingPlan.id).label('count')
    ).group_by(BuildingPlan.ward_number).all()
    
    return jsonify({
        'overall': {
            'total': total_plans,
            'draft': draft,
            'under_review': under_review,
            'approved_je': approved_je,
            'approved_ae': approved_ae,
            'approved_tp': approved_tp,
            'approved': approved,
            'rejected': rejected
        },
        'by_plan_type': [{'type': pt, 'count': count} for pt, count in plan_type_stats],
        'by_ward': [{'ward': ward, 'count': count} for ward, count in ward_stats]
    }), 200