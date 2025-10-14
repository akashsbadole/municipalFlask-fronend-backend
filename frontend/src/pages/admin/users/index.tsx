import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const UsersManagementPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params: any = {
          page: currentPage,
          limit: 10,
        };

        if (searchTerm) {
          params.search = searchTerm;
        }

        if (roleFilter !== 'all') {
          params.role = roleFilter;
        }

        if (statusFilter !== 'all') {
          params.is_active = statusFilter === 'active';
        }

        // In a real application, you would fetch users from the API
        // For now, we'll simulate it
        setTimeout(() => {
          const mockUsers: User[] = [
            {
              id: '1',
              username: 'admin',
              email: 'admin@municipal.gov',
              first_name: 'Super',
              last_name: 'Admin',
              phone: '9876543210',
              role: 'Super Admin',
              is_active: true,
              is_verified: true,
              created_at: '2023-01-01T00:00:00Z',
              last_login: '2023-10-14T09:30:00Z',
            },
            {
              id: '2',
              username: 'commissioner',
              email: 'commissioner@municipal.gov',
              first_name: 'Municipal',
              last_name: 'Commissioner',
              phone: '9876543211',
              role: 'Municipal Commissioner',
              is_active: true,
              is_verified: true,
              created_at: '2023-01-15T00:00:00Z',
              last_login: '2023-10-14T08:45:00Z',
            },
            {
              id: '3',
              username: 'dept_head',
              email: 'dept_head@municipal.gov',
              first_name: 'Department',
              last_name: 'Head',
              phone: '9876543212',
              role: 'Department Head',
              is_active: true,
              is_verified: true,
              created_at: '2023-02-01T00:00:00Z',
              last_login: '2023-10-13T16:20:00Z',
            },
            {
              id: '4',
              username: 'field_officer',
              email: 'field_officer@municipal.gov',
              first_name: 'Field',
              last_name: 'Officer',
              phone: '9876543213',
              role: 'Field Officer',
              is_active: true,
              is_verified: true,
              created_at: '2023-03-10T00:00:00Z',
              last_login: '2023-10-14T07:15:00Z',
            },
            {
              id: '5',
              username: 'citizen1',
              email: 'citizen1@example.com',
              first_name: 'John',
              last_name: 'Doe',
              phone: '9876543214',
              role: 'Citizen',
              is_active: true,
              is_verified: true,
              created_at: '2023-04-05T00:00:00Z',
              last_login: '2023-10-14T10:00:00Z',
            },
            {
              id: '6',
              username: 'inactive_user',
              email: 'inactive@example.com',
              first_name: 'Inactive',
              last_name: 'User',
              phone: '9876543215',
              role: 'Citizen',
              is_active: false,
              is_verified: false,
              created_at: '2023-05-20T00:00:00Z',
            },
          ];
          
          // Apply filters
          let filteredUsers = mockUsers;
          
          if (searchTerm) {
            filteredUsers = filteredUsers.filter(u => 
              u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          if (roleFilter !== 'all') {
            filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
          }
          
          if (statusFilter !== 'all') {
            const isActive = statusFilter === 'active';
            filteredUsers = filteredUsers.filter(u => u.is_active === isActive);
          }
          
          setUsers(filteredUsers);
          setTotalPages(Math.ceil(filteredUsers.length / 10));
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to load users');
        setIsLoading(false);
      }
    };

    if (hasPermission('user.read')) {
      fetchUsers();
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, hasPermission]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // In a real application, you would fetch roles from the API
        const mockRoles: Role[] = [
          { id: '1', name: 'Super Admin', description: 'Full system access', permissions: ['*'] },
          { id: '2', name: 'Municipal Commissioner', description: 'Municipal corporation head', permissions: ['*'] },
          { id: '3', name: 'Department Head', description: 'Department management', permissions: ['*'] },
          { id: '4', name: 'Field Officer', description: 'Field operations', permissions: ['*'] },
          { id: '5', name: 'Citizen', description: 'Regular citizen', permissions: ['*'] },
        ];
        setRoles(mockRoles);
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchRoles();
  }, []);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // In a real application, you would call the API to delete the user
      // await authAPI.deleteUser(selectedUser.id);
      
      // For now, we'll simulate it
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete user';
      toast.error(message);
    }
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Municipal Commissioner':
        return 'bg-red-100 text-red-800';
      case 'Department Head':
        return 'bg-blue-100 text-blue-800';
      case 'Field Officer':
        return 'bg-green-100 text-green-800';
      case 'Citizen':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800';
    if (!isVerified) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  if (!hasPermission('user.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to manage users.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            User Management
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          {hasPermission('user.create') && (
            <Link
              href="/admin/users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add User
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding a new user.'}
          </p>
          {hasPermission('user.create') && !searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
            <div className="mt-6">
              <Link
                href="/admin/users/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add User
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((userItem) => (
              <li key={userItem.id}>
                <div className="px-4 py-4 hover:bg-gray-50 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary-600 truncate">
                          {userItem.first_name} {userItem.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userItem.email} • @{userItem.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(userItem.role)}`}>
                        {userItem.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(userItem.is_active, userItem.is_verified)}`}>
                        {getStatusText(userItem.is_active, userItem.is_verified)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="text-sm text-gray-500">
                        Phone: {userItem.phone || 'N/A'}
                      </p>
                      <p className="mt-1 sm:mt-0 sm:ml-6 text-sm text-gray-500">
                        Joined: {new Date(userItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      {userItem.last_login && (
                        <p>
                          Last login: {new Date(userItem.last_login).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Link
                      href={`/admin/users/${userItem.id}`}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    {hasPermission('user.update') && (
                      <Link
                        href={`/admin/users/${userItem.id}/edit`}
                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    )}
                    {hasPermission('user.delete') && userItem.id !== user?.id && (
                      <button
                        type="button"
                        onClick={() => confirmDelete(userItem)}
                        className="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete User
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the user "{selectedUser?.first_name} {selectedUser?.last_name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteUser}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementPage;