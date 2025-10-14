# Municipal Corporation Management System

A comprehensive web-based SaaS solution for digitizing and automating municipal corporation operations, improving service delivery, citizen engagement, tax collection, waste management, and infrastructure tracking.

## Features

### Core Modules

1. **Citizen Management**
   - Citizen registration with Aadhaar/Mobile/Email verification
   - Profile management with address details
   - Digital identity verification

2. **Property & Tax Management**
   - Property registration with GIS mapping integration
   - Automated tax calculation based on ward, area, building type
   - Online payment integration
   - Defaulter lists and automated notices

3. **Trade License & Business Permits**
   - Digital license application and renewal
   - Inspection scheduling and approval workflow
   - Online fee payment and digital certificates

4. **Building Plan Approval System (BPAS)**
   - Architect/Engineer registration
   - Digital plan upload with auto-compliance checks
   - Multi-level approval workflow
   - Online fee payment and e-sanction certificates

5. **Solid Waste Management (SWM)**
   - Ward-wise route planning with vehicle tracking
   - Garbage collection monitoring
   - Waste segregation analytics
   - Vendor and contractor management

6. **Water Supply & Drainage**
   - Water connection application and billing
   - Meter readings with IoT integration
   - Water usage analytics
   - Drainage maintenance logs

7. **Streetlight & Electrical Maintenance**
   - Streetlight mapping via GIS
   - Repair ticketing with performance metrics
   - Maintenance team assignment

8. **Health & Sanitation Department**
   - Public health monitoring
   - Food license and inspection
   - Waste disposal management

9. **Finance & Budgeting**
   - Department-wise budget planning
   - Vendor payments and contracts
   - Financial reports and dashboards
   - Audit trail

10. **Human Resource (HR) & Payroll**
    - Employee directory
    - Payroll system with salary slips
    - Leave and transfer management
    - Performance appraisal

11. **Public Works & Infrastructure**
    - Project tracking dashboard
    - Tender management
    - GIS integration for real-time mapping

12. **E-Governance & Transparency**
    - Public notice board
    - RTI (Right to Information) portal
    - Document management system
    - Citizen charter

13. **Disaster Management**
    - Emergency alerts via SMS/Email
    - Real-time data dashboard
    - Emergency team coordination

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Local storage (configurable to cloud)
- **API Documentation**: RESTful APIs

### Frontend
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Maps**: Leaflet
- **State Management**: React Context
- **HTTP Client**: Axios

## Project Structure

```
municipal/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── app/                   # Flask blueprints
│   │   ├── auth.py           # Authentication routes
│   │   ├── citizens.py       # Citizen management
│   │   ├── properties.py     # Property management
│   │   ├── complaints.py     # Complaint management
│   │   └── ...               # Other module blueprints
│   ├── models/                # Database models
│   │   ├── user.py           # User model
│   │   ├── role.py           # Role model
│   │   ├── citizen.py        # Citizen model
│   │   ├── property.py       # Property model
│   │   └── ...               # Other models
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables example
│   └── db_init.py           # Database initialization script
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   └── Layout/
│   │   ├── contexts/         # React contexts
│   │   ├── lib/             # Utility functions
│   │   ├── pages/           # Next.js pages
│   │   ├── styles/          # CSS files
│   │   └── types/           # TypeScript types
│   ├── package.json         # Node.js dependencies
│   ├── next.config.js       # Next.js configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── tsconfig.json        # TypeScript configuration
└── README.md                # This file
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Initialize the database:
   ```bash
   python db_init.py
   ```

6. Run the Flask application:
   ```bash
   python app.py
   ```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Default Roles and Permissions

The system comes with 5 default roles:

1. **Super Admin**: Full system access with all permissions
2. **Municipal Commissioner**: Head of municipal corporation with oversight on all departments
3. **Department Head**: Head of a specific department with department-specific permissions
4. **Field Officer**: Officer responsible for field operations and inspections
5. **Citizen**: Regular citizen with access to citizen services

## API Documentation

The API follows RESTful conventions and includes endpoints for all modules. Authentication is required for most endpoints using JWT tokens.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and queries, please contact the development team.