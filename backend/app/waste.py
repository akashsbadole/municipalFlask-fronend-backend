from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import uuid
from extensions import db
from models.waste_collection import WasteCollection
from models.waste_route import WasteRoute
from models.user import User
from models.employee import Employee

waste_bp = Blueprint('waste', __name__)

@waste_bp.route('/routes', methods=['GET'])
@jwt_required()
def get_waste_routes():
    """Get all waste collection routes"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    ward = request.args.get('ward', '')
    zone = request.args.get('zone', '')
    status = request.args.get('status', '')
    
    # Build query
    query = WasteRoute.query
    
    # Apply filters
    if ward:
        query = query.filter(WasteRoute.ward_number == ward)
    
    if zone:
        query = query.filter(WasteRoute.zone == zone)
    
    if status:
        query = query.filter(WasteRoute.status == status)
    
    routes = query.all()
    
    return jsonify({
        'routes': [route.to_dict() for route in routes]
    }), 200

@waste_bp.route('/routes', methods=['POST'])
@jwt_required()
def create_waste_route():
    """Create a new waste collection route"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['route_name', 'ward_number', 'zone', 'vehicle_number', 'driver_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if driver exists
    driver = Employee.query.get(data['driver_id'])
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    
    try:
        # Create new route
        new_route = WasteRoute(
            route_name=data['route_name'],
            ward_number=data['ward_number'],
            zone=data['zone'],
            vehicle_number=data['vehicle_number'],
            driver_id=data['driver_id'],
            description=data.get('description'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            collection_days=data.get('collection_days', []),
            areas_covered=data.get('areas_covered', []),
            estimated_duration_hours=data.get('estimated_duration_hours'),
            vehicle_capacity=data.get('vehicle_capacity')
        )
        
        db.session.add(new_route)
        db.session.commit()
        
        return jsonify({
            'message': 'Waste route created successfully',
            'route': new_route.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@waste_bp.route('/routes/<uuid:route_id>', methods=['GET'])
@jwt_required()
def get_waste_route(route_id):
    """Get a specific waste route by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    route = WasteRoute.query.get(route_id)
    
    if not route:
        return jsonify({'error': 'Waste route not found'}), 404
    
    return jsonify({
        'route': route.to_dict()
    }), 200

@waste_bp.route('/routes/<uuid:route_id>', methods=['PUT'])
@jwt_required()
def update_waste_route(route_id):
    """Update a waste route"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    route = WasteRoute.query.get(route_id)
    
    if not route:
        return jsonify({'error': 'Waste route not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'route_name', 'ward_number', 'zone', 'vehicle_number', 'driver_id',
            'description', 'start_time', 'end_time', 'collection_days',
            'areas_covered', 'estimated_duration_hours', 'vehicle_capacity', 'status'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(route, field, data[field])
        
        route.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Waste route updated successfully',
            'route': route.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@waste_bp.route('/collections', methods=['GET'])
@jwt_required()
def get_waste_collections():
    """Get all waste collection records"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    route_id = request.args.get('route_id', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    status = request.args.get('status', '')
    
    # Build query
    query = WasteCollection.query
    
    # Apply filters
    if route_id:
        try:
            route_uuid = uuid.UUID(route_id)
            query = query.filter(WasteCollection.route_id == route_uuid)
        except ValueError:
            return jsonify({'error': 'Invalid route_id format'}), 400
    
    if date_from:
        try:
            date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
            query = query.filter(WasteCollection.collection_date >= date_from_obj)
        except ValueError:
            return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
    
    if date_to:
        try:
            date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
            query = query.filter(WasteCollection.collection_date <= date_to_obj)
        except ValueError:
            return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
    
    if status:
        query = query.filter(WasteCollection.status == status)
    
    # Order by collection date (newest first)
    query = query.order_by(WasteCollection.collection_date.desc())
    
    # Paginate
    collections = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'collections': [collection.to_dict() for collection in collections.items],
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': collections.total,
            'pages': collections.pages
        }
    }), 200

@waste_bp.route('/collections', methods=['POST'])
@jwt_required()
def create_waste_collection():
    """Create a new waste collection record"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.create'):
        return jsonify({'error': 'Permission denied'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['route_id', 'collection_date', 'biodegradable_weight',
                      'non_biodegradable_weight', 'hazardous_weight']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Check if route exists
    route = WasteRoute.query.get(data['route_id'])
    if not route:
        return jsonify({'error': 'Route not found'}), 404
    
    try:
        # Parse collection date
        collection_date = datetime.strptime(data['collection_date'], '%Y-%m-%d').date()
        
        # Create new collection record
        new_collection = WasteCollection(
            route_id=data['route_id'],
            collection_date=collection_date,
            biodegradable_weight=data['biodegradable_weight'],
            non_biodegradable_weight=data['non_biodegradable_weight'],
            hazardous_weight=data['hazardous_weight'],
            recyclable_weight=data.get('recyclable_weight', 0),
            total_weight=data.get('total_weight'),
            start_time=data.get('start_time'),
            end_time=data.get('end_time'),
            areas_covered=data.get('areas_covered', []),
            households_covered=data.get('households_covered'),
            vehicle_mileage=data.get('vehicle_mileage'),
            fuel_consumed=data.get('fuel_consumed'),
            remarks=data.get('remarks'),
            collected_by=current_user_id
        )
        
        # Calculate total weight if not provided
        if not new_collection.total_weight:
            new_collection.total_weight = (
                new_collection.biodegradable_weight +
                new_collection.non_biodegradable_weight +
                new_collection.hazardous_weight +
                new_collection.recyclable_weight
            )
        
        db.session.add(new_collection)
        db.session.commit()
        
        return jsonify({
            'message': 'Waste collection record created successfully',
            'collection': new_collection.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@waste_bp.route('/collections/<uuid:collection_id>', methods=['GET'])
@jwt_required()
def get_waste_collection(collection_id):
    """Get a specific waste collection record by ID"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    collection = WasteCollection.query.get(collection_id)
    
    if not collection:
        return jsonify({'error': 'Waste collection record not found'}), 404
    
    return jsonify({
        'collection': collection.to_dict()
    }), 200

@waste_bp.route('/collections/<uuid:collection_id>', methods=['PUT'])
@jwt_required()
def update_waste_collection(collection_id):
    """Update a waste collection record"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.update'):
        return jsonify({'error': 'Permission denied'}), 403
    
    collection = WasteCollection.query.get(collection_id)
    
    if not collection:
        return jsonify({'error': 'Waste collection record not found'}), 404
    
    data = request.get_json()
    
    try:
        # Update allowed fields
        allowed_fields = [
            'biodegradable_weight', 'non_biodegradable_weight', 'hazardous_weight',
            'recyclable_weight', 'total_weight', 'start_time', 'end_time',
            'areas_covered', 'households_covered', 'vehicle_mileage',
            'fuel_consumed', 'remarks', 'status'
        ]
        
        for field in allowed_fields:
            if field in data:
                setattr(collection, field, data[field])
        
        # Recalculate total weight if individual weights were updated
        if any(field in data for field in ['biodegradable_weight', 'non_biodegradable_weight',
                                         'hazardous_weight', 'recyclable_weight']):
            collection.total_weight = (
                collection.biodegradable_weight +
                collection.non_biodegradable_weight +
                collection.hazardous_weight +
                collection.recyclable_weight
            )
        
        collection.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Waste collection record updated successfully',
            'collection': collection.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@waste_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_waste_dashboard_stats():
    """Get waste management dashboard statistics"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user or not user.has_permission('waste.read'):
        return jsonify({'error': 'Permission denied'}), 403
    
    # Get date range for statistics (last 30 days by default)
    days = request.args.get('days', 30, type=int)
    date_from = datetime.now() - timedelta(days=days)
    
    # Get total collections in the period
    total_collections = WasteCollection.query.filter(
        WasteCollection.collection_date >= date_from.date()
    ).count()
    
    # Get total waste collected by type
    waste_by_type = db.session.query(
        db.func.sum(WasteCollection.biodegradable_weight).label('biodegradable'),
        db.func.sum(WasteCollection.non_biodegradable_weight).label('non_biodegradable'),
        db.func.sum(WasteCollection.hazardous_weight).label('hazardous'),
        db.func.sum(WasteCollection.recyclable_weight).label('recyclable'),
        db.func.sum(WasteCollection.total_weight).label('total')
    ).filter(
        WasteCollection.collection_date >= date_from.date()
    ).first()
    
    # Get collections by ward
    ward_stats = db.session.query(
        WasteRoute.ward_number,
        db.func.count(WasteCollection.id).label('collections'),
        db.func.sum(WasteCollection.total_weight).label('total_weight')
    ).join(WasteCollection).filter(
        WasteCollection.collection_date >= date_from.date()
    ).group_by(WasteRoute.ward_number).all()
    
    # Get route performance
    route_performance = db.session.query(
        WasteRoute.route_name,
        WasteRoute.ward_number,
        db.func.count(WasteCollection.id).label('collections'),
        db.func.avg(WasteCollection.total_weight).label('avg_weight')
    ).join(WasteCollection).filter(
        WasteCollection.collection_date >= date_from.date()
    ).group_by(WasteRoute.id, WasteRoute.route_name, WasteRoute.ward_number).all()
    
    # Get daily collection trend
    daily_trend = db.session.query(
        WasteCollection.collection_date,
        db.func.sum(WasteCollection.total_weight).label('total_weight'),
        db.func.count(WasteCollection.id).label('collections')
    ).filter(
        WasteCollection.collection_date >= date_from.date()
    ).group_by(WasteCollection.collection_date).order_by(WasteCollection.collection_date).all()
    
    return jsonify({
        'period': {
            'days': days,
            'from': date_from.date().isoformat(),
            'to': datetime.now().date().isoformat()
        },
        'overall': {
            'total_collections': total_collections,
            'biodegradable': float(waste_by_type.biodegradable or 0),
            'non_biodegradable': float(waste_by_type.non_biodegradable or 0),
            'hazardous': float(waste_by_type.hazardous or 0),
            'recyclable': float(waste_by_type.recyclable or 0),
            'total': float(waste_by_type.total or 0)
        },
        'by_ward': [
            {
                'ward': ward,
                'collections': collections,
                'total_weight': float(total_weight or 0)
            } for ward, collections, total_weight in ward_stats
        ],
        'route_performance': [
            {
                'route_name': route_name,
                'ward_number': ward_number,
                'collections': collections,
                'avg_weight': float(avg_weight or 0)
            } for route_name, ward_number, collections, avg_weight in route_performance
        ],
        'daily_trend': [
            {
                'date': date.isoformat(),
                'total_weight': float(total_weight or 0),
                'collections': collections
            } for date, total_weight, collections in daily_trend
        ]
    }), 200