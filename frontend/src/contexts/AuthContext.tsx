import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  updateProfile: (userData: any) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('access_token');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, clear it
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ username, password });
      const { access_token, refresh_token, user } = response.data;
      
      // Store tokens in cookies
      Cookies.set('access_token', access_token, { expires: 1 }); // 1 day
      Cookies.set('refresh_token', refresh_token, { expires: 30 }); // 30 days
      
      setUser(user);
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout fails, clear local data
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/auth/login');
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return false;
    }
  };

  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      const response = await authAPI.updateProfile(userData);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    // This is a simplified permission check
    // In a real app, you would check against the user's role permissions
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.role === 'Super Admin') return true;
    
    // Municipal Commissioner has most permissions
    if (user.role === 'Municipal Commissioner') {
      const restrictedPermissions = ['user.create', 'user.delete'];
      return !restrictedPermissions.includes(permission);
    }
    
    // Department Head can read and update most things
    if (user.role === 'Department Head') {
      const allowedPermissions = [
        'user.read', 'user.update',
        'citizen.read', 'citizen.update',
        'property.read', 'property.update',
        'complaint.read', 'complaint.update',
        'license.read', 'license.update',
        'building.read', 'building.update',
        'waste.read', 'waste.update',
        'water.read', 'water.update',
        'streetlight.read', 'streetlight.update',
        'health.read', 'health.update',
        'finance.read', 'finance.update',
        'hr.read', 'hr.update',
        'public_works.read', 'public_works.update',
        'egov.read', 'egov.update',
        'disaster.read', 'disaster.update',
        'reports.read', 'reports.create'
      ];
      return allowedPermissions.includes(permission);
    }
    
    // Field Officer can read and update specific modules
    if (user.role === 'Field Officer') {
      const allowedPermissions = [
        'citizen.read',
        'complaint.create', 'complaint.read', 'complaint.update',
        'property.read',
        'license.read',
        'building.read',
        'waste.read', 'waste.update',
        'water.read', 'water.update',
        'streetlight.read', 'streetlight.update',
        'health.read', 'health.update',
        'public_works.read'
      ];
      return allowedPermissions.includes(permission);
    }
    
    // Citizen has limited permissions
    if (user.role === 'Citizen') {
      const allowedPermissions = [
        'complaint.create', 'complaint.read',
        'property.read',
        'license.create', 'license.read',
        'building.create', 'building.read',
        'water.read',
        'egov.read',
        'reports.read'
      ];
      return allowedPermissions.includes(permission);
    }
    
    return false;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};