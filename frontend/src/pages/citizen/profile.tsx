import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface CitizenProfile {
  id: string;
  aadhaar_number?: string;
  voter_id?: string;
  address: string;
  ward: string;
  zone: string;
  is_verified: boolean;
  verification_method?: string;
  created_at: string;
  updated_at: string;
}

const CitizenProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    aadhaar_number: '',
    voter_id: '',
    address: '',
    ward: '',
    zone: '',
    phone: user?.phone || '',
    email: user?.email || '',
  });

  const wards = Array.from({ length: 50 }, (_, i) => `Ward ${i + 1}`);
  const zones = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];

  useEffect(() => {
    // In a real application, you would fetch the citizen profile from the API
    // For now, we'll simulate it
    const fetchProfile = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setProfile({
            id: user?.id || '',
            aadhaar_number: 'XXXX-XXXX-XXXX',
            voter_id: 'ABC1234567',
            address: '123 Main Street, Area Name, City',
            ward: 'Ward 15',
            zone: 'North Zone',
            is_verified: true,
            verification_method: 'Aadhaar',
            created_at: '2023-01-15T10:30:00Z',
            updated_at: '2023-06-20T14:45:00Z',
          });
          
          setFormData({
            aadhaar_number: 'XXXX-XXXX-XXXX',
            voter_id: 'ABC1234567',
            address: '123 Main Street, Area Name, City',
            ward: 'Ward 15',
            zone: 'North Zone',
            phone: user?.phone || '',
            email: user?.email || '',
          });
          
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setIsUpdating(true);
    
    try {
      // In a real application, you would call the API to update the profile
      // For now, we'll simulate it
      setTimeout(() => {
        setProfile(prev => prev ? {
          ...prev,
          address: formData.address,
          ward: formData.ward,
          zone: formData.zone,
          updated_at: new Date().toISOString(),
        } : null);
        
        // Update user profile if phone or email changed
        if (formData.phone !== user?.phone || formData.email !== user?.email) {
          await updateProfile({
            phone: formData.phone,
            email: formData.email,
          });
        }
        
        toast.success('Profile updated successfully!');
        setIsUpdating(false);
      }, 1000);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
      setIsUpdating(false);
    }
  };

  if (!user || user.role !== 'Citizen') {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          This page is only available to citizen accounts.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Photo
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-full w-full text-gray-300" />
                      )}
                    </span>
                    <button
                      type="button"
                      className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CameraIcon className="h-5 w-5 text-gray-400 mr-2 inline" />
                      Change
                    </button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100"
                        value={user?.first_name || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100"
                        value={user?.last_name || ''}
                        disabled
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700">
                        Aadhaar Number
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="aadhaar_number"
                          id="aadhaar_number"
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-gray-100"
                          value={formData.aadhaar_number}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="voter_id" className="block text-sm font-medium text-gray-700">
                        Voter ID
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IdentificationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="voter_id"
                          id="voter_id"
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-gray-100"
                          value={formData.voter_id}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  
                  {profile?.is_verified && (
                    <div className="mt-4 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-700">
                        Verified via {profile.verification_method}
                      </span>
                    </div>
                  )}
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <textarea
                          id="address"
                          name="address"
                          rows={3}
                          className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                        Ward
                      </label>
                      <select
                        id="ward"
                        name="ward"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.ward}
                        onChange={handleInputChange}
                      >
                        <option value="">Select ward</option>
                        {wards.map((ward) => (
                          <option key={ward} value={ward}>
                            {ward}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
                        Zone
                      </label>
                      <select
                        id="zone"
                        name="zone"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.zone}
                        onChange={handleInputChange}
                      >
                        <option value="">Select zone</option>
                        {zones.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Save Changes'
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

export default CitizenProfilePage;