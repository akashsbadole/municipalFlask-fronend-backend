import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { financeAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface Budget {
  id: string;
  title: string;
  description: string;
  fiscal_year: string;
  department: string;
  budget_type: string;
  total_allocated: number;
  total_spent: number;
  status: string;
  created_at: string;
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
  approved_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  approved_date?: string;
  justification: string;
  budget_items: BudgetItem[];
  comments: BudgetComment[];
}

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  allocated_amount: number;
  spent_amount: number;
  notes: string;
}

interface BudgetComment {
  id: string;
  comment: string;
  created_at: string;
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
}

const BudgetDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getBudgetById(id as string);
      setBudget(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch budget details';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!budget) return;
    
    setIsApproving(true);
    try {
      await financeAPI.approveBudget(budget.id);
      toast.success('Budget approved successfully');
      fetchBudget(); // Refresh budget data
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to approve budget';
      toast.error(message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!budget) return;
    
    setIsRejecting(true);
    try {
      await financeAPI.rejectBudget(budget.id);
      toast.success('Budget rejected successfully');
      fetchBudget(); // Refresh budget data
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to reject budget';
      toast.error(message);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget || !newComment.trim()) return;
    
    setIsAddingComment(true);
    try {
      await financeAPI.addBudgetComment(budget.id, { comment: newComment });
      toast.success('Comment added successfully');
      setNewComment('');
      setShowCommentForm(false);
      fetchBudget(); // Refresh budget data
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to add comment';
      toast.error(message);
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            Draft
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Submitted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Rejected
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !budget) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-2 text-sm text-gray-500">{error || 'Budget not found'}</p>
        <Link href="/finance/budgets">
          <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            Back to Budgets
          </button>
        </Link>
      </div>
    );
  }

  const canApprove = hasPermission('finance.approve') && budget.status === 'submitted';
  const canEdit = hasPermission('finance.edit') && (budget.status === 'draft' || budget.status === 'submitted');

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/finance/budgets" className="mr-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{budget.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on {format(new Date(budget.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(budget.status)}
            {canEdit && (
              <Link href={`/finance/budgets/${budget.id}/edit`}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}
            {canApprove && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isApproving ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Budget Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Fiscal Year</p>
                <p className="mt-1 text-sm text-gray-900">{budget.fiscal_year}-{parseInt(budget.fiscal_year) + 1}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="mt-1 text-sm text-gray-900">{budget.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Budget Type</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">{budget.budget_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created By</p>
                <p className="mt-1 text-sm text-gray-900">{budget.created_by_user.name}</p>
              </div>
              {budget.approved_by_user && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved By</p>
                  <p className="mt-1 text-sm text-gray-900">{budget.approved_by_user.name}</p>
                </div>
              )}
              {budget.approved_date && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Approved Date</p>
                  <p className="mt-1 text-sm text-gray-900">{format(new Date(budget.approved_date), 'MMMM d, yyyy')}</p>
                </div>
              )}
            </div>
            
            {budget.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1 text-sm text-gray-900">{budget.description}</p>
              </div>
            )}
            
            {budget.justification && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Justification</p>
                <p className="mt-1 text-sm text-gray-900">{budget.justification}</p>
              </div>
            )}
          </div>

          {/* Budget Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Items</h2>
            {budget.budget_items.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocated
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {budget.budget_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.allocated_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.spent_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.allocated_amount - item.spent_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No budget items added yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Budget Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Allocated</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.total_allocated)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget.total_spent)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(budget.total_allocated - budget.total_spent)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utilization</p>
                <div className="mt-1">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((budget.total_spent / budget.total_allocated) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {Math.round((budget.total_spent / budget.total_allocated) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Comments</h2>
              {hasPermission('finance.comment') && (
                <button
                  type="button"
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Comment
                </button>
              )}
            </div>
            
            {showCommentForm && (
              <form onSubmit={handleAddComment} className="mb-4">
                <div className="mb-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Add a comment..."
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCommentForm(false)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingComment || !newComment.trim()}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isAddingComment ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            )}
            
            {budget.comments.length > 0 ? (
              <div className="space-y-3">
                {budget.comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {comment.created_by_user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetailPage;