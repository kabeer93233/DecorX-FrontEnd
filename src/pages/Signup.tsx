import React, { useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import custom_axios from '../axios/axios';

import { ApiConstants } from '../app/API/ApiConstants';

import { toast } from 'react-toastify';

export const Signup = () => {

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const fullName =
    React.useRef<HTMLInputElement>(null);

  const email =
    React.useRef<HTMLInputElement>(null);

  const password =
    React.useRef<HTMLInputElement>(null);

  const register = async () => {

    if (loading) return;

    try {

      setLoading(true);

      const response =
      await custom_axios.post(

        ApiConstants.USER.SIGN_UP,

        {
          fullName:
          fullName.current?.value,

          email:
          email.current?.value,

          password:
          password.current?.value,
        },
      );

      console.log(
        'SUCCESS RESPONSE:',
        response,
      );

      toast.success(
        response.data.message,
      );

      setTimeout(() => {

        navigate('/login');

      }, 2000);

    } catch (error: any) {

      console.log(
        'FULL ERROR:',
        error,
      );

      console.log(
        'ERROR RESPONSE:',
        error.response,
      );

      toast.error(
        error.response?.data?.message
        || error.message
        || 'Something went wrong',
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-stone-100">

        <div className="text-center">

          <h2 className="mt-6 text-3xl font-extrabold text-stone-900">
            Create Account
          </h2>

          <p className="mt-2 text-sm text-stone-600">
            Join us to start shopping
          </p>

        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={(e) => {

            e.preventDefault();

            register();
          }}
        >

          <div className="space-y-4">

            {/* Full Name */}

            <div>

              <label
                htmlFor="name"
                className="sr-only"
              >
                Full Name
              </label>

              <input
                ref={fullName}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-300 placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-stone-50"
                placeholder="Full Name"
              />

            </div>

            {/* Email */}

            <div>

              <label
                htmlFor="email-address"
                className="sr-only"
              >
                Email address
              </label>

              <input
                ref={email}
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-300 placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-stone-50"
                placeholder="Email address"
              />

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="sr-only"
              >
                Password
              </label>

              <input
                ref={password}
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-300 placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-stone-50"
                placeholder="Password"
              />

            </div>

          </div>

          {/* Button */}

          <div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-stone-900 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >

              {loading
                ? 'Creating Account...'
                : 'Sign up'}

            </button>

          </div>

        </form>

        {/* Login */}

        <div className="text-center mt-4">

          <p className="text-sm text-stone-600">

            Already have an account?{' '}

            <Link
              to="/login"
              className="font-medium text-orange-600 hover:text-orange-500"
            >
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
};