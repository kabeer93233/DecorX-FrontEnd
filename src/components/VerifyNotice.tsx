import React from 'react';
import { Mail } from 'lucide-react';

export const VerifyNotice = () => {

  const isVerified =
    localStorage.getItem(
      'isEmailVerified',
    ) === 'true';

  if (isVerified) return null;

  return (
    <div className="bg-orange-100 border border-orange-300 text-orange-800 px-6 py-4 rounded-2xl mb-6 flex items-start gap-4 shadow-sm">

      <div className="bg-orange-200 p-3 rounded-full">
        <Mail className="h-6 w-6" />
      </div>

      <div>

        <h3 className="font-bold text-lg">
          Verify Your Email
        </h3>

        <p className="text-sm mt-1 leading-relaxed">
          Please verify your email to unlock AI Room Designer,
          Checkout, and premium DecorX features.
        </p>

      </div>

    </div>
  );
};