from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime, timedelta
from functools import wraps
from models.user import User
from models.public_notice import PublicNotice
from models.rti_request import RTIRequest
from models.document import Document, DocumentAccess
from app import db
from utils.auth import token_required, check_permission

egovernance_bp = Blueprint('egovernance', __name__, url_prefix='/egov')

# Helper function to check if user has access to document
def can_access_document(user_id, document_id, access_type='View'):
    document = Document.query.get(document_id)
    if not document:
        return False
    
    # Check if document is public
    if document.is_public and access_type == 'View':
        return True
    
    # Check if user uploaded the document
    if document.uploaded_by == user_id:
        return True
    
    # Check if user has explicit permission
    permission = DocumentAccess.query.filter_by(
        document_id=document_id,
        user_id=user_id,
        access_type=access_type
    ).first()
    
    if permission:
        # Check if permission has expired
        if permission.expires_at and permission.expires_at < datetime.utcnow():
            return False
        return True
    
    # Check if user has admin permissions
    user = User.query.get(user_id)
    if user and (user.role == 'Super Admin' or user.role == 'Municipal Commissioner'):
        return True
    
    return False

# Public Notices Routes
@egovernance_bp.route('/notices', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_notices(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        notice_type = request.args.get('notice_type')
        priority = request.args.get('priority')
        status = request.args.get('status', 'Active')
        
        query = PublicNotice.query
        
        if notice_type:
            query = query.filter(PublicNotice.notice_type == notice_type)
        if priority:
            query = query.filter(PublicNotice.priority == priority)
        if status:
            query = query.filter(PublicNotice.status == status)
        
        notices = query.order_by(PublicNotice.publication_date.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'notices': [notice.to_dict() for notice in notices.items],
            'pagination': {
                'page': notices.page,
                'per_page': notices.per_page,
                'total': notices.total,
                'pages': notices.pages,
                'has_next': notices.has_next,
                'has_prev': notices.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/notices', methods=['POST'])
@token_required
@check_permission('egov.create')
def create_notice(current_user):
    try:
        data = request.get_json()
        
        notice = PublicNotice(
            title=data['title'],
            content=data['content'],
            notice_type=data['notice_type'],
            priority=data.get('priority', 'Normal'),
            publication_date=datetime.strptime(data['publication_date'], '%Y-%m-%d').date() if data.get('publication_date') else datetime.utcnow().date(),
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data.get('expiry_date') else None,
            attachment_url=data.get('attachment_url'),
            created_by=current_user.id
        )
        
        db.session.add(notice)
        db.session.commit()
        
        return jsonify({'message': 'Notice created successfully', 'notice': notice.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/notices/<notice_id>', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_notice(current_user, notice_id):
    try:
        notice = PublicNotice.query.get(notice_id)
        if not notice:
            return jsonify({'error': 'Notice not found'}), 404
        
        return jsonify({'notice': notice.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/notices/<notice_id>', methods=['PUT'])
@token_required
@check_permission('egov.update')
def update_notice(current_user, notice_id):
    try:
        notice = PublicNotice.query.get(notice_id)
        if not notice:
            return jsonify({'error': 'Notice not found'}), 404
        
        data = request.get_json()
        
        notice.title = data.get('title', notice.title)
        notice.content = data.get('content', notice.content)
        notice.notice_type = data.get('notice_type', notice.notice_type)
        notice.priority = data.get('priority', notice.priority)
        notice.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if data.get('expiry_date') else notice.expiry_date
        notice.attachment_url = data.get('attachment_url', notice.attachment_url)
        notice.status = data.get('status', notice.status)
        
        db.session.commit()
        
        return jsonify({'message': 'Notice updated successfully', 'notice': notice.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/notices/<notice_id>', methods=['DELETE'])
@token_required
@check_permission('egov.delete')
def delete_notice(current_user, notice_id):
    try:
        notice = PublicNotice.query.get(notice_id)
        if not notice:
            return jsonify({'error': 'Notice not found'}), 404
        
        db.session.delete(notice)
        db.session.commit()
        
        return jsonify({'message': 'Notice deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# RTI Requests Routes
@egovernance_bp.route('/rti', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_rti_requests(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        status = request.args.get('status')
        department = request.args.get('department')
        priority = request.args.get('priority')
        
        query = RTIRequest.query
        
        if status:
            query = query.filter(RTIRequest.status == status)
        if department:
            query = query.filter(RTIRequest.department == department)
        if priority:
            query = query.filter(RTIRequest.priority == priority)
        
        rti_requests = query.order_by(RTIRequest.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'rti_requests': [rti.to_dict() for rti in rti_requests.items],
            'pagination': {
                'page': rti_requests.page,
                'per_page': rti_requests.per_page,
                'total': rti_requests.total,
                'pages': rti_requests.pages,
                'has_next': rti_requests.has_next,
                'has_prev': rti_requests.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/rti', methods=['POST'])
@token_required
@check_permission('egov.create')
def create_rti_request(current_user):
    try:
        data = request.get_json()
        
        # Generate unique request number
        current_year = datetime.now().year
        count = RTIRequest.query.filter(RTIRequest.request_number.like(f'RTI/{current_year}/%')).count()
        request_number = f'RTI/{current_year}/{count + 1:04d}'
        
        rti_request = RTIRequest(
            request_number=request_number,
            applicant_name=data['applicant_name'],
            applicant_address=data['applicant_address'],
            applicant_email=data.get('applicant_email'),
            applicant_phone=data.get('applicant_phone'),
            subject=data['subject'],
            description=data['description'],
            department=data['department'],
            priority=data.get('priority', 'Normal'),
            fee_amount=data.get('fee_amount', 0.0)
        )
        
        db.session.add(rti_request)
        db.session.commit()
        
        return jsonify({'message': 'RTI request created successfully', 'rti_request': rti_request.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/rti/<rti_id>', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_rti_request(current_user, rti_id):
    try:
        rti_request = RTIRequest.query.get(rti_id)
        if not rti_request:
            return jsonify({'error': 'RTI request not found'}), 404
        
        return jsonify({'rti_request': rti_request.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/rti/<rti_id>/assign', methods=['POST'])
@token_required
@check_permission('egov.update')
def assign_rti_request(current_user, rti_id):
    try:
        rti_request = RTIRequest.query.get(rti_id)
        if not rti_request:
            return jsonify({'error': 'RTI request not found'}), 404
        
        data = request.get_json()
        
        rti_request.assigned_to = data['assigned_to']
        rti_request.status = 'Under Review'
        
        db.session.commit()
        
        return jsonify({'message': 'RTI request assigned successfully', 'rti_request': rti_request.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/rti/<rti_id>/respond', methods=['POST'])
@token_required
@check_permission('egov.update')
def respond_rti_request(current_user, rti_id):
    try:
        rti_request = RTIRequest.query.get(rti_id)
        if not rti_request:
            return jsonify({'error': 'RTI request not found'}), 404
        
        data = request.get_json()
        
        rti_request.response_content = data.get('response_content')
        rti_request.response_date = datetime.now().date()
        rti_request.attachment_url = data.get('attachment_url')
        rti_request.status = 'Approved'
        
        db.session.commit()
        
        return jsonify({'message': 'RTI request responded successfully', 'rti_request': rti_request.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/rti/<rti_id>/reject', methods=['POST'])
@token_required
@check_permission('egov.update')
def reject_rti_request(current_user, rti_id):
    try:
        rti_request = RTIRequest.query.get(rti_id)
        if not rti_request:
            return jsonify({'error': 'RTI request not found'}), 404
        
        data = request.get_json()
        
        rti_request.rejection_reason = data['rejection_reason']
        rti_request.status = 'Rejected'
        
        db.session.commit()
        
        return jsonify({'message': 'RTI request rejected successfully', 'rti_request': rti_request.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Document Management Routes
@egovernance_bp.route('/documents', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_documents(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category = request.args.get('category')
        department = request.args.get('department')
        is_public = request.args.get('is_public')
        status = request.args.get('status', 'Active')
        
        query = Document.query
        
        # Filter based on user access
        accessible_docs = []
        
        # Get public documents
        public_docs = query.filter(Document.is_public == True).all()
        accessible_docs.extend(public_docs)
        
        # Get documents uploaded by the user
        user_docs = query.filter(Document.uploaded_by == current_user.id).all()
        accessible_docs.extend(user_docs)
        
        # Get documents with explicit permission
        permissions = DocumentAccess.query.filter_by(user_id=current_user.id).all()
        for perm in permissions:
            doc = Document.query.get(perm.document_id)
            if doc and doc not in accessible_docs:
                # Check if permission hasn't expired
                if not perm.expires_at or perm.expires_at > datetime.utcnow():
                    accessible_docs.append(doc)
        
        # Apply additional filters
        if category:
            accessible_docs = [doc for doc in accessible_docs if doc.category == category]
        if department:
            accessible_docs = [doc for doc in accessible_docs if doc.department == department]
        if is_public is not None:
            accessible_docs = [doc for doc in accessible_docs if doc.is_public == (is_public == 'true')]
        if status:
            accessible_docs = [doc for doc in accessible_docs if doc.status == status]
        
        # Sort by creation date
        accessible_docs.sort(key=lambda x: x.created_at, reverse=True)
        
        # Paginate
        start = (page - 1) * per_page
        end = start + per_page
        paginated_docs = accessible_docs[start:end]
        
        return jsonify({
            'documents': [doc.to_dict() for doc in paginated_docs],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': len(accessible_docs),
                'pages': (len(accessible_docs) + per_page - 1) // per_page,
                'has_next': end < len(accessible_docs),
                'has_prev': page > 1
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/documents', methods=['POST'])
@token_required
@check_permission('egov.create')
def upload_document(current_user):
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category')
        department = request.form.get('department')
        tags = request.form.get('tags')
        is_public = request.form.get('is_public', 'false').lower() == 'true'
        effective_date = request.form.get('effective_date')
        expiry_date = request.form.get('expiry_date')
        
        if not all([title, category, department]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], 'documents')
        os.makedirs(upload_path, exist_ok=True)
        file_path = os.path.join(upload_path, unique_filename)
        file.save(file_path)
        
        # Create document record
        document = Document(
            title=title,
            description=description,
            category=category,
            document_type=file.filename.rsplit('.', 1)[1].upper(),
            file_name=filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            department=department,
            tags=tags,
            is_public=is_public,
            effective_date=datetime.strptime(effective_date, '%Y-%m-%d').date() if effective_date else None,
            expiry_date=datetime.strptime(expiry_date, '%Y-%m-%d').date() if expiry_date else None,
            uploaded_by=current_user.id
        )
        
        db.session.add(document)
        db.session.commit()
        
        return jsonify({'message': 'Document uploaded successfully', 'document': document.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/documents/<document_id>', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_document(current_user, document_id):
    try:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        if not can_access_document(current_user.id, document_id):
            return jsonify({'error': 'Access denied'}), 403
        
        return jsonify({'document': document.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/documents/<document_id>/download', methods=['GET'])
@token_required
@check_permission('egov.read')
def download_document(current_user, document_id):
    try:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        if not can_access_document(current_user.id, document_id, 'Download'):
            return jsonify({'error': 'Access denied'}), 403
        
        # Increment download count
        document.increment_download_count()
        
        return send_file(document.file_path, as_attachment=True, download_name=document.file_name)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/documents/<document_id>/access', methods=['POST'])
@token_required
@check_permission('egov.update')
def grant_document_access(current_user, document_id):
    try:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Check if user can grant access (document owner or admin)
        if document.uploaded_by != current_user.id and current_user.role not in ['Super Admin', 'Municipal Commissioner']:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        access = DocumentAccess(
            document_id=document_id,
            user_id=data['user_id'],
            access_type=data.get('access_type', 'View'),
            granted_by=current_user.id,
            expires_at=datetime.strptime(data['expires_at'], '%Y-%m-%d %H:%M:%S') if data.get('expires_at') else None
        )
        
        db.session.add(access)
        db.session.commit()
        
        return jsonify({'message': 'Access granted successfully', 'access': access.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@egovernance_bp.route('/documents/<document_id>/access/<access_id>', methods=['DELETE'])
@token_required
@check_permission('egov.update')
def revoke_document_access(current_user, document_id, access_id):
    try:
        document = Document.query.get(document_id)
        if not document:
            return jsonify({'error': 'Document not found'}), 404
        
        # Check if user can revoke access (document owner or admin)
        if document.uploaded_by != current_user.id and current_user.role not in ['Super Admin', 'Municipal Commissioner']:
            return jsonify({'error': 'Access denied'}), 403
        
        access = DocumentAccess.query.get(access_id)
        if not access or access.document_id != document_id:
            return jsonify({'error': 'Access record not found'}), 404
        
        db.session.delete(access)
        db.session.commit()
        
        return jsonify({'message': 'Access revoked successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Statistics
@egovernance_bp.route('/stats', methods=['GET'])
@token_required
@check_permission('egov.read')
def get_egov_stats(current_user):
    try:
        notices_count = PublicNotice.query.filter_by(status='Active').count()
        rti_pending_count = RTIRequest.query.filter_by(status='Pending').count()
        rti_under_review_count = RTIRequest.query.filter_by(status='Under Review').count()
        documents_count = Document.query.filter_by(status='Active').count()
        
        return jsonify({
            'notices_count': notices_count,
            'rti_pending_count': rti_pending_count,
            'rti_under_review_count': rti_under_review_count,
            'documents_count': documents_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500