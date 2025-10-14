import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { waterAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BeakerIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface WaterConnection {
  id: string;
  connection_number: string;
  consumer_name: string;
  property_address: string;
  ward: string;
  connection_type: string;
  connection_status: string;
  application_date: string;
  connection_date?: string;
  meter_number?: string;
  meter_status: string;
  last_reading_date?: string;
  last_reading_value?: number;
  current_bill_amount?: number;
  last_payment_date?: string;
  outstanding_amount?: number;
}

interface FilterOptions {
  status: string;
  connection_type: string;
  ward: string;
  date_from: string;
  date_to: string;
}

const WaterConnectionsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [connections, setConnections] = useState<WaterConnection[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<WaterConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    connection_type: '',
    ward: '',
    date_from: '',
    date_to: '',
  });

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const connectionTypes = [
    { value: 'domestic', label: 'Domestic' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'institutional', label: 'Institutional' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'disconnected', label: 'Disconnected' },
  ];

  useEffect(() => {
    fetchConnections();
  }, [currentPage, filters]);

  useEffect(() => {
    applyFilters();
  }, [connections, searchTerm]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
      };
      
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params];
        }
      });
      
      // If user is a citizen, only show their connections
      if (user?.role === 'Citizen') {
        params.consumer_id = user.id;
      }
      
      const response = await waterAPI.getConnections(params);
      setConnections(response.data.connections);
      setTotalPages(response.data.total_pages);
      setTotalCount(response.data.total_count);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch water connections';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...connections];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(connection =>
        connection.connection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.consumer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (connection.meter_number && connection.meter_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredConnections(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      connection_type: '',
      ward: '',
      date_from: '',
      date_to: '',
    });
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getMeterStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'faulty':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_installed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!hasPermission('water.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view water connections.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Water Connections</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage water supply connections and billing
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search by connection number, consumer name, or meter number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filters
              {(filters.status || filters.connection_type || filters.ward || filters.date_from || filters.date_to) && (
                <span className="ml-1 bg-primary-100 text-primary-800 text-xs font-medium px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </button>
            
            {hasPermission('water.create') && (
              <Link
                href="/water/connections/new"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New Connection
              </Link>
            )}
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700 mb-1">
                  Connection Type
                </label>
                <select
                  id="connection_type"
                  name="connection_type"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.connection_type}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  {connectionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                  Ward
                </label>
                <select
                  id="ward"
                  name="ward"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.ward}
                  onChange={handleFilterChange}
                >
                  <option value="">All Wards</option>
                  {wards.map(ward => (
                    <option key={ward} value={ward}>{ward}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  id="date_from"
                  name="date_from"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div>
                <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  id="date_to"
                  name="date_to"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Connections Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredConnections.length > 0 ? (
          <>
            <ul className="divide-y divide-gray-200">
              {filteredConnections.map((connection) => (
                <li key={connection.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {connection.connection_number}
                          </p>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(connection.connection_status)}`}>
                            {connection.connection_status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <UserIcon className="h-4 w-4 mr-1" />
                              {connection.consumer_name}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {connection.property_address} • {connection.ward}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <BeakerIcon className="h-4 w-4 mr-1" />
                              {connection.connection_type}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Applied: {formatDate(connection.application_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex space-x-2 ml-5">
                        <Link
                          href={`/water/connections/${connection.id}`}
                          className="inline-flex items-center p-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        
                        {connection.connection_status === 'active' && connection.outstanding_amount && connection.outstanding_amount > 0 && (
                          <Link
                            href={`/water/connections/${connection.id}/pay`}
                            className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <CreditCardIcon className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        {connection.meter_number && (
                          <p className="text-sm text-gray-500">
                            Meter: {connection.meter_number}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getMeterStatusColor(connection.meter_status)}`}>
                              {connection.meter_status.replace('_', ' ')}
                            </span>
                          </p>
                        )}
                        {connection.last_reading_date && (
                          <p className="mt-1 sm:mt-0 sm:ml-6 text-sm text-gray-500">
                            Last Reading: {connection.last_reading_value} KL ({formatDate(connection.last_reading_date)})
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        {connection.current_bill_amount && (
                          <p>
                            Current Bill: ₹{connection.current_bill_amount.toLocaleString()}
                          </p>
                        )}
                        {connection.outstanding_amount && (
                          <p className={`ml-4 ${connection.outstanding_amount > 0 ? 'text-red-600 font-medium' : ''}`}>
                            Outstanding: ₹{connection.outstanding_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No water connections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filters.status || filters.connection_type || filters.ward
                ? 'Try adjusting your search or filters'
                : 'Get started by applying for a new water connection'}
            </p>
            {hasPermission('water.create') && !searchTerm && !filters.status && !filters.connection_type && !filters.ward && (
              <div className="mt-6">
                <Link
                  href="/water/connections/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Connection
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterConnectionsPage;