import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  PhotoIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ComplaintCategory {
  id: string;
  name: string;
  description: string;
  department: string;
  default_priority: string;
  escalation_matrix: string;
}

const NewComplaintPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [location, setLocation] = useState({ lat: '', lng: '', address: '' });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await complaintsAPI.getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load complaint categories');
      } finally {
        setIsFetchingCategories(false);
      }
    };

    if (hasPermission('complaint.create')) {
      fetchCategories();
    }
  }, [hasPermission]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Set default priority based on category
    if (name === 'category_id') {
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory) {
        setFormData(prev => ({ ...prev, priority: selectedCategory.default_priority }));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
      
      // Create previews for new images
      newImages.forEach(image => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImagePreviews(prev => [...prev, event.target.result as string]);
          }
        };
        reader.readAsDataURL(image);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(prev => ({
            ...prev,
            lat: latitude.toString(),
            lng: longitude.toString()
          }));
          
          // Try to get address from coordinates (reverse geocoding)
          // This would typically use a service like Google Maps API
          // For now, we'll just use the coordinates
          setIsGettingLocation(false);
          toast.success('Location captured successfully');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Failed to get your location');
          setIsGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.title || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const complaintData = new FormData();
      complaintData.append('category_id', formData.category_id);
      complaintData.append('title', formData.title);
      complaintData.append('description', formData.description);
      complaintData.append('priority', formData.priority);
      
      if (location.address) {
        complaintData.append('location', location.address);
      }
      if (location.lat && location.lng) {
        complaintData.append('latitude', location.lat);
        complaintData.append('longitude', location.lng);
      }
      
      // Add images
      images.forEach((image, index) => {
        complaintData.append(`images`, image);
      });
      
      const response = await complaintsAPI.create(complaintData);
      toast.success(`Complaint submitted successfully! Ticket #${response.data.ticket_number}`);
      router.push('/complaints');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit complaint';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission('complaint.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to create complaints.
        </p>
      </div>
    );
  }

  if (isFetchingCategories) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/complaints" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Complaints
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">File a Complaint</h3>
            <p className="mt-1 text-sm text-gray-600">
              Provide details about the issue you're facing. The more information you provide, the better we can assist you.
            </p>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Category Selection */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                    Complaint Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {category.department}
                      </option>
                    ))}
                  </select>
                  {formData.category_id && (
                    <p className="mt-1 text-sm text-gray-500">
                      {categories.find(cat => cat.id === formData.category_id)?.description}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Complaint Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide detailed information about the issue"
                      required
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1 grid grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter address or landmark"
                        value={location.address}
                        onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Latitude"
                        value={location.lat}
                        onChange={(e) => setLocation(prev => ({ ...prev, lat: e.target.value }))}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Longitude"
                        value={location.lng}
                        onChange={(e) => setLocation(prev => ({ ...prev, lng: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <MapPinIcon className="mr-1 h-4 w-4" />
                      {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
                    </button>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attach Images (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="images"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload files</span>
                          <input
                            id="images"
                            name="images"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB each
                      </p>
                    </div>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                            onClick={() => removeImage(index)}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewComplaintPage;