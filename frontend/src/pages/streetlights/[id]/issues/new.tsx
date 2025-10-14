import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { streetlightsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PhotoIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface IssueFormData {
  reported_by: string;
  issue_type: string;
  description: string;
  contact_number?: string;
}

const NewIssuePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [streetlight, setStreetlight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  
  const [formData, setFormData] = useState<IssueFormData>({
    reported_by: '',
    issue_type: 'not_working',
    description: '',
    contact_number: '',
  });

  const issueTypes = [
    { value: 'not_working', label: 'Not Working', description: 'Streetlight is completely off' },
    { value: 'flickering', label: 'Flickering', description: 'Light is flickering on and off' },
    { value: 'dim_light', label: 'Dim Light', description: 'Light is not bright enough' },
    { value: 'physical_damage', label: 'Physical Damage', description: 'Pole or light fixture is damaged' },
    { value: 'wiring_issue', label: 'Wiring Issue', description: 'Exposed or damaged wiring' },
    { value: 'other', label: 'Other', description: 'Any other issue not listed above' },
  ];

  useEffect(() => {
    if (id) {
      fetchStreetlight();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        reported_by: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || ''
      }));
    }
  }, [user]);

  const fetchStreetlight = async () => {
    setIsLoading(true);
    try {
      const response = await streetlightsAPI.getById(id as string);
      setStreetlight(response.data);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.reported_by.trim()) {
      newErrors.reported_by = 'Reporter name is required';
    }
    
    if (!formData.issue_type) {
      newErrors.issue_type = 'Issue type is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
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
      const response = await streetlightsAPI.reportIssue(id as string, formData);
      toast.success('Issue reported successfully. We will address it soon.');
      router.push(`/streetlights/${id}?tab=issues`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to report issue';
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

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href={`/streetlights/${id}?tab=issues`} className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Report Streetlight Issue</h1>
            <p className="mt-1 text-sm text-gray-500">
              {streetlight?.pole_number} • {streetlight?.location}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Streetlight Info */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {streetlight?.pole_number}
                </p>
                <p className="text-sm text-gray-500">
                  {streetlight?.street}, {streetlight?.ward}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reporter Name */}
            <div>
              <label htmlFor="reported_by" className="block text-sm font-medium text-gray-700">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="reported_by"
                name="reported_by"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.reported_by ? 'border-red-500' : ''}`}
                value={formData.reported_by}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
              {errors.reported_by && (
                <p className="mt-1 text-sm text-red-600">{errors.reported_by}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.contact_number ? 'border-red-500' : ''}`}
                value={formData.contact_number}
                onChange={handleInputChange}
                placeholder="Enter your phone number (optional)"
              />
              {errors.contact_number && (
                <p className="mt-1 text-sm text-red-600">{errors.contact_number}</p>
              )}
            </div>
          </div>

          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Issue Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {issueTypes.map((type) => (
                <div key={type.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={type.value}
                      name="issue_type"
                      type="radio"
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                      value={type.value}
                      checked={formData.issue_type === type.value}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={type.value} className="font-medium text-gray-700">
                      {type.label}
                    </label>
                    <p className="text-gray-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {errors.issue_type && (
              <p className="mt-1 text-sm text-red-600">{errors.issue_type}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.description ? 'border-red-500' : ''}`}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please provide a detailed description of the issue..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="photos" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click to upload photos
                  </span>
                  <input
                    id="photos"
                    name="photos"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">{photos.length} photo(s) selected</p>
                  <ul className="mt-1 text-xs text-gray-500">
                    {photos.map((photo, index) => (
                      <li key={index}>{photo.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href={`/streetlights/${id}?tab=issues`}>
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
              {isSubmitting ? 'Submitting...' : 'Report Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIssuePage;