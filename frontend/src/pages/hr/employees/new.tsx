import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { hrAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface EmployeeFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  marital_status: string;
  
  // Contact Information
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  
  // Employment Details
  department: string;
  designation: string;
  employment_type: string;
  employment_status: string;
  date_of_joining: string;
  grade: string;
  basic_salary: number;
  reporting_to: string;
  
  // Bank Details
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  
  // Government IDs
  pan_number: string;
  aadhaar_number: string;
  
  // User Account
  user_id: string;
}

const NewEmployeePage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    // Personal Information
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    marital_status: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    
    // Employment Details
    department: '',
    designation: '',
    employment_type: '',
    employment_status: 'Active',
    date_of_joining: '',
    grade: '',
    basic_salary: 0,
    reporting_to: '',
    
    // Bank Details
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    
    // Government IDs
    pan_number: '',
    aadhaar_number: '',
    
    // User Account
    user_id: '',
  });

  const departments = [
    'Administration',
    'Public Works',
    'Health & Sanitation',
    'Water Supply',
    'Street Lighting',
    'Waste Management',
    'Finance',
    'HR',
    'Education',
    'Planning',
  ];

  const employmentTypes = [
    'Permanent',
    'Contract',
    'Temporary',
  ];

  const employmentStatuses = [
    'Active',
    'Inactive',
  ];

  const grades = [
    'A1',
    'A2',
    'A3',
    'B1',
    'B2',
    'B3',
    'C1',
    'C2',
    'C3',
  ];

  const genders = [
    'Male',
    'Female',
    'Other',
  ];

  const bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  const maritalStatuses = [
    'Single',
    'Married',
    'Divorced',
    'Widowed',
  ];

  useEffect(() => {
    if (!hasPermission('hr.create')) {
      router.push('/hr');
    }
    fetchUsers();
    fetchEmployees();
  }, [hasPermission, router]);

  const fetchUsers = async () => {
    try {
      // This would be a call to get users without employee records
      // For now, we'll use a placeholder
      setUsers([]);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await hrAPI.getEmployees({ limit: 100 });
      setEmployees(response.data.employees);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'basic_salary') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Personal Information
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.marital_status) {
      newErrors.marital_status = 'Marital status is required';
    }
    
    // Contact Information
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }
    
    // Employment Details
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    }
    
    if (!formData.employment_type) {
      newErrors.employment_type = 'Employment type is required';
    }
    
    if (!formData.date_of_joining) {
      newErrors.date_of_joining = 'Date of joining is required';
    }
    
    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }
    
    if (!formData.basic_salary || formData.basic_salary <= 0) {
      newErrors.basic_salary = 'Basic salary must be greater than 0';
    }
    
    // Bank Details
    if (!formData.bank_name.trim()) {
      newErrors.bank_name = 'Bank name is required';
    }
    
    if (!formData.bank_account_number.trim()) {
      newErrors.bank_account_number = 'Bank account number is required';
    }
    
    if (!formData.bank_ifsc.trim()) {
      newErrors.bank_ifsc = 'Bank IFSC is required';
    }
    
    // Government IDs
    if (!formData.pan_number.trim()) {
      newErrors.pan_number = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number.toUpperCase())) {
      newErrors.pan_number = 'PAN number is invalid';
    }
    
    if (!formData.aadhaar_number.trim()) {
      newErrors.aadhaar_number = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhaar_number.replace(/\s/g, ''))) {
      newErrors.aadhaar_number = 'Aadhaar number must be 12 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await hrAPI.createEmployee(formData);
      toast.success('Employee created successfully');
      router.push(`/hr/employees/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create employee';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission('hr.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to create employees.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/hr" className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Employee</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new employee record
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.first_name ? 'border-red-500' : ''}`}
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.last_name ? 'border-red-500' : ''}`}
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.date_of_birth ? 'border-red-500' : ''}`}
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.gender ? 'border-red-500' : ''}`}
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              <div>
                <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700">
                  Blood Group
                </label>
                <select
                  id="blood_group"
                  name="blood_group"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.blood_group}
                  onChange={handleInputChange}
                >
                  <option value="">Select Blood Group</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                  Marital Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="marital_status"
                  name="marital_status"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.marital_status ? 'border-red-500' : ''}`}
                  value={formData.marital_status}
                  onChange={handleInputChange}
                >
                  <option value="">Select Status</option>
                  {maritalStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.marital_status && (
                  <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.email ? 'border-red-500' : ''}`}
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.phone ? 'border-red-500' : ''}`}
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.address ? 'border-red-500' : ''}`}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main Street, Area"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.city ? 'border-red-500' : ''}`}
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Mumbai"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.state ? 'border-red-500' : ''}`}
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="Maharashtra"
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-600">{errors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.postal_code ? 'border-red-500' : ''}`}
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="400001"
                />
                {errors.postal_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  id="department"
                  name="department"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.department ? 'border-red-500' : ''}`}
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                )}
              </div>

              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.designation ? 'border-red-500' : ''}`}
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Software Engineer"
                />
                {errors.designation && (
                  <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
                )}
              </div>

              <div>
                <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">
                  Employment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="employment_type"
                  name="employment_type"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.employment_type ? 'border-red-500' : ''}`}
                  value={formData.employment_type}
                  onChange={handleInputChange}
                >
                  <option value="">Select Type</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.employment_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.employment_type}</p>
                )}
              </div>

              <div>
                <label htmlFor="employment_status" className="block text-sm font-medium text-gray-700">
                  Employment Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="employment_status"
                  name="employment_status"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.employment_status ? 'border-red-500' : ''}`}
                  value={formData.employment_status}
                  onChange={handleInputChange}
                >
                  {employmentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.employment_status && (
                  <p className="mt-1 text-sm text-red-600">{errors.employment_status}</p>
                )}
              </div>

              <div>
                <label htmlFor="date_of_joining" className="block text-sm font-medium text-gray-700">
                  Date of Joining <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date_of_joining"
                  name="date_of_joining"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.date_of_joining ? 'border-red-500' : ''}`}
                  value={formData.date_of_joining}
                  onChange={handleInputChange}
                />
                {errors.date_of_joining && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_of_joining}</p>
                )}
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  id="grade"
                  name="grade"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.grade ? 'border-red-500' : ''}`}
                  value={formData.grade}
                  onChange={handleInputChange}
                >
                  <option value="">Select Grade</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
                )}
              </div>

              <div>
                <label htmlFor="basic_salary" className="block text-sm font-medium text-gray-700">
                  Basic Salary (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="basic_salary"
                  name="basic_salary"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.basic_salary ? 'border-red-500' : ''}`}
                  value={formData.basic_salary}
                  onChange={handleInputChange}
                  placeholder="25000.00"
                />
                {errors.basic_salary && (
                  <p className="mt-1 text-sm text-red-600">{errors.basic_salary}</p>
                )}
              </div>

              <div>
                <label htmlFor="reporting_to" className="block text-sm font-medium text-gray-700">
                  Reporting To
                </label>
                <select
                  id="reporting_to"
                  name="reporting_to"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.reporting_to}
                  onChange={handleInputChange}
                >
                  <option value="">Select Manager</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bank_name"
                  name="bank_name"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.bank_name ? 'border-red-500' : ''}`}
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder="State Bank of India"
                />
                {errors.bank_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.bank_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bank_account_number"
                  name="bank_account_number"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.bank_account_number ? 'border-red-500' : ''}`}
                  value={formData.bank_account_number}
                  onChange={handleInputChange}
                  placeholder="123456789012"
                />
                {errors.bank_account_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.bank_account_number}</p>
                )}
              </div>

              <div>
                <label htmlFor="bank_ifsc" className="block text-sm font-medium text-gray-700">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bank_ifsc"
                  name="bank_ifsc"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.bank_ifsc ? 'border-red-500' : ''}`}
                  value={formData.bank_ifsc}
                  onChange={handleInputChange}
                  placeholder="SBIN0001234"
                />
                {errors.bank_ifsc && (
                  <p className="mt-1 text-sm text-red-600">{errors.bank_ifsc}</p>
                )}
              </div>
            </div>
          </div>

          {/* Government IDs */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Government IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="pan_number"
                  name="pan_number"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.pan_number ? 'border-red-500' : ''}`}
                  value={formData.pan_number.toUpperCase()}
                  onChange={handleInputChange}
                  placeholder="ABCDE1234F"
                />
                {errors.pan_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.pan_number}</p>
                )}
              </div>

              <div>
                <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700">
                  Aadhaar Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="aadhaar_number"
                  name="aadhaar_number"
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.aadhaar_number ? 'border-red-500' : ''}`}
                  value={formData.aadhaar_number}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012"
                />
                {errors.aadhaar_number && (
                  <p className="mt-1 text-sm text-red-600">{errors.aadhaar_number}</p>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/hr">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEmployeePage;