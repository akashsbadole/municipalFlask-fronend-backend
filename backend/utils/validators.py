def validate_required_fields(data, required_fields):
    """
    Validate that all required fields are present in the data
    
    Args:
        data (dict): The data to validate
        required_fields (list): List of required field names
        
    Returns:
        str: Error message if validation fails, None if validation passes
    """
    if not data:
        return "No data provided"
    
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            missing_fields.append(field)
    
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"
    
    return None