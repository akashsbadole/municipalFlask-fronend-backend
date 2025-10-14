import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  TruckIcon,
  FireIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, hasPermission } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: user?.role === 'Citizen' ? '/citizen' : (user?.role === 'Super Admin' || user?.role === 'Municipal Commissioner' || user?.role === 'Department Head') ? '/admin' : '/dashboard',
      icon: HomeIcon,
      permission: null, // All authenticated users
    },
    {
      name: 'Citizens',
      href: '/citizens',
      icon: UserGroupIcon,
      permission: 'citizen.read',
    },
    {
      name: 'Properties',
      href: '/properties',
      icon: BuildingOfficeIcon,
      permission: 'property.read',
    },
    {
      name: 'Complaints',
      href: '/complaints',
      icon: DocumentTextIcon,
      permission: 'complaint.read',
    },
    {
      name: 'Licenses',
      href: '/licenses',
      icon: ClipboardDocumentListIcon,
      permission: 'license.read',
    },
    {
      name: 'Building Plans',
      href: '/buildings',
      icon: BuildingOfficeIcon,
      permission: 'building.read',
    },
    {
      name: 'Waste Management',
      href: '/waste',
      icon: TruckIcon,
      permission: 'waste.read',
    },
    {
      name: 'Water Supply',
      href: '/water',
      icon: FireIcon,
      permission: 'water.read',
    },
    {
      name: 'Streetlights',
      href: '/streetlights',
      icon: LightBulbIcon,
      permission: 'streetlight.read',
    },
    {
      name: 'Health & Sanitation',
      href: '/health',
      icon: FireIcon,
      permission: 'health.read',
    },
    {
      name: 'Finance',
      href: '/finance',
      icon: CurrencyDollarIcon,
      permission: 'finance.read',
    },
    {
      name: 'HR & Payroll',
      href: '/hr',
      icon: BriefcaseIcon,
      permission: 'hr.read',
    },
    {
      name: 'Public Works',
      href: '/public-works',
      icon: BuildingOfficeIcon,
      permission: 'public_works.read',
    },
    {
      name: 'E-Governance',
      href: '/egov',
      icon: DocumentTextIcon,
      permission: 'egov.read',
    },
    {
      name: 'Disaster Management',
      href: '/disaster',
      icon: FireIcon,
      permission: 'disaster.read',
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: DocumentTextIcon,
      permission: 'reports.read',
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: UserGroupIcon,
      permission: 'user.read',
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(href);
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-gray-600 transition-opacity ${sidebarOpen ? 'opacity-75' : 'opacity-0'}`}
             onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex flex-col max-w-xs w-full bg-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Municipal Corp</h1>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`${
                    isActive(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">Municipal Corporation</h1>
          </div>
          
          <nav className="flex-1 px-2 mt-5 space-y-1">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-5 w-5`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex justify-between items-center px-4 md:px-6">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <BellIcon className="h-6 w-6" />
              </button>
              
              {/* User dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </button>
                
                {/* User menu dropdown - simplified for now */}
                <div className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                      <div className="text-gray-500">{user?.role}</div>
                    </div>
                    
                    <Link
                      href={user?.role === 'Citizen' ? '/citizen/profile' : '/profile'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;