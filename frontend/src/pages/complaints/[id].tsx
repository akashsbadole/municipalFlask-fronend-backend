import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  category: {
    id: string;
    name: string;
    department: string;
  };
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  citizen_id: string;
  citizen_name?: string;
  assigned_to?: string;
  assigned_name?: string;
  location?: string;
  latitude?: string;
  longitude?: string;
  images?: string[];
  feedback?: string;
  rating?: number;
  status_history?: Array<{
    status: string;
    notes?: string;
    created_at: string;
    updated_by?: string;
    updated_by_name?: string;
  }>;
}

const ComplaintDetailPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!id) return;
      
      try {
        const response = await complaintsAPI.getById(id as string);
        setComplaint(response.data);
        
        // Set existing feedback if available
        if (response.data.feedback) {
          setFeedback(response.data.feedback);
        }
        if (response.data.rating) {
          setRating(response.data.rating);
        }
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load complaint details';
        toast.error(message);
        router.push('/complaints');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission('complaint.read') && id) {
      fetchComplaint();
    }
  }, [id, hasPermission, router]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-6 w-6 text-blue-500" />;
      case 'resolved':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'closed':
        return <CheckCircleIcon className="h-6 w-6 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback || rating === 0) {
      toast.error('Please provide both feedback and rating');
      return;
    }

    setIsSubmittingFeedback(true);
    
    try {
      await complaintsAPI.addFeedback(id as string, { feedback, rating });
      toast.success('Thank you for your feedback!');
      
      // Refresh complaint data
      const response = await complaintsAPI.getById(id as string);
      setComplaint(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit feedback';
      toast.error(message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (!hasPermission('complaint.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view complaint details.
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

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Complaint Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The complaint you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/complaints"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Complaints
          </Link>
        </div>
      </div>
    );
  }

  const canSubmitFeedback = user?.role === 'Citizen' && 
                          complaint.citizen_id === user.id && 
                          (complaint.status === 'resolved' || complaint.status === 'closed') &&
                          !complaint.feedback;

  return (
    <div>
      <div className="mb-6">
        <Link href="/complaints" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Complaints
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(complaint.status)}
              <h3 className="ml-3 text-lg leading-6 font-medium text-gray-900">
                {complaint.title}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(complaint.status)}`}>
                {complaint.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeClass(complaint.priority)}`}>
                {complaint.priority}
              </span>
            </div>
          </div>
          <div className="mt-2 max-w-2xl text-sm text-gray-500">
            Ticket #{complaint.ticket_number}
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {complaint.category.name} - {complaint.category.department}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {complaint.description}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Submitted by</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {complaint.citizen_name || 'N/A'}
              </dd>
            </div>
            
            {complaint.assigned_name && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Assigned to</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {complaint.assigned_name}
                </dd>
              </div>
            )}
            
            {complaint.location && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                    {complaint.location}
                  </div>
                  {complaint.latitude && complaint.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${complaint.latitude},${complaint.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500 text-sm mt-1 inline-block"
                    >
                      View on Map
                    </a>
                  )}
                </dd>
              </div>
            )}
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Dates</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Created: {new Date(complaint.created_at).toLocaleString()}
                </div>
                {complaint.updated_at !== complaint.created_at && (
                  <div className="flex items-center mt-1">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    Last Updated: {new Date(complaint.updated_at).toLocaleString()}
                  </div>
                )}
              </dd>
            </div>
            
            {complaint.images && complaint.images.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Images</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="grid grid-cols-3 gap-4">
                    {complaint.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Complaint image ${index + 1}`}
                          className="h-32 w-full object-cover rounded-md cursor-pointer"
                          onClick={() => window.open(image, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Status History */}
      {complaint.status_history && complaint.status_history.length > 0 && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Status History</h3>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {complaint.status_history.map((history, index) => (
                <li key={index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(history.status)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {history.status.replace('_', ' ')}
                        </p>
                        {history.notes && (
                          <p className="text-sm text-gray-500">{history.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(history.created_at).toLocaleString()}
                      </p>
                      {history.updated_by_name && (
                        <p className="text-xs text-gray-400">
                          by {history.updated_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Feedback Section */}
      {canSubmitFeedback && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Provide Feedback</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Your feedback helps us improve our services.
            </p>
          </div>
          <form onSubmit={handleFeedbackSubmit} className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                  Rating
                </label>
                <div className="mt-1 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-gray-400 hover:text-yellow-400 focus:outline-none"
                      onClick={() => setRating(star)}
                    >
                      <StarIcon
                        className={`h-8 w-8 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                        fill={star <= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Please select a rating'}
                  </span>
                </div>
              </div>
              
              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                  Your Feedback
                </label>
                <div className="mt-1">
                  <textarea
                    id="feedback"
                    name="feedback"
                    rows={4}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Share your experience with this complaint resolution..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmittingFeedback ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Existing Feedback */}
      {complaint.feedback && (
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Feedback</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex items-center mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-6 w-6 ${
                      star <= (complaint.rating || 0) ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                    fill={star <= (complaint.rating || 0) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-500">
                {complaint.rating} star{complaint.rating && complaint.rating > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-gray-900">{complaint.feedback}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailPage;