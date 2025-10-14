import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI, propertiesAPI, licensesAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CitizenStats {
  complaints: {
    total: number;
    pending: number;
    resolved: number;
    overdue: number;
  };
  properties: {
    total: number;
    taxDue: number;
    taxOverdue: number;
  };
  licenses: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
}

interface RecentComplaint {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  created_at: string;
  category: string;
}

interface UpcomingPayment {
  id: string;
  type: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
}

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<CitizenStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || user.role !== 'Citizen') return;
      
      try {
        // Fetch complaints
        const complaintsResponse = await complaintsAPI.getAll({ citizen_id: user.id, limit: 5 });
        const complaints = complaintsResponse.data.complaints || [];
        
        // Fetch properties
        const propertiesResponse = await propertiesAPI.getAll({ owner_id: user.id });
        const properties = propertiesResponse.data.properties || [];
        
        // Fetch licenses
        const licensesResponse = await licensesAPI.getAll({ owner_id: user.id });
        const licenses = licensesResponse.data.licenses || [];
        
        // Calculate stats
        const complaintsStats = {
          total: complaints.length,
          pending: complaints.filter((c: any) => c.status === 'submitted' || c.status === 'in_progress').length,
          resolved: complaints.filter((c: any) => c.status === 'resolved').length,
          overdue: complaints.filter((c: any) => {
            const createdDate = new Date(c.created_at);
            const daysSince = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return daysSince > 7 && (c.status === 'submitted' || c.status === 'in_progress');
          }).length,
        };
        
        const propertiesStats = {
          total: properties.length,
          taxDue: properties.filter((p: any) => p.tax_status === 'pending').length,
          taxOverdue: properties.filter((p: any) => p.tax_status === 'overdue').length,
        };
        
        const licensesStats = {
          total: licenses.length,
          active: licenses.filter((l: any) => l.status === 'approved').length,
          expired: licenses.filter((l: any) => l.status === 'expired').length,
          pending: licenses.filter((l: any) => l.status === 'pending').length,
        };
        
        setStats({
          complaints: complaintsStats,
          properties: propertiesStats,
          licenses: licensesStats,
        });
        
        // Set recent complaints
        setRecentComplaints(complaints.slice(0, 3).map((c: any) => ({
          id: c.id,
          ticket_number: c.ticket_number,
          title: c.title,
          status: c.status,
          created_at: c.created_at,
          category: c.category.name,
        })));
        
        // Prepare upcoming payments
        const payments: UpcomingPayment[] = [];
        
        // Add property taxes
        properties.forEach((p: any) => {
          if (p.tax_status === 'pending' || p.tax_status === 'overdue') {
            payments.push({
              id: p.id,
              type: 'Property Tax',
              description: `Property Tax - ${p.property_id}`,
              amount: p.current_tax_amount || 0,
              due_date: p.due_date || '',
              status: p.tax_status,
            });
          }
        });
        
        // Add license fees
        licenses.forEach((l: any) => {
          if (l.status === 'pending') {
            payments.push({
              id: l.id,
              type: 'License Fee',
              description: `Trade License - ${l.business_name}`,
              amount: l.fee || 0,
              due_date: l.issue_date || '',
              status: 'pending',
            });
          }
        });
        
        // Sort by due date and take first 3
        payments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
        setUpcomingPayments(payments.slice(0, 3));
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const complaintsData = stats ? {
    labels: ['Pending', 'Resolved', 'Overdue'],
    datasets: [
      {
        data: [stats.complaints.pending, stats.complaints.resolved, stats.complaints.overdue],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const paymentsData = stats ? {
    labels: ['Tax Due', 'Tax Overdue', 'License Pending'],
    datasets: [
      {
        label: 'Payments',
        data: [stats.properties.taxDue, stats.properties.taxOverdue, stats.licenses.pending],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (!user || user.role !== 'Citizen') {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Citizen Dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">
          This dashboard is only available to citizen accounts.
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.first_name} {user?.last_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of your municipal services and applications.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/complaints/new"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            File Complaint
          </Link>
          
          <Link
            href="/properties"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <BuildingOfficeIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            View Properties
          </Link>
          
          <Link
            href="/licenses/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Apply for License
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Complaints
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.complaints.total || 0}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-yellow-500">{stats?.complaints.pending || 0} pending</span>
                    <span className="mx-1">•</span>
                    <span className="text-green-500">{stats?.complaints.resolved || 0} resolved</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Properties
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.properties.total || 0}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-yellow-500">{stats?.properties.taxDue || 0} tax due</span>
                    <span className="mx-1">•</span>
                    <span className="text-red-500">{stats?.properties.taxOverdue || 0} overdue</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Trade Licenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.licenses.total || 0}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-green-500">{stats?.licenses.active || 0} active</span>
                    <span className="mx-1">•</span>
                    <span className="text-yellow-500">{stats?.licenses.pending || 0} pending</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Complaint Status Overview
          </h3>
          {complaintsData && <Doughnut data={complaintsData} options={chartOptions} />}
        </div>

        {/* Payments Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Payments Overview
          </h3>
          {paymentsData && <Bar data={paymentsData} options={chartOptions} />}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Complaints</h3>
              <Link href="/complaints" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            {recentComplaints.length === 0 ? (
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't filed any complaints yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {complaint.status === 'resolved' ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : complaint.status === 'in_progress' ? (
                          <ClockIcon className="h-5 w-5 text-blue-500" />
                        ) : (
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
                        <p className="text-xs text-gray-500">
                          {complaint.category} • {complaint.ticket_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Payments</h3>
              <Link href="/properties" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-4">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending payments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any pending payments at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.description}</p>
                        <p className="text-xs text-gray-500">
                          {payment.type} • Due: {new Date(payment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₹{payment.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        payment.status === 'overdue' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;