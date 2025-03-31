
import React from 'react';
import LoginForm from '@/components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="hidden md:block bg-blue-600 text-white p-12">
          <h1 className="text-3xl font-bold mb-6">Hostel Management System</h1>
          <p className="mb-6">Access your hostel dashboard to manage rooms, fees, and more.</p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Manage room bookings
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Pay and track fees
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Submit and resolve complaints
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Access announcements
            </li>
          </ul>
        </div>
        <div className="p-8 flex items-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
