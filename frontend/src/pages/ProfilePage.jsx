// EventMax Profile Page
// User profile management

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Mail,
  Phone,
  Camera,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Avatar from '../components/atoms/Avatar';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { cn } from '../utils/cn';

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (data) => {
      updateUser(data.user);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Failed to update profile' });
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
    setErrors({});
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <Avatar
                    src={user?.avatar}
                    name={user?.name || 'User'}
                    size="xl"
                  />
                  <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-dark transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">
                  {user?.name || 'User'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    )}
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Personal Information
                  </h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {successMessage}
                  </div>
                )}

                {/* Error Message */}
                {errors.submit && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {errors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      icon={<User className="w-5 h-5" />}
                      error={errors.name}
                      disabled={!isEditing}
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      icon={<Mail className="w-5 h-5" />}
                      error={errors.email}
                      disabled={!isEditing}
                    />

                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                      icon={<Phone className="w-5 h-5" />}
                      error={errors.phone}
                      disabled={!isEditing}
                    />
                  </div>

                  {isEditing && (
                    <div className="flex gap-4 mt-6">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={updateMutation.isPending}
                      >
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  {[
                    { id: 'email', label: 'Email Notifications', description: 'Receive booking confirmations and updates via email' },
                    { id: 'push', label: 'Push Notifications', description: 'Get notified about events and offers on your device' },
                    { id: 'sms', label: 'SMS Notifications', description: 'Receive text messages for important updates' },
                    { id: 'marketing', label: 'Marketing Communications', description: 'Get news about events and special offers' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications[item.id]}
                          onChange={(e) => setNotifications(prev => ({
                            ...prev,
                            [item.id]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>

                <Button variant="primary" className="mt-6">
                  Save Preferences
                </Button>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Change Password
                  </h2>
                  <form className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Confirm new password"
                    />
                    <Button variant="primary">
                      Update Password
                    </Button>
                  </form>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Payment Methods
                </h2>
                
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    No payment methods saved yet
                  </p>
                  <Button variant="primary">
                    Add Payment Method
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
