import React from 'react';
import AuthForm from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="w-full flex-1 flex items-center justify-center px-4 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
