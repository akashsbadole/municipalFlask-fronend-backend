import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { streetlightsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface MaintenanceFormData {
  maintenance_type: string;
  description: string;
  performed_by: string;
  performed_at: string;
  cost: number;
  parts_used: string;
  next_maintenance_date: string;
}

const NewMaintenanceRecordPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [streetlight, setStreetlight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<MaintenanceFormData>({
    maintenance_type: 'routine',
    description: '',
    performed_by: '',
    performed_at: new Date().toISOString().split('T')[0],
    cost: 0,
    parts_used: '',
    next_maintenance_date: '',
  });

  const maintenanceTypes = [
    { value: 'routine', label: 'Routine Maintenance' },
    { value: 'repair', label: 'Repair' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'cleaning', label: 'Cleaning' },
  ];

  useEffect(() => {
    if (id) {
      fetchStreetlight();
    }
  }, [id]);

  useEffect(() => {
    if (!hasPermission('streetlight.maintenance.create')) {
      router.push(`/streetlights/${id}`);
    }
  }, [hasPermission, router, id]);

  const fetchStreetlight = async () => {
    setIsLoading(true);
    try {
      const response = await streetlightsAPI.getById(id as string);
      setStreetlight(response.data);
      
      // Calculate default next maintenance date based on streetlight's interval
      if (response.data.maintenance_interval) {
        const performedAt = new Date();
        const nextMaintenance = new Date(performedAt);
        nextMaintenance.setDate(nextMaintenance.getDate() + response.data.maintenance_interval);
        
        setFormData(prev => ({
          ...prev,
          next_maintenance_date: nextMaintenance.toISOString().split('T')[0]
        }));
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch streetlight';
      toast.error(message);
      router.push('/streetlights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'cost') {
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
    
    if (!formData.maintenance_type) {
      newErrors.maintenance_type = 'Maintenance type is required';
    }
    
    if (!formData.performed_by.trim()) {
      newErrors.performed_by = 'Performed by is required';
    }
    
    if (!formData.performed_at) {
      newErrors.performed_at = 'Performed date is required';
    }
    
    if (formData.cost < 0) {
      newErrors.cost = 'Cost cannot be negative';
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
      const response = await streetlightsAPI.addMaintenanceRecord(id as string, formData);
      toast.success('Maintenance record added successfully');
      router.push(`/streetlights/${id}?tab=maintenance`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add maintenance record';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!hasPermission('streetlight.maintenance.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to add maintenance records.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href={`/streetlights/${id}?tab=maintenance`} className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add Maintenance Record</h1>
            <p className="mt-1 text-sm text-gray-500">
              {streetlight?.pole_number} • {streetlight?.location}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Maintenance Type */}
            <div>
              <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                id="maintenance_type"
                name="maintenance_type"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.maintenance_type ? 'border-red-500' : ''}`}
                value={formData.maintenance_type}
                onChange={handleInputChange}
              >
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.maintenance_type && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenance_type}</p>
              )}
            </div>

            {/* Performed By */}
            <div>
              <label htmlFor="performed_by" className="block text-sm font-medium text-gray-700">
                Performed By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="performed_by"
                name="performed_by"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.performed_by ? 'border-red-500' : ''}`}
                value={formData.performed_by}
                onChange={handleInputChange}
                placeholder="e.g., John Doe (Electrical Dept.)"
              />
              {errors.performed_by && (
                <p className="mt-1 text-sm text-red-600">{errors.performed_by}</p>
              )}
            </div>

            {/* Performed At */}
            <div>
              <label htmlFor="performed_at" className="block text-sm font-medium text-gray-700">
                Performed Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="performed_at"
                name="performed_at"
                max={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.performed_at ? 'border-red-500' : ''}`}
                value={formData.performed_at}
                onChange={handleInputChange}
              />
              {errors.performed_at && (
                <p className="mt-1 text-sm text-red-600">{errors.performed_at}</p>
              )}
            </div>

            {/* Next Maintenance Date */}
            <div>
              <label htmlFor="next_maintenance_date" className="block text-sm font-medium text-gray-700">
                Next Maintenance Date
              </label>
              <input
                type="date"
                id="next_maintenance_date"
                name="next_maintenance_date"
                min={formData.performed_at}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.next_maintenance_date ? 'border-red-500' : ''}`}
                value={formData.next_maintenance_date}
                onChange={handleInputChange}
              />
              {errors.next_maintenance_date && (
                <p className="mt-1 text-sm text-red-600">{errors.next_maintenance_date}</p>
              )}
            </div>

            {/* Cost */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                Cost (₹)
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                min="0"
                step="0.01"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.cost ? 'border-red-500' : ''}`}
                value={formData.cost}
                onChange={handleInputChange}
                placeholder="0.00"
              />
              {errors.cost && (
                <p className="mt-1 text-sm text-red-600">{errors.cost}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.description ? 'border-red-500' : ''}`}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the maintenance work performed..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Parts Used */}
          <div>
            <label htmlFor="parts_used" className="block text-sm font-medium text-gray-700">
              Parts Used
            </label>
            <textarea
              id="parts_used"
              name="parts_used"
              rows={2}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.parts_used ? 'border-red-500' : ''}`}
              value={formData.parts_used}
              onChange={handleInputChange}
              placeholder="List any parts or materials used..."
            />
            {errors.parts_used && (
              <p className="mt-1 text-sm text-red-600">{errors.parts_used}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href={`/streetlights/${id}?tab=maintenance`}>
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
              {isSubmitting ? 'Adding...' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMaintenanceRecordPage;