import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { healthAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface InspectionFormData {
  establishment_id: string;
  establishment_name: string;
  establishment_type: string;
  establishment_address: string;
  contact_person: string;
  contact_phone: string;
  inspection_type: string;
  inspection_date: string;
  inspection_time: string;
  duration_hours: number;
  inspector_id: string;
  notes: string;
  weather_conditions: string;
}

const NewInspectionPage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inspectors, setInspectors] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<InspectionFormData>({
    establishment_id: '',
    establishment_name: '',
    establishment_type: 'restaurant',
    establishment_address: '',
    contact_person: '',
    contact_phone: '',
    inspection_type: 'routine',
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_time: '10:00',
    duration_hours: 2,
    inspector_id: user?.id || '',
    notes: '',
    weather_conditions: '',
  });

  const establishmentTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'food_stall', label: 'Food Stall' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'school', label: 'School' },
    { value: 'water_source', label: 'Water Source' },
    { value: 'public_pool', label: 'Public Pool' },
    { value: 'gym', label: 'Gym' },
    { value: 'beauty_salon', label: 'Beauty Salon' },
    { value: 'general', label: 'General' },
  ];

  const inspectionTypes = [
    { value: 'routine', label: 'Routine Inspection' },
    { value: 'complaint_based', label: 'Complaint-Based Inspection' },
    { value: 'follow_up', label: 'Follow-Up Inspection' },
    { value: 'special', label: 'Special Inspection' },
  ];

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    if (!hasPermission('health.create')) {
      router.push('/health');
    }
    
    // In a real application, you would fetch inspectors from the API
    // For now, we'll use a mock list
    setInspectors([
      { id: user?.id || '', name: `${user?.first_name} ${user?.last_name}` || user?.username || 'Current User' },
      // Add more inspectors as needed
    ]);
  }, [hasPermission, router, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'duration_hours') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 1
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
    
    if (!formData.establishment_id.trim()) {
      newErrors.establishment_id = 'Establishment ID is required';
    }
    
    if (!formData.establishment_name.trim()) {
      newErrors.establishment_name = 'Establishment name is required';
    }
    
    if (!formData.establishment_type) {
      newErrors.establishment_type = 'Establishment type is required';
    }
    
    if (!formData.inspection_date) {
      newErrors.inspection_date = 'Inspection date is required';
    }
    
    if (!formData.inspector_id) {
      newErrors.inspector_id = 'Inspector is required';
    }
    
    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = 'Duration must be greater than 0';
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
      const response = await healthAPI.createInspection(formData);
      toast.success('Health inspection scheduled successfully');
      router.push(`/health/inspections/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to schedule health inspection';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission('health.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to schedule health inspections.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/health" className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Schedule Health Inspection</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new health inspection appointment
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Establishment ID */}
            <div>
              <label htmlFor="establishment_id" className="block text-sm font-medium text-gray-700">
                Establishment ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="establishment_id"
                name="establishment_id"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.establishment_id ? 'border-red-500' : ''}`}
                value={formData.establishment_id}
                onChange={handleInputChange}
                placeholder="e.g., EST-001"
              />
              {errors.establishment_id && (
                <p className="mt-1 text-sm text-red-600">{errors.establishment_id}</p>
              )}
            </div>

            {/* Establishment Name */}
            <div>
              <label htmlFor="establishment_name" className="block text-sm font-medium text-gray-700">
                Establishment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="establishment_name"
                name="establishment_name"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.establishment_name ? 'border-red-500' : ''}`}
                value={formData.establishment_name}
                onChange={handleInputChange}
                placeholder="e.g., ABC Restaurant"
              />
              {errors.establishment_name && (
                <p className="mt-1 text-sm text-red-600">{errors.establishment_name}</p>
              )}
            </div>

            {/* Establishment Type */}
            <div>
              <label htmlFor="establishment_type" className="block text-sm font-medium text-gray-700">
                Establishment Type <span className="text-red-500">*</span>
              </label>
              <select
                id="establishment_type"
                name="establishment_type"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.establishment_type ? 'border-red-500' : ''}`}
                value={formData.establishment_type}
                onChange={handleInputChange}
              >
                {establishmentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.establishment_type && (
                <p className="mt-1 text-sm text-red-600">{errors.establishment_type}</p>
              )}
            </div>

            {/* Inspection Type */}
            <div>
              <label htmlFor="inspection_type" className="block text-sm font-medium text-gray-700">
                Inspection Type <span className="text-red-500">*</span>
              </label>
              <select
                id="inspection_type"
                name="inspection_type"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.inspection_type ? 'border-red-500' : ''}`}
                value={formData.inspection_type}
                onChange={handleInputChange}
              >
                {inspectionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.inspection_type && (
                <p className="mt-1 text-sm text-red-600">{errors.inspection_type}</p>
              )}
            </div>

            {/* Establishment Address */}
            <div className="md:col-span-2">
              <label htmlFor="establishment_address" className="block text-sm font-medium text-gray-700">
                Establishment Address
              </label>
              <input
                type="text"
                id="establishment_address"
                name="establishment_address"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.establishment_address ? 'border-red-500' : ''}`}
                value={formData.establishment_address}
                onChange={handleInputChange}
                placeholder="e.g., 123 Main Street, City"
              />
              {errors.establishment_address && (
                <p className="mt-1 text-sm text-red-600">{errors.establishment_address}</p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                Contact Person
              </label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.contact_person ? 'border-red-500' : ''}`}
                value={formData.contact_person}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
              />
              {errors.contact_person && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_person}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.contact_phone ? 'border-red-500' : ''}`}
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="e.g., +91 9876543210"
              />
              {errors.contact_phone && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>
              )}
            </div>

            {/* Inspection Date */}
            <div>
              <label htmlFor="inspection_date" className="block text-sm font-medium text-gray-700">
                Inspection Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="inspection_date"
                name="inspection_date"
                min={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.inspection_date ? 'border-red-500' : ''}`}
                value={formData.inspection_date}
                onChange={handleInputChange}
              />
              {errors.inspection_date && (
                <p className="mt-1 text-sm text-red-600">{errors.inspection_date}</p>
              )}
            </div>

            {/* Inspection Time */}
            <div>
              <label htmlFor="inspection_time" className="block text-sm font-medium text-gray-700">
                Inspection Time
              </label>
              <select
                id="inspection_time"
                name="inspection_time"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.inspection_time ? 'border-red-500' : ''}`}
                value={formData.inspection_time}
                onChange={handleInputChange}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {errors.inspection_time && (
                <p className="mt-1 text-sm text-red-600">{errors.inspection_time}</p>
              )}
            </div>

            {/* Duration Hours */}
            <div>
              <label htmlFor="duration_hours" className="block text-sm font-medium text-gray-700">
                Duration (hours) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration_hours"
                name="duration_hours"
                min="0.5"
                max="8"
                step="0.5"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.duration_hours ? 'border-red-500' : ''}`}
                value={formData.duration_hours}
                onChange={handleInputChange}
              />
              {errors.duration_hours && (
                <p className="mt-1 text-sm text-red-600">{errors.duration_hours}</p>
              )}
            </div>

            {/* Inspector */}
            <div>
              <label htmlFor="inspector_id" className="block text-sm font-medium text-gray-700">
                Assigned Inspector <span className="text-red-500">*</span>
              </label>
              <select
                id="inspector_id"
                name="inspector_id"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.inspector_id ? 'border-red-500' : ''}`}
                value={formData.inspector_id}
                onChange={handleInputChange}
              >
                {inspectors.map(inspector => (
                  <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
                ))}
              </select>
              {errors.inspector_id && (
                <p className="mt-1 text-sm text-red-600">{errors.inspector_id}</p>
              )}
            </div>

            {/* Weather Conditions */}
            <div>
              <label htmlFor="weather_conditions" className="block text-sm font-medium text-gray-700">
                Weather Conditions
              </label>
              <input
                type="text"
                id="weather_conditions"
                name="weather_conditions"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.weather_conditions ? 'border-red-500' : ''}`}
                value={formData.weather_conditions}
                onChange={handleInputChange}
                placeholder="e.g., Sunny, Rainy, Cloudy"
              />
              {errors.weather_conditions && (
                <p className="mt-1 text-sm text-red-600">{errors.weather_conditions}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.notes ? 'border-red-500' : ''}`}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional information about the inspection..."
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/health">
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
              {isSubmitting ? 'Scheduling...' : 'Schedule Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInspectionPage;