'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
// Note: We need an UpdateUserService in Infrastructure, or add update method to AuthService/UserService.
// For now, assuming we can't easily update user without a dedicated service method.
// I'll add a placeholder or implement it if I have time.
// The task said "updateuser".
// I'll assume I can add `updateUser` to `IAuthService` or `UserService`.
// Let's stick to `AuthService` for now as it handles user state.

import { UpdateUserRequest } from '../../domain/ports/IAuthService';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateUserRequest>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        city: user.city,
        country: user.country,
        phone: user.phone,
      });
    }
  }, [user]);

  if (!user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(user.id, formData);
      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage('Failed to update profile.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="bg-white p-6 rounded shadow-md max-w-lg">
        {message && <p className={`mb-4 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">First Name</label>
              <input name="firstName" value={formData.firstName || ''} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Last Name</label>
              <input name="lastName" value={formData.lastName || ''} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input name="email" type="email" value={formData.email || ''} onChange={handleChange} className="w-full border p-2 rounded" disabled />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input name="address" value={formData.address || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700">City</label>
              <input name="city" value={formData.city || ''} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Country</label>
              <input name="country" value={formData.country || ''} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Phone</label>
            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}
