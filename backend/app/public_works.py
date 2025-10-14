from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.public_works import Project, Tender, TenderBidder, ProjectMilestone, ProjectDocument, ProjectInspection, ProjectExpense
from app import db
from datetime import datetime, date
import uuid
import os

public_works_bp = Blueprint('public_works', __name__, url_prefix='/api/public-works')

# Helper function to check permissions
def check_permission(permission_name):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return False
    
    # Super Admin has all permissions
    if user.role.name == 'Super Admin':
        return True
    
    # Check user's role permissions
    for perm in user.role.permissions:
        if perm.name == permission_name:
            return True
    
    return False

# Error handler
def handle_error(message, status_code=400):
    return jsonify({'error': message}), status_code

# Generate project code
def generate_project_code():
    year = datetime.now().year
    count = Project.query.filter(Project.project_code.like(f'PW{year}%')).count()
    return f'PW{year}{str(count + 1).zfill(4)}'

# Generate tender number
def generate_tender_number():
    year = datetime.now().year
    count = Tender.query.filter(Tender.tender_number.like(f'T{year}%')).count()
    return f'T{year}{str(count + 1).zfill(4)}'

# Project Management Routes
@public_works_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view projects', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        project_type = request.args.get('project_type')
        ward = request.args.get('ward')
        search = request.args.get('search')
        
        query = Project.query
        
        if status:
            query = query.filter(Project.status == status)
        
        if project_type:
            query = query.filter(Project.project_type == project_type)
        
        if ward:
            query = query.filter(Project.ward == ward)
        
        if search:
            query = query.filter(
                db.or_(
                    Project.title.ilike(f'%{search}%'),
                    Project.project_code.ilike(f'%{search}%'),
                    Project.contractor_name.ilike(f'%{search}%')
                )
            )
        
        projects = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'projects': [project.to_dict() for project in projects.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': projects.total,
                'pages': projects.pages,
                'has_next': projects.has_next,
                'has_prev': projects.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching projects: {str(e)}")
        return handle_error('Failed to fetch projects', 500)

@public_works_bp.route('/projects/<project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view project details', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        return jsonify(project.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching project: {str(e)}")
        return handle_error('Failed to fetch project', 500)

@public_works_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    if not check_permission('public_works.create'):
        return handle_error('You do not have permission to create projects', 403)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'project_type', 'category', 'ward', 'zone',
                          'address', 'estimated_cost', 'start_date', 'planned_end_date', 'department']
        
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        # Create project
        project = Project(
            project_code=generate_project_code(),
            title=data['title'],
            description=data['description'],
            project_type=data['project_type'],
            category=data['category'],
            ward=data['ward'],
            zone=data['zone'],
            address=data['address'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            estimated_cost=data['estimated_cost'],
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date(),
            planned_end_date=datetime.strptime(data['planned_end_date'], '%Y-%m-%d').date(),
            department=data['department'],
            project_manager=data.get('project_manager'),
            engineer_in_charge=data.get('engineer_in_charge'),
            created_by=get_jwt_identity()
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify(project.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating project: {str(e)}")
        return handle_error('Failed to create project', 500)

@public_works_bp.route('/projects/<project_id>', methods=['PUT'])
@jwt_required()
def update_project(project_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to update projects', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        data = request.get_json()
        
        # Update project fields
        updatable_fields = ['title', 'description', 'project_type', 'category', 'ward', 'zone',
                           'address', 'latitude', 'longitude', 'estimated_cost', 'actual_cost',
                           'start_date', 'planned_end_date', 'actual_end_date', 'status',
                           'progress_percentage', 'contractor_name', 'contractor_contact',
                           'contractor_email', 'department', 'project_manager', 'engineer_in_charge']
        
        for field in updatable_fields:
            if field in data:
                if field in ['start_date', 'planned_end_date', 'actual_end_date'] and data[field]:
                    setattr(project, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(project, field, data[field])
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(project.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating project: {str(e)}")
        return handle_error('Failed to update project', 500)

@public_works_bp.route('/projects/<project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    if not check_permission('public_works.delete'):
        return handle_error('You do not have permission to delete projects', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Project deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting project: {str(e)}")
        return handle_error('Failed to delete project', 500)

# Tender Management Routes
@public_works_bp.route('/tenders', methods=['GET'])
@jwt_required()
def get_tenders():
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view tenders', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        project_id = request.args.get('project_id')
        search = request.args.get('search')
        
        query = Tender.query
        
        if status:
            query = query.filter(Tender.status == status)
        
        if project_id:
            query = query.filter(Tender.project_id == project_id)
        
        if search:
            query = query.filter(
                db.or_(
                    Tender.title.ilike(f'%{search}%'),
                    Tender.tender_number.ilike(f'%{search}%')
                )
            )
        
        tenders = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'tenders': [tender.to_dict() for tender in tenders.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': tenders.total,
                'pages': tenders.pages,
                'has_next': tenders.has_next,
                'has_prev': tenders.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching tenders: {str(e)}")
        return handle_error('Failed to fetch tenders', 500)

@public_works_bp.route('/tenders', methods=['POST'])
@jwt_required()
def create_tender():
    if not check_permission('public_works.create'):
        return handle_error('You do not have permission to create tenders', 403)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['project_id', 'title', 'description', 'publication_date',
                          'submission_start_date', 'submission_end_date', 'opening_date',
                          'estimated_cost', 'earnest_money_deposit']
        
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        # Check if project exists
        project = Project.query.filter_by(id=data['project_id']).first()
        if not project:
            return handle_error('Project not found', 404)
        
        # Create tender
        tender = Tender(
            project_id=data['project_id'],
            tender_number=generate_tender_number(),
            title=data['title'],
            description=data['description'],
            publication_date=datetime.strptime(data['publication_date'], '%Y-%m-%d').date(),
            submission_start_date=datetime.strptime(data['submission_start_date'], '%Y-%m-%d').date(),
            submission_end_date=datetime.strptime(data['submission_end_date'], '%Y-%m-%d').date(),
            opening_date=datetime.strptime(data['opening_date'], '%Y-%m-%d').date(),
            estimated_cost=data['estimated_cost'],
            earnest_money_deposit=data['earnest_money_deposit'],
            created_by=get_jwt_identity()
        )
        
        db.session.add(tender)
        db.session.commit()
        
        return jsonify(tender.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating tender: {str(e)}")
        return handle_error('Failed to create tender', 500)

@public_works_bp.route('/tenders/<tender_id>', methods=['GET'])
@jwt_required()
def get_tender(tender_id):
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view tender details', 403)
    
    try:
        tender = Tender.query.filter_by(id=tender_id).first()
        if not tender:
            return handle_error('Tender not found', 404)
        
        return jsonify(tender.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching tender: {str(e)}")
        return handle_error('Failed to fetch tender', 500)

@public_works_bp.route('/tenders/<tender_id>/award', methods=['POST'])
@jwt_required()
def award_tender(tender_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to award tenders', 403)
    
    try:
        tender = Tender.query.filter_by(id=tender_id).first()
        if not tender:
            return handle_error('Tender not found', 404)
        
        if tender.status != 'Closed':
            return handle_error('Tender must be closed before awarding', 400)
        
        data = request.get_json()
        
        # Update tender status
        tender.status = 'Awarded'
        tender.awarded_to = data.get('awarded_to')
        tender.awarded_amount = data.get('awarded_amount')
        tender.awarded_date = datetime.now().date()
        
        # Update project with contractor information
        if tender.project_id and data.get('awarded_to'):
            project = Project.query.filter_by(id=tender.project_id).first()
            if project:
                project.contractor_name = data.get('awarded_to')
                project.status = 'In Progress'
        
        db.session.commit()
        
        return jsonify(tender.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error awarding tender: {str(e)}")
        return handle_error('Failed to award tender', 500)

# Milestone Management Routes
@public_works_bp.route('/projects/<project_id>/milestones', methods=['GET'])
@jwt_required()
def get_milestones(project_id):
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view milestones', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        milestones = ProjectMilestone.query.filter_by(project_id=project_id).all()
        
        return jsonify([milestone.to_dict() for milestone in milestones]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching milestones: {str(e)}")
        return handle_error('Failed to fetch milestones', 500)

@public_works_bp.route('/projects/<project_id>/milestones', methods=['POST'])
@jwt_required()
def create_milestone(project_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to create milestones', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'planned_date']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        milestone = ProjectMilestone(
            project_id=project_id,
            title=data['title'],
            description=data.get('description'),
            planned_date=datetime.strptime(data['planned_date'], '%Y-%m-%d').date(),
            created_by=get_jwt_identity()
        )
        
        db.session.add(milestone)
        db.session.commit()
        
        return jsonify(milestone.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating milestone: {str(e)}")
        return handle_error('Failed to create milestone', 500)

@public_works_bp.route('/milestones/<milestone_id>', methods=['PUT'])
@jwt_required()
def update_milestone(milestone_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to update milestones', 403)
    
    try:
        milestone = ProjectMilestone.query.filter_by(id=milestone_id).first()
        if not milestone:
            return handle_error('Milestone not found', 404)
        
        data = request.get_json()
        
        # Update milestone fields
        if 'actual_date' in data and data['actual_date']:
            milestone.actual_date = datetime.strptime(data['actual_date'], '%Y-%m-%d').date()
        
        if 'status' in data:
            milestone.status = data['status']
        
        if 'progress_percentage' in data:
            milestone.progress_percentage = data['progress_percentage']
        
        milestone.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(milestone.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating milestone: {str(e)}")
        return handle_error('Failed to update milestone', 500)

# Document Management Routes
@public_works_bp.route('/projects/<project_id>/documents', methods=['GET'])
@jwt_required()
def get_documents(project_id):
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view documents', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        documents = ProjectDocument.query.filter_by(project_id=project_id).all()
        
        return jsonify([doc.to_dict() for doc in documents]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching documents: {str(e)}")
        return handle_error('Failed to fetch documents', 500)

@public_works_bp.route('/projects/<project_id>/documents', methods=['POST'])
@jwt_required()
def upload_document(project_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to upload documents', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        # Check if file is in request
        if 'file' not in request.files:
            return handle_error('No file provided', 400)
        
        file = request.files['file']
        if file.filename == '':
            return handle_error('No file selected', 400)
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        document_type = request.form.get('document_type')
        
        if not title or not document_type:
            return handle_error('Title and document type are required', 400)
        
        # Save file
        filename = str(uuid.uuid4()) + '_' + file.filename
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'public_works', filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        file.save(file_path)
        
        # Create document record
        document = ProjectDocument(
            project_id=project_id,
            title=title,
            description=description,
            document_type=document_type,
            file_name=file.filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            file_type=file.content_type,
            created_by=get_jwt_identity()
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify(document.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading document: {str(e)}")
        return handle_error('Failed to upload document', 500)

# Inspection Routes
@public_works_bp.route('/projects/<project_id>/inspections', methods=['GET'])
@jwt_required()
def get_inspections(project_id):
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view inspections', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        inspections = ProjectInspection.query.filter_by(project_id=project_id).all()
        
        return jsonify([inspection.to_dict() for inspection in inspections]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching inspections: {str(e)}")
        return handle_error('Failed to fetch inspections', 500)

@public_works_bp.route('/projects/<project_id>/inspections', methods=['POST'])
@jwt_required()
def create_inspection(project_id):
    if not check_permission('public_works.update'):
        return handle_error('You do not have permission to create inspections', 403)
    
    try:
        project = Project.query.filter_by(id=project_id).first()
        if not project:
            return handle_error('Project not found', 404)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'inspection_date', 'inspector_name', 'inspector_designation', 'findings', 'compliance_status']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        inspection = ProjectInspection(
            project_id=project_id,
            title=data['title'],
            inspection_date=datetime.strptime(data['inspection_date'], '%Y-%m-%d').date(),
            inspector_name=data['inspector_name'],
            inspector_designation=data['inspector_designation'],
            findings=data['findings'],
            compliance_status=data['compliance_status'],
            actions_required=data.get('actions_required'),
            follow_up_date=datetime.strptime(data['follow_up_date'], '%Y-%m-%d').date() if data.get('follow_up_date') else None,
            created_by=get_jwt_identity()
        )
        
        db.session.add(inspection)
        db.session.commit()
        
        return jsonify(inspection.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating inspection: {str(e)}")
        return handle_error('Failed to create inspection', 500)

# Public Works Statistics
@public_works_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_public_works_stats():
    if not check_permission('public_works.read'):
        return handle_error('You do not have permission to view public works statistics', 403)
    
    try:
        # Project statistics
        total_projects = Project.query.count()
        projects_by_status = db.session.query(
            Project.status, db.func.count(Project.id)
        ).group_by(Project.status).all()
        
        projects_by_type = db.session.query(
            Project.project_type, db.func.count(Project.id)
        ).group_by(Project.project_type).all()
        
        # Tender statistics
        total_tenders = Tender.query.count()
        tenders_by_status = db.session.query(
            Tender.status, db.func.count(Tender.id)
        ).group_by(Tender.status).all()
        
        # Budget statistics
        total_estimated_cost = db.session.query(db.func.sum(Project.estimated_cost)).scalar() or 0
        total_actual_cost = db.session.query(db.func.sum(Project.actual_cost)).scalar() or 0
        
        return jsonify({
            'projects': {
                'total': total_projects,
                'by_status': dict(projects_by_status),
                'by_type': dict(projects_by_type)
            },
            'tenders': {
                'total': total_tenders,
                'by_status': dict(tenders_by_status)
            },
            'budget': {
                'total_estimated': float(total_estimated_cost),
                'total_actual': float(total_actual_cost),
                'utilization': float(total_actual_cost / total_estimated_cost * 100) if total_estimated_cost > 0 else 0
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching public works statistics: {str(e)}")
        return handle_error('Failed to fetch public works statistics', 500)