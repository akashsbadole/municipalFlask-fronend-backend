import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { wasteAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  MapPinIcon,
  TruckIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface RouteStop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  households: number;
  estimated_waste: number;
  collection_time: string;
  order: number;
}

interface RouteFormData {
  route_name: string;
  ward: string;
  area: string;
  vehicle_number: string;
  driver_name: string;
  driver_contact: string;
  collection_frequency: string;
  collection_time: string;
  estimated_duration: string;
  notes: string;
}

const NewWasteRoutePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<RouteFormData>({
    route_name: '',
    ward: '',
    area: '',
    vehicle_number: '',
    driver_name: '',
    driver_contact: '',
    collection_frequency: 'daily',
    collection_time: '06:00',
    estimated_duration: '',
    notes: '',
  });
  
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newStop, setNewStop] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    households: '',
    estimated_waste: '',
    collection_time: '',
  });

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStopInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStop(prev => ({ ...prev, [name]: value }));
  };

  const addStop = () => {
    // Validate stop data
    if (!newStop.name || !newStop.address || !newStop.latitude || !newStop.longitude) {
      toast.error('Please fill all required fields for the stop');
      return;
    }

    // Validate coordinates
    const lat = parseFloat(newStop.latitude);
    const lng = parseFloat(newStop.longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid latitude and longitude coordinates');
      return;
    }

    const stop: RouteStop = {
      id: Date.now().toString(),
      name: newStop.name,
      address: newStop.address,
      latitude: lat,
      longitude: lng,
      households: parseInt(newStop.households) || 0,
      estimated_waste: parseFloat(newStop.estimated_waste) || 0,
      collection_time: newStop.collection_time,
      order: stops.length + 1,
    };

    setStops(prev => [...prev, stop]);
    
    // Reset new stop form
    setNewStop({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      households: '',
      estimated_waste: '',
      collection_time: '',
    });
  };

  const removeStop = (id: string) => {
    setStops(prev => prev.filter(stop => stop.id !== id));
  };

  const moveStop = (id: string, direction: 'up' | 'down') => {
    const index = stops.findIndex(stop => stop.id === id);
    if (index === -1) return;
    
    const newStops = [...stops];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newStops.length) return;
    
    // Swap stops
    [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
    
    // Update order numbers
    newStops.forEach((stop, i) => {
      stop.order = i + 1;
    });
    
    setStops(newStops);
  };

  const optimizeRoute = async () => {
    if (stops.length < 2) {
      toast.error('At least 2 stops are required to optimize a route');
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Simulate API call for route optimization
      // In a real application, this would call a route optimization service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we'll just sort by estimated waste (descending)
      // In a real app, this would use a proper optimization algorithm
      const optimizedStops = [...stops].sort((a, b) => b.estimated_waste - a.estimated_waste);
      
      // Update order numbers
      optimizedStops.forEach((stop, i) => {
        stop.order = i + 1;
      });
      
      setStops(optimizedStops);
      toast.success('Route optimized successfully!');
    } catch (error) {
      toast.error('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.route_name.trim()) newErrors.route_name = 'Route name is required';
    if (!formData.ward) newErrors.ward = 'Ward is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.vehicle_number.trim()) newErrors.vehicle_number = 'Vehicle number is required';
    if (!formData.driver_name.trim()) newErrors.driver_name = 'Driver name is required';
    if (!formData.driver_contact.trim()) newErrors.driver_contact = 'Driver contact is required';
    if (!formData.collection_time) newErrors.collection_time = 'Collection time is required';
    if (!formData.estimated_duration.trim()) newErrors.estimated_duration = 'Estimated duration is required';
    
    // Phone validation
    if (formData.driver_contact && !/^\d{10}$/.test(formData.driver_contact.replace(/\D/g, ''))) {
      newErrors.driver_contact = 'Please enter a valid 10-digit phone number';
    }
    
    // Stops validation
    if (stops.length === 0) {
      newErrors.stops = 'At least one stop is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const routeData = {
        ...formData,
        stops,
        created_by: user?.id,
      };
      
      const response = await wasteAPI.createRoute(routeData);
      toast.success('Waste collection route created successfully!');
      
      // Redirect to the route details page
      router.push(`/waste/routes/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create route';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/waste/routes" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Routes
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create Waste Collection Route</h3>
            <p className="mt-1 text-sm text-gray-600">
              Define a new waste collection route with optimized stops and schedule.
            </p>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Route Optimization</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Add multiple collection stops and use the optimize button to arrange them in the most efficient order based on waste volume and distance.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Route Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="route_name" className="block text-sm font-medium text-gray-700">
                        Route Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="route_name"
                        id="route_name"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.route_name ? 'border-red-500' : ''}`}
                        value={formData.route_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Central Area Morning Route"
                      />
                      {errors.route_name && <p className="mt-1 text-sm text-red-500">{errors.route_name}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                        Ward <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="ward"
                        name="ward"
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${errors.ward ? 'border-red-500' : ''}`}
                        value={formData.ward}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Ward</option>
                        {wards.map(ward => (
                          <option key={ward} value={ward}>{ward}</option>
                        ))}
                      </select>
                      {errors.ward && <p className="mt-1 text-sm text-red-500">{errors.ward}</p>}
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                        Area <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="area"
                        id="area"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.area ? 'border-red-500' : ''}`}
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="e.g., Central Business District"
                      />
                      {errors.area && <p className="mt-1 text-sm text-red-500">{errors.area}</p>}
                    </div>
                  </div>
                </div>

                {/* Vehicle and Driver Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle & Driver Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="vehicle_number" className="block text-sm font-medium text-gray-700">
                        Vehicle Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="vehicle_number"
                        id="vehicle_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.vehicle_number ? 'border-red-500' : ''}`}
                        value={formData.vehicle_number}
                        onChange={handleInputChange}
                        placeholder="e.g., MH-12-AB-1234"
                      />
                      {errors.vehicle_number && <p className="mt-1 text-sm text-red-500">{errors.vehicle_number}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="driver_name" className="block text-sm font-medium text-gray-700">
                        Driver Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="driver_name"
                        id="driver_name"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.driver_name ? 'border-red-500' : ''}`}
                        value={formData.driver_name}
                        onChange={handleInputChange}
                      />
                      {errors.driver_name && <p className="mt-1 text-sm text-red-500">{errors.driver_name}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="driver_contact" className="block text-sm font-medium text-gray-700">
                        Driver Contact <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="driver_contact"
                        id="driver_contact"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.driver_contact ? 'border-red-500' : ''}`}
                        value={formData.driver_contact}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                      />
                      {errors.driver_contact && <p className="mt-1 text-sm text-red-500">{errors.driver_contact}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="collection_frequency" className="block text-sm font-medium text-gray-700">
                        Collection Frequency
                      </label>
                      <select
                        id="collection_frequency"
                        name="collection_frequency"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.collection_frequency}
                        onChange={handleInputChange}
                      >
                        {frequencies.map(freq => (
                          <option key={freq.value} value={freq.value}>{freq.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="collection_time" className="block text-sm font-medium text-gray-700">
                        Collection Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="collection_time"
                        id="collection_time"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.collection_time ? 'border-red-500' : ''}`}
                        value={formData.collection_time}
                        onChange={handleInputChange}
                      />
                      {errors.collection_time && <p className="mt-1 text-sm text-red-500">{errors.collection_time}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700">
                        Estimated Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="estimated_duration"
                        id="estimated_duration"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.estimated_duration ? 'border-red-500' : ''}`}
                        value={formData.estimated_duration}
                        onChange={handleInputChange}
                        placeholder="e.g., 4 hours"
                      />
                      {errors.estimated_duration && <p className="mt-1 text-sm text-red-500">{errors.estimated_duration}</p>}
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any additional notes about this route"
                      />
                    </div>
                  </div>
                </div>

                {/* Collection Stops */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Collection Stops</h3>
                    {stops.length > 1 && (
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={optimizeRoute}
                        disabled={isOptimizing}
                      >
                        {isOptimizing ? (
                          <span className="loading-spinner"></span>
                        ) : (
                          'Optimize Route'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {errors.stops && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{errors.stops}</p>
                    </div>
                  )}
                  
                  {/* Add New Stop Form */}
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Add New Stop</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="stop_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Stop Name
                        </label>
                        <input
                          type="text"
                          id="stop_name"
                          name="name"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.name}
                          onChange={handleStopInputChange}
                          placeholder="e.g., Main Street Market"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="stop_address" className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          id="stop_address"
                          name="address"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.address}
                          onChange={handleStopInputChange}
                          placeholder="e.g., 123 Main Street"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="text"
                          id="latitude"
                          name="latitude"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.latitude}
                          onChange={handleStopInputChange}
                          placeholder="e.g., 19.0760"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="text"
                          id="longitude"
                          name="longitude"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.longitude}
                          onChange={handleStopInputChange}
                          placeholder="e.g., 72.8777"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="households" className="block text-sm font-medium text-gray-700 mb-1">
                          Number of Households
                        </label>
                        <input
                          type="number"
                          id="households"
                          name="households"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.households}
                          onChange={handleStopInputChange}
                          placeholder="e.g., 50"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="estimated_waste" className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Waste (kg)
                        </label>
                        <input
                          type="number"
                          id="estimated_waste"
                          name="estimated_waste"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.estimated_waste}
                          onChange={handleStopInputChange}
                          placeholder="e.g., 25"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="collection_time" className="block text-sm font-medium text-gray-700 mb-1">
                          Collection Time
                        </label>
                        <input
                          type="time"
                          id="collection_time"
                          name="collection_time"
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={newStop.collection_time}
                          onChange={handleStopInputChange}
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          onClick={addStop}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Stop
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stops List */}
                  {stops.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-medium text-gray-900">Route Stops ({stops.length})</h4>
                      {stops.map((stop, index) => (
                        <div key={stop.id} className="bg-white p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">{stop.order}</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{stop.name}</p>
                                <p className="text-sm text-gray-500">{stop.address}</p>
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                  <span>{stop.households} households</span>
                                  <span className="mx-1">•</span>
                                  <span>{stop.estimated_waste} kg waste</span>
                                  {stop.collection_time && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span>{stop.collection_time}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-600"
                                onClick={() => moveStop(stop.id, 'up')}
                                disabled={index === 0}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-gray-600"
                                onClick={() => moveStop(stop.id, 'down')}
                                disabled={index === stops.length - 1}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="p-1 text-red-400 hover:text-red-600"
                                onClick={() => removeStop(stop.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Create Route'
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

export default NewWasteRoutePage;