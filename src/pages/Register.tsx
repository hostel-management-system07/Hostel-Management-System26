
import React from 'react';
import RegisterForm from '@/components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="hidden md:block bg-blue-600 text-white p-12">
          <h1 className="text-3xl font-bold mb-6">Join Our Hostel Community</h1>
          <p className="mb-6">Create an account to access the Hostel Management System.</p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Secure authentication
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Role-based access control
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Personalized experience
            </li>
            <li className="flex items-center">
              <span className="mr-2 text-blue-200">✓</span>
              Real-time updates
            </li>
          </ul>
        </div>
        <div className="p-8 flex items-center">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
