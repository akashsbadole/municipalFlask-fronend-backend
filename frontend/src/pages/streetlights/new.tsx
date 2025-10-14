import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { streetlightsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  LightBulbIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface StreetlightFormData {
  pole_number: string;
  location: string;
  ward: string;
  street: string;
  latitude: number;
  longitude: number;
  light_type: string;
  wattage: number;
  status: string;
  installation_date: string;
  maintenance_interval: number;
  energy_consumption: number;
}

const NewStreetlightPage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [formData, setFormData] = useState<StreetlightFormData>({
    pole_number: '',
    location: '',
    ward: '',
    street: '',
    latitude: 0,
    longitude: 0,
    light_type: 'led',
    wattage: 0,
    status: 'working',
    installation_date: new Date().toISOString().split('T')[0],
    maintenance_interval: 180, // Default 180 days
    energy_consumption: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const lightTypes = [
    { value: 'led', label: 'LED', defaultWattage: 40 },
    { value: 'sodium_vapor', label: 'Sodium Vapor', defaultWattage: 70 },
    { value: 'metal_halide', label: 'Metal Halide', defaultWattage: 100 },
    { value: 'cfl', label: 'CFL', defaultWattage: 20 },
    { value: 'incandescent', label: 'Incandescent', defaultWattage: 60 },
  ];

  const statusOptions = [
    { value: 'working', label: 'Working' },
    { value: 'not_working', label: 'Not Working' },
    { value: 'maintenance_required', label: 'Maintenance Required' },
    { value: 'under_repair', label: 'Under Repair' },
  ];

  useEffect(() => {
    if (!hasPermission('streetlight.create')) {
      router.push('/dashboard');
    }
  }, [hasPermission, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'latitude' || name === 'longitude' || name === 'wattage' || name === 'maintenance_interval' || name === 'energy_consumption') {
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

  const handleLightTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lightType = e.target.value;
    const selectedType = lightTypes.find(type => type.value === lightType);
    
    setFormData(prev => ({
      ...prev,
      light_type: lightType,
      wattage: selectedType?.defaultWattage || 0
    }));
    
    if (errors.light_type) {
      setErrors(prev => ({ ...prev, light_type: '' }));
    }
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setIsGettingLocation(false);
          toast.success('Location captured successfully');
        },
        (error) => {
          setIsGettingLocation(false);
          toast.error('Failed to get location. Please enter coordinates manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.pole_number.trim()) {
      newErrors.pole_number = 'Pole number is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.ward) {
      newErrors.ward = 'Ward is required';
    }
    
    if (!formData.street.trim()) {
      newErrors.street = 'Street is required';
    }
    
    if (formData.wattage <= 0) {
      newErrors.wattage = 'Wattage must be greater than 0';
    }
    
    if (formData.maintenance_interval <= 0) {
      newErrors.maintenance_interval = 'Maintenance interval must be greater than 0';
    }
    
    if (formData.energy_consumption < 0) {
      newErrors.energy_consumption = 'Energy consumption cannot be negative';
    }
    
    if (!formData.installation_date) {
      newErrors.installation_date = 'Installation date is required';
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
      const response = await streetlightsAPI.create(formData);
      toast.success('Streetlight added successfully');
      router.push(`/streetlights/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add streetlight';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission('streetlight.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to add streetlights.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/streetlights" className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Streetlight</h1>
            <p className="mt-1 text-sm text-gray-500">
              Register a new streetlight in the system
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pole Number */}
            <div>
              <label htmlFor="pole_number" className="block text-sm font-medium text-gray-700">
                Pole Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="pole_number"
                name="pole_number"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.pole_number ? 'border-red-500' : ''}`}
                value={formData.pole_number}
                onChange={handleInputChange}
                placeholder="e.g., SL-001"
              />
              {errors.pole_number && (
                <p className="mt-1 text-sm text-red-600">{errors.pole_number}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.location ? 'border-red-500' : ''}`}
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Main Road Junction"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Ward */}
            <div>
              <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                Ward <span className="text-red-500">*</span>
              </label>
              <select
                id="ward"
                name="ward"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.ward ? 'border-red-500' : ''}`}
                value={formData.ward}
                onChange={handleInputChange}
              >
                <option value="">Select Ward</option>
                {wards.map(ward => (
                  <option key={ward} value={ward}>{ward}</option>
                ))}
              </select>
              {errors.ward && (
                <p className="mt-1 text-sm text-red-600">{errors.ward}</p>
              )}
            </div>

            {/* Street */}
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                Street <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="street"
                name="street"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.street ? 'border-red-500' : ''}`}
                value={formData.street}
                onChange={handleInputChange}
                placeholder="e.g., Mahatma Gandhi Road"
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-600">{errors.street}</p>
              )}
            </div>

            {/* Latitude */}
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                Latitude
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  step="any"
                  className={`flex-1 border-gray-300 rounded-l-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.latitude ? 'border-red-500' : ''}`}
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 19.0760"
                />
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? 'Getting...' : 'Get Location'}
                </button>
              </div>
              {errors.latitude && (
                <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
              )}
            </div>

            {/* Longitude */}
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                name="longitude"
                step="any"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.longitude ? 'border-red-500' : ''}`}
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g., 72.8777"
              />
              {errors.longitude && (
                <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
              )}
            </div>

            {/* Light Type */}
            <div>
              <label htmlFor="light_type" className="block text-sm font-medium text-gray-700">
                Light Type <span className="text-red-500">*</span>
              </label>
              <select
                id="light_type"
                name="light_type"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.light_type ? 'border-red-500' : ''}`}
                value={formData.light_type}
                onChange={handleLightTypeChange}
              >
                {lightTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.light_type && (
                <p className="mt-1 text-sm text-red-600">{errors.light_type}</p>
              )}
            </div>

            {/* Wattage */}
            <div>
              <label htmlFor="wattage" className="block text-sm font-medium text-gray-700">
                Wattage (W) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="wattage"
                name="wattage"
                min="1"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.wattage ? 'border-red-500' : ''}`}
                value={formData.wattage}
                onChange={handleInputChange}
                placeholder="e.g., 40"
              />
              {errors.wattage && (
                <p className="mt-1 text-sm text-red-600">{errors.wattage}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.status ? 'border-red-500' : ''}`}
                value={formData.status}
                onChange={handleInputChange}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            {/* Installation Date */}
            <div>
              <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700">
                Installation Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="installation_date"
                name="installation_date"
                max={new Date().toISOString().split('T')[0]}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.installation_date ? 'border-red-500' : ''}`}
                value={formData.installation_date}
                onChange={handleInputChange}
              />
              {errors.installation_date && (
                <p className="mt-1 text-sm text-red-600">{errors.installation_date}</p>
              )}
            </div>

            {/* Maintenance Interval */}
            <div>
              <label htmlFor="maintenance_interval" className="block text-sm font-medium text-gray-700">
                Maintenance Interval (days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="maintenance_interval"
                name="maintenance_interval"
                min="1"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.maintenance_interval ? 'border-red-500' : ''}`}
                value={formData.maintenance_interval}
                onChange={handleInputChange}
                placeholder="e.g., 180"
              />
              {errors.maintenance_interval && (
                <p className="mt-1 text-sm text-red-600">{errors.maintenance_interval}</p>
              )}
            </div>

            {/* Energy Consumption */}
            <div>
              <label htmlFor="energy_consumption" className="block text-sm font-medium text-gray-700">
                Energy Consumption (kWh/month)
              </label>
              <input
                type="number"
                id="energy_consumption"
                name="energy_consumption"
                min="0"
                step="0.1"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.energy_consumption ? 'border-red-500' : ''}`}
                value={formData.energy_consumption}
                onChange={handleInputChange}
                placeholder="e.g., 15.5"
              />
              {errors.energy_consumption && (
                <p className="mt-1 text-sm text-red-600">{errors.energy_consumption}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/streetlights">
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
              {isSubmitting ? 'Adding...' : 'Add Streetlight'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewStreetlightPage;