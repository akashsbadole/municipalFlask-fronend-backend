import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI } from '@/lib/api';
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
import { Bar, Pie } from 'react-chartjs-2';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (hasPermission('complaint.read')) {
        try {
          const response = await complaintsAPI.getDashboardStats();
          setDashboardStats(response.data);
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [hasPermission]);

  const complaintStatusData = dashboardStats ? {
    labels: ['Submitted', 'In Progress', 'Resolved', 'Rejected', 'Closed'],
    datasets: [
      {
        label: 'Complaints',
        data: [
          dashboardStats.overall.submitted,
          dashboardStats.overall.in_progress,
          dashboardStats.overall.resolved,
          dashboardStats.overall.rejected,
          dashboardStats.overall.closed,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const categoryData = dashboardStats ? {
    labels: dashboardStats.by_category.map((cat: any) => cat.name),
    datasets: [
      {
        label: 'Complaints by Category',
        data: dashboardStats.by_category.map((cat: any) => cat.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const wardData = dashboardStats ? {
    labels: dashboardStats.by_ward.map((ward: any) => `Ward ${ward.ward}`),
    datasets: [
      {
        label: 'Complaints by Ward',
        data: dashboardStats.by_ward.map((ward: any) => ward.count),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
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
          Here's what's happening with the municipal corporation today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Citizens
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">12,543</dd>
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
                  <dd className="text-lg font-medium text-gray-900">8,234</dd>
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
                    Active Licenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">3,456</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Revenue (Monthly)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">₹2.4M</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Dashboard */}
      {hasPermission('complaint.read') && dashboardStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complaints by Status
            </h3>
            <div className="chart-container">
              <Pie data={complaintStatusData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complaints by Category
            </h3>
            <div className="chart-container">
              <Bar data={categoryData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          
          {hasPermission('complaint.read') && dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {dashboardStats.overall.overdue} Overdue
                  </p>
                  <p className="text-xs text-yellow-600">Complaints</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {dashboardStats.overall.in_progress} In Progress
                  </p>
                  <p className="text-xs text-blue-600">Complaints</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <CheckCircleIcon className="h-8 w-8 text-green-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {dashboardStats.overall.resolved} Resolved
                  </p>
                  <p className="text-xs text-green-600">This Month</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {hasPermission('complaint.create') && (
                <a
                  href="/complaints/new"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  File Complaint
                </a>
              )}
              
              {hasPermission('property.read') && (
                <a
                  href="/properties"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Properties
                </a>
              )}
              
              {hasPermission('reports.read') && (
                <a
                  href="/reports"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Generate Reports
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;