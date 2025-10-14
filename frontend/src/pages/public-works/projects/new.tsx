import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { publicWorksAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  BuildingOfficeIcon,
  ArrowLeftIcon,
  SaveIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface NewProject {
  title: string;
  description: string;
  project_type: string;
  category: string;
  ward: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  estimated_cost: number;
  start_date: string;
  planned_end_date: string;
  contractor_name: string;
  contractor_contact: string;
  department: string;
  assigned_to: string;
}

const NewProjectPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<NewProject>({
    title: '',
    description: '',
    project_type: '',
    category: '',
    ward: '',
    zone: '',
    address: '',
    latitude: 0,
    longitude: 0,
    estimated_cost: 0,
    start_date: '',
    planned_end_date: '',
    contractor_name: '',
    contractor_contact: '',
    department: '',
    assigned_to: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const projectTypes = [
    'Road',
    'Bridge',
    'Building',
    'Park',
    'Drainage',
    'Water Supply',
    'Street Lighting',
    'Other',
  ];

  const projectCategories = [
    'Infrastructure',
    'Public Utilities',
    'Recreation',
    'Transportation',
    'Urban Development',
    'Other',
  ];

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const zones = [
    'North Zone',
    'South Zone',
    'East Zone',
    'West Zone',
    'Central Zone',
  ];

  useEffect(() => {
    if (hasPermission('public_works.create')) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [hasPermission]);

  const fetchEmployees = async () => {
    try {
      // This would typically come from the HR API
      // For now, we'll use a mock list
      setEmployees([
        { id: '1', name: 'John Doe', department: 'Public Works' },
        { id: '2', name: 'Jane Smith', department: 'Public Works' },
        { id: '3', name: 'Robert Johnson', department: 'Public Works' },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch employees';
      toast.error(message);
    }
  };

  const fetchDepartments = async () => {
    try {
      // This would typically come from the departments API
      // For now, we'll use a mock list
      setDepartments([
        'Public Works',
        'Water Supply',
        'Urban Development',
        'Transportation',
      ]);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch departments';
      toast.error(message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.project_type || !formData.ward || !formData.zone || 
        !formData.address || !formData.start_date || !formData.planned_end_date || 
        !formData.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.planned_end_date) <= new Date(formData.start_date)) {
      toast.error('Planned end date must be after start date');
      return;
    }

    try {
      setLoading(true);
      await publicWorksAPI.createProject(formData);
      toast.success('Project created successfully');
      router.push('/public-works');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create project';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('public_works.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to create new projects.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/public-works">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Project</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add a new infrastructure project to the system
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Project Type */}
              <div>
                <label htmlFor="project_type" className="block text-sm font-medium text-gray-700">
                  Project Type *
                </label>
                <select
                  id="project_type"
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Project Type</option>
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Category</option>
                  {projectCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                  Ward *
                </label>
                <select
                  id="ward"
                  name="ward"
                  value={formData.ward}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Ward</option>
                  {wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>

              {/* Zone */}
              <div>
                <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
                  Zone *
                </label>
                <select
                  id="zone"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Zone</option>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Latitude and Longitude */}
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleNumberChange}
                  step="any"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleNumberChange}
                  step="any"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Estimated Cost */}
              <div>
                <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700">
                  Estimated Cost (₹)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="estimated_cost"
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleNumberChange}
                    min="0"
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Planned End Date */}
              <div>
                <label htmlFor="planned_end_date" className="block text-sm font-medium text-gray-700">
                  Planned End Date *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="planned_end_date"
                    name="planned_end_date"
                    value={formData.planned_end_date}
                    onChange={handleInputChange}
                    required
                    min={formData.start_date}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Contractor Name */}
              <div>
                <label htmlFor="contractor_name" className="block text-sm font-medium text-gray-700">
                  Contractor Name
                </label>
                <input
                  type="text"
                  id="contractor_name"
                  name="contractor_name"
                  value={formData.contractor_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Contractor Contact */}
              <div>
                <label htmlFor="contractor_contact" className="block text-sm font-medium text-gray-700">
                  Contractor Contact
                </label>
                <input
                  type="text"
                  id="contractor_contact"
                  name="contractor_contact"
                  value={formData.contractor_contact}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Assigned To */}
              <div>
                <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
                  Assigned To
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="assigned_to"
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} ({employee.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Link href="/public-works">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Create Project
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectPage;