import { useEffect, useState } from 'react';

import {
  useSearchParams,
  useNavigate,
} from 'react-router-dom';

import custom_axios
from '../axios/axios';

export const VerifyEmail =
() => {

  const [searchParams] =
  useSearchParams();

  const navigate =
  useNavigate();

  const [status, setStatus] =
  useState<
    'loading' |
    'success' |
    'error'
  >('loading');

  useEffect(() => {

    const token =
    searchParams.get(
      'token',
    );

    if (!token) {

      setStatus('error');

      return;
    }

    custom_axios.get(

      `/auth/verify-email?token=${token}`,

    )

    .then(() => {

      setStatus(
        'success',
      );

      setTimeout(() => {
        const storage =
          localStorage.getItem(
            "access_token"
          )
            ? localStorage
            : sessionStorage;

        storage.setItem(
          'isEmailVerified',
          'true',
        );
        navigate(
          '/login',
        );

      }, 3000);
    })

    .catch(() => {

      setStatus(
        'error',
      );
    });

  }, []);

  // SUCCESS UI

  if (status === 'success') {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">

        <div className="bg-white shadow-2xl rounded-3xl p-10 flex flex-col items-center text-center max-w-md w-full">

          {/* Success Icon */}

          <div className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center animate-pulse shadow-lg">

            <span className="text-6xl">
              ✅
            </span>

          </div>

          {/* Heading */}

          <h1 className="text-4xl font-extrabold text-gray-800 mt-8">

            Email Verified!

          </h1>

          {/* Description */}

          <p className="text-gray-500 mt-4 leading-relaxed">

            Welcome to DecorX 🎉

            <br />

            Your account has been successfully verified.
            You can now login and start exploring beautiful interior inspirations.

          </p>

          {/* Dots */}

          <div className="flex gap-2 mt-6">

            <span className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></span>

            <span className="w-3 h-3 bg-green-400 rounded-full animate-bounce delay-150"></span>

            <span className="w-3 h-3 bg-green-300 rounded-full animate-bounce delay-300"></span>

          </div>

          <p className="text-sm text-gray-400 mt-5">

            Redirecting to login...

          </p>

        </div>

      </div>
    );
  }

  // ERROR UI

  if (status === 'error') {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 px-4">

        <div className="bg-white shadow-2xl rounded-3xl p-10 flex flex-col items-center text-center max-w-md w-full">

          {/* Error Icon */}

          <div className="w-28 h-28 rounded-full bg-red-100 flex items-center justify-center shadow-lg">

            <span className="text-6xl">
              ❌
            </span>

          </div>

          {/* Heading */}

          <h1 className="text-4xl font-extrabold text-gray-800 mt-8">

            Verification Failed

          </h1>

          {/* Description */}

          <p className="text-gray-500 mt-4 leading-relaxed">

            This verification link is invalid or expired.

            <br />

            Please try registering again or request a new verification email.

          </p>

          {/* Button */}

          <button

            onClick={() =>
              navigate('/signup')
            }

            className="mt-8 bg-red-500 hover:bg-red-600 transition-all duration-300 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
          >

            Go To Register

          </button>

        </div>

      </div>
    );
  }

  // LOADING UI

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">

      <div className="bg-white shadow-2xl rounded-3xl p-10 flex flex-col items-center gap-6 w-full max-w-md">

        {/* Animated Loader */}

        <div className="relative">

          <div className="w-28 h-28 border-4 border-orange-200 rounded-full"></div>

          <div className="w-28 h-28 border-4 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>

          <div className="absolute inset-0 flex items-center justify-center">

            <span className="text-4xl">
              🏠
            </span>

          </div>

        </div>

        {/* Text */}

        <div className="text-center">

          <h1 className="text-4xl font-extrabold text-gray-800">

            Verifying Account

          </h1>

          <p className="text-gray-500 mt-4 text-sm leading-relaxed">

            Please wait while DecorX securely verifies your email
            and prepares your personalized interior experience...

          </p>

        </div>

        {/* Animated Dots */}

        <div className="flex gap-2">

          <span className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></span>

          <span className="w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-150"></span>

          <span className="w-3 h-3 bg-orange-300 rounded-full animate-bounce delay-300"></span>

        </div>

      </div>

    </div>
  );
};