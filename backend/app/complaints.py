from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import uuid
from app import db
from models.complaint import Complaint
from models.complaint_category import ComplaintCategory
from models.user import User
from models.citizen import Citizen

complaints_bp = Blueprint('complaints', __name__)

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_complaint_number():
    """Generate a unique complaint number"""
    year = datetime.now().year
    month = datetime.now().month
    count = Complaint.query.filter(
        Complaint.created_at >= datetime(year, month, 1)
    ).count() + 1
    return f"COMP{year}{month:02d}{count:04d}"

@complaints_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_complaint_categories():
    """Get all complaint categories"""
    categories = ComplaintCategory.query.filter_by(is_active=True).all()
    
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

@complaints_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_complaint_category():
    """Create a new complaint category"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'department']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        new_category = ComplaintCategory(
            name=data['name'],
            department=data['department'],
            description=data.get('description'),
            priority=data.get('priority', 'Medium'),
            resolution_time_hours=data.get('resolution_time_hours', 48),
            escalation_matrix=data.get('escalation_matrix', [])
        )
        
        db.session.add(new_category)
        db.session.commit()
        
        return jsonify({
            'message': 'Complaint category created successfully',
            'category': new_category.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/', methods=['POST'])
@jwt_required()
def create_complaint():
    """Create a new complaint"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'description', 'address_line1', 'area', 
                      'ward_number', 'zone', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if category exists
    category = ComplaintCategory.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Invalid category'}), 404
    
    # Get citizen ID (from user if citizen role, or from request data)
    if user.role.name == 'Citizen':
        complainant_id = user.citizen_id
        if not complainant_id:
            return jsonify({'error': 'User account not linked to citizen profile'}), 400
    else:
        complainant_id = data.get('complainant_id')
        if not complainant_id:
            return jsonify({'error': 'complainant_id is required for non-citizen users'}), 400
    
    try:
        # Generate complaint number
        complaint_number = generate_complaint_number()
        
        # Handle file uploads if any
        image_path = None
        video_path = None
        
        # Create new complaint
        new_complaint = Complaint(
            complaint_number=complaint_number,
            title=data['title'],
            description=data['description'],
            address_line1=data['address_line1'],
            area=data['area'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            complainant_id=complainant_id,
            category_id=data['category_id'],
            address_line2=data.get('address_line2'),
            landmark=data.get('landmark'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            image_path=image_path,
            video_path=video_path,
            priority=data.get('priority', category.priority)
        )
        
        db.session.add(new_complaint)
        db.session.commit()
        
        return jsonify({
            'message': 'Complaint created successfully',
            'complaint': new_complaint.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/', methods=['GET'])
@jwt_required()
def get_complaints():
    """Get all complaints with pagination and filtering"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    category_id = request.args.get('category_id', '')
    ward = request.args.get('ward', '')
    assigned_to = request.args.get('assigned_to', '')
    
    # Build query
    query = Complaint.query
    
    # Apply filters
    if search:
        query = query.filter(
            (Complaint.complaint_number.ilike(f'%{search}%')) |
            (Complaint.title.ilike(f'%{search}%')) |
            (Complaint.description.ilike(f'%{search}%'))
        )
    
    if status:
        query = query.filter(Complaint.status == status)
    
    if category_id:
        try:
            category_uuid = uuid.UUID(category_id)
            query = query.filter(Complaint.category_id == category_uuid)
        except ValueError:
            return jsonify({'error': 'Invalid category_id format'}), 400
    
    if ward:
        query = query.filter(Complaint.ward_number == ward)
    
    if assigned_to:
        try:
            assigned_uuid = uuid.UUID(assigned_to)
            query = query.filter(Complaint.assigned_to == assigned_uuid)
        except ValueError:
            return jsonify({'error': 'Invalid assigned_to format'}), 400
    
    # Order by creation date (newest first)
    query = query.order_by(Complaint.created_at.desc())
    
    # Paginate
    complaints = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'complaints': [complaint.to_dict() for complaint in complaints.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': complaints.total,
            'pages': complaints.pages
        }
    }), 200

@complaints_bp.route('/<uuid:complaint_id>', methods=['GET'])
@jwt_required()
def get_complaint(complaint_id):
    """Get a specific complaint by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    return jsonify({
        'complaint': complaint.to_dict()
    }), 200

@complaints_bp.route('/<uuid:complaint_id>/assign', methods=['POST'])
@jwt_required()
def assign_complaint(complaint_id):
    """Assign a complaint to a user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    data = request.get_json()
    assigned_to_id = data.get('assigned_to')
    
    if not assigned_to_id:
        return jsonify({'error': 'assigned_to is required'}), 400
    
    # Check if assignee exists
    assignee = User.query.get(assigned_to_id)
    if not assignee:
        return jsonify({'error': 'Assignee not found'}), 404
    
    try:
        complaint.assign_to(assigned_to_id)
        
        return jsonify({
            'message': 'Complaint assigned successfully',
            'complaint': complaint.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/<uuid:complaint_id>/status', methods=['POST'])
@jwt_required()
def update_complaint_status(complaint_id):
    """Update complaint status"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    data = request.get_json()
    status = data.get('status')
    notes = data.get('notes')
    
    if not status:
        return jsonify({'error': 'status is required'}), 400
    
    valid_statuses = ['Submitted', 'In Progress', 'Resolved', 'Rejected', 'Closed']
    if status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    try:
        complaint.update_status(status, notes, current_user_id)
        
        return jsonify({
            'message': 'Complaint status updated successfully',
            'complaint': complaint.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/<uuid:complaint_id>/escalate', methods=['POST'])
@jwt_required()
def escalate_complaint(complaint_id):
    """Escalate a complaint to higher authority"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    data = request.get_json()
    escalate_to = data.get('escalate_to')
    level = data.get('level', complaint.escalation_level + 1)
    
    if not escalate_to:
        return jsonify({'error': 'escalate_to is required'}), 400
    
    # Check if escalation target exists
    target_user = User.query.get(escalate_to)
    if not target_user:
        return jsonify({'error': 'Escalation target not found'}), 404
    
    try:
        complaint.escalate(escalate_to, level)
        
        return jsonify({
            'message': 'Complaint escalated successfully',
            'complaint': complaint.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/<uuid:complaint_id>/feedback', methods=['POST'])
@jwt_required()
def add_complaint_feedback(complaint_id):
    """Add feedback to a resolved complaint"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    complaint = Complaint.query.get(complaint_id)
    
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404
    
    # Check if complaint is resolved
    if complaint.status != 'Resolved':
        return jsonify({'error': 'Feedback can only be added to resolved complaints'}), 400
    
    # Check if user is the complainant
    if user.role.name == 'Citizen' and complaint.complainant_id != user.citizen_id:
        return jsonify({'error': 'Only the complainant can add feedback'}), 403
    
    data = request.get_json()
    feedback = data.get('feedback')
    rating = data.get('rating')
    
    if not feedback or not rating:
        return jsonify({'error': 'feedback and rating are required'}), 400
    
    if not 1 <= rating <= 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    try:
        complaint.add_feedback(feedback, rating)
        
        return jsonify({
            'message': 'Feedback added successfully',
            'complaint': complaint.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@complaints_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_complaint_dashboard_stats():
    """Get complaint dashboard statistics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('complaint.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get overall stats
    total_complaints = Complaint.query.count()
    submitted = Complaint.query.filter_by(status='Submitted').count()
    in_progress = Complaint.query.filter_by(status='In Progress').count()
    resolved = Complaint.query.filter_by(status='Resolved').count()
    rejected = Complaint.query.filter_by(status='Rejected').count()
    closed = Complaint.query.filter_by(status='Closed').count()
    
    # Get overdue complaints
    overdue_count = 0
    for complaint in Complaint.query.filter(Complaint.status.in_(['Submitted', 'In Progress'])).all():
        if complaint.is_overdue():
            overdue_count += 1
    
    # Get stats by category
    category_stats = db.session.query(
        ComplaintCategory.name,
        db.func.count(Complaint.id).label('count')
    ).join(Complaint).group_by(ComplaintCategory.name).all()
    
    # Get stats by ward
    ward_stats = db.session.query(
        Complaint.ward_number,
        db.func.count(Complaint.id).label('count')
    ).group_by(Complaint.ward_number).all()
    
    return jsonify({
        'overall': {
            'total': total_complaints,
            'submitted': submitted,
            'in_progress': in_progress,
            'resolved': resolved,
            'rejected': rejected,
            'closed': closed,
            'overdue': overdue_count
        },
        'by_category': [{'name': name, 'count': count} for name, count in category_stats],
        'by_ward': [{'ward': ward, 'count': count} for ward, count in ward_stats]
    }), 200