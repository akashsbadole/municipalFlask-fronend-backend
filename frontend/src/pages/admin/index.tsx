import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI, propertiesAPI, licensesAPI, citizensAPI } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AdminStats {
  citizens: {
    total: number;
    verified: number;
    newThisMonth: number;
  };
  properties: {
    total: number;
    taxCollected: number;
    taxPending: number;
  };
  complaints: {
    total: number;
    resolved: number;
    pending: number;
    overdue: number;
  };
  licenses: {
    total: number;
    active: number;
    expired: number;
    pending: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    target: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

interface TopPerformer {
  id: string;
  name: string;
  department: string;
  complaintsResolved: number;
  avgResolutionTime: number;
}

const AdminDashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [complaintsByMonth, setComplaintsByMonth] = useState<any>(null);
  const [revenueByMonth, setRevenueByMonth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!hasPermission('dashboard.read')) return;
      
      try {
        // Fetch all data for dashboard
        const [complaintsRes, propertiesRes, licensesRes, citizensRes] = await Promise.all([
          complaintsAPI.getAll({ limit: 1000 }),
          propertiesAPI.getAll({ limit: 1000 }),
          licensesAPI.getAll({ limit: 1000 }),
          citizensAPI.getAll({ limit: 1000 }),
        ]);
        
        const complaints = complaintsRes.data.complaints || [];
        const properties = propertiesRes.data.properties || [];
        const licenses = licensesRes.data.licenses || [];
        const citizens = citizensRes.data.citizens || [];
        
        // Calculate stats
        const statsData: AdminStats = {
          citizens: {
            total: citizens.length,
            verified: citizens.filter((c: any) => c.is_verified).length,
            newThisMonth: citizens.filter((c: any) => {
              const createdDate = new Date(c.created_at);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return createdDate >= thirtyDaysAgo;
            }).length,
          },
          properties: {
            total: properties.length,
            taxCollected: properties.filter((p: any) => p.tax_status === 'paid').length,
            taxPending: properties.filter((p: any) => p.tax_status === 'pending' || p.tax_status === 'overdue').length,
          },
          complaints: {
            total: complaints.length,
            resolved: complaints.filter((c: any) => c.status === 'resolved').length,
            pending: complaints.filter((c: any) => c.status === 'submitted' || c.status === 'in_progress').length,
            overdue: complaints.filter((c: any) => {
              const createdDate = new Date(c.created_at);
              const daysSince = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
              return daysSince > 7 && (c.status === 'submitted' || c.status === 'in_progress');
            }).length,
          },
          licenses: {
            total: licenses.length,
            active: licenses.filter((l: any) => l.status === 'approved').length,
            expired: licenses.filter((l: any) => l.status === 'expired').length,
            pending: licenses.filter((l: any) => l.status === 'pending').length,
          },
          revenue: {
            thisMonth: 2500000, // Simulated data
            lastMonth: 2200000,
            target: 3000000,
          },
        };
        
        setStats(statsData);
        
        // Prepare recent activities
        const activities: RecentActivity[] = [
          ...complaints.slice(0, 5).map((c: any) => ({
            id: c.id,
            type: 'complaint',
            description: `New complaint: ${c.title}`,
            timestamp: c.created_at,
            status: c.status,
          })),
          ...licenses.slice(0, 3).map((l: any) => ({
            id: l.id,
            type: 'license',
            description: `License application: ${l.business_name}`,
            timestamp: l.application_date,
            status: l.status,
          })),
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
        
        setRecentActivities(activities);
        
        // Prepare top performers (simulated data)
        setTopPerformers([
          { id: '1', name: 'Rajesh Kumar', department: 'Sanitation', complaintsResolved: 45, avgResolutionTime: 2.5 },
          { id: '2', name: 'Priya Sharma', department: 'Water Supply', complaintsResolved: 38, avgResolutionTime: 3.2 },
          { id: '3', name: 'Amit Patel', department: 'Streetlights', complaintsResolved: 32, avgResolutionTime: 1.8 },
        ]);
        
        // Prepare monthly data for charts
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const complaintsMonthlyData = months.map(() => Math.floor(Math.random() * 100) + 50);
        const revenueMonthlyData = months.map(() => Math.floor(Math.random() * 500000) + 2000000);
        
        setComplaintsByMonth({
          labels: months,
          datasets: [
            {
              label: 'Complaints',
              data: complaintsMonthlyData,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
          ],
        });
        
        setRevenueByMonth({
          labels: months,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: revenueMonthlyData,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
              tension: 0.4,
            },
          ],
        });
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [hasPermission, dateRange]);

  const complaintsStatusData = stats ? {
    labels: ['Resolved', 'In Progress', 'Pending', 'Overdue'],
    datasets: [
      {
        data: [
          stats.complaints.resolved,
          stats.complaints.pending,
          stats.complaints.pending,
          stats.complaints.overdue,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const licensesStatusData = stats ? {
    labels: ['Active', 'Pending', 'Expired'],
    datasets: [
      {
        data: [stats.licenses.active, stats.licenses.pending, stats.licenses.expired],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
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

  if (!hasPermission('dashboard.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view the admin dashboard.
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

  const revenueGrowth = stats ? 
    ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1) : '0';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Municipal Corporation Management System Overview
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
              <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                Date Range:
              </label>
              <select
                id="dateRange"
                className="ml-2 border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
              Advanced Filters
            </button>
          </div>
        </div>
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
                  <dd className="text-lg font-medium text-gray-900">{stats?.citizens.total.toLocaleString()}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-green-500">{stats?.citizens.verified} verified</span>
                    <span className="mx-1">•</span>
                    <span className="text-blue-500">+{stats?.citizens.newThisMonth} this month</span>
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
                  <dd className="text-lg font-medium text-gray-900">{stats?.properties.total.toLocaleString()}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-green-500">{stats?.properties.taxCollected} tax paid</span>
                    <span className="mx-1">•</span>
                    <span className="text-yellow-500">{stats?.properties.taxPending} pending</span>
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
                    Active Licenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.licenses.active.toLocaleString()}</dd>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span className="text-yellow-500">{stats?.licenses.pending} pending</span>
                    <span className="mx-1">•</span>
                    <span className="text-red-500">{stats?.licenses.expired} expired</span>
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
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">₹{(stats?.revenue.thisMonth || 0).toLocaleString()}</dd>
                  <div className="mt-1 flex items-center text-sm">
                    {parseFloat(revenueGrowth) > 0 ? (
                      <span className="text-green-500 flex items-center">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        {revenueGrowth}%
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center">
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                        {revenueGrowth}%
                      </span>
                    )}
                    <span className="text-gray-500 ml-1">vs last month</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Complaints by Status
          </h3>
          {complaintsStatusData && <Doughnut data={complaintsStatusData} options={chartOptions} />}
        </div>

        {/* Licenses Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Licenses by Status
          </h3>
          {licensesStatusData && <Doughnut data={licensesStatusData} options={chartOptions} />}
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Complaints Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Monthly Complaints Trend
          </h3>
          {complaintsByMonth && <Bar data={complaintsByMonth} options={chartOptions} />}
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Monthly Revenue Trend
          </h3>
          {revenueByMonth && <Line data={revenueByMonth} options={chartOptions} />}
        </div>
      </div>

      {/* Recent Activity and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <Link href="/activities" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {activity.type === 'complaint' ? (
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()} • {activity.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Top Performers</h3>
              <Link href="/employees" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                      <p className="text-xs text-gray-500">{performer.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{performer.complaintsResolved} resolved</p>
                    <p className="text-xs text-gray-500">{performer.avgResolutionTime} days avg</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;