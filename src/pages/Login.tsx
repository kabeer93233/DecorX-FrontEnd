import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import custom_axios from '../axios/axios';
import { ApiConstants } from '../app/API/ApiConstants';
import { toast } from 'react-toastify';
import { useShop } from '../context/ShopContext';

export const Login = () => {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = React.useState(false);

  const storage = rememberMe ? localStorage : sessionStorage;
  const {
    fetchCart,
    fetchWishlist,
  } = useShop();

  const email =
    React.useRef<HTMLInputElement>(null);

  const password =
    React.useRef<HTMLInputElement>(null);

  const login = async () => {

    try {

      const response =
        await custom_axios.post(
          ApiConstants.LOGIN,
          {
            email: email.current?.value,
            password: password.current?.value,
          },
        );
        console.log(response.data);
        storage.setItem(
          "access_token",
          response.data.access_token,
        );

        storage.setItem(
          "refresh_token",
          response.data.refresh_token,
        );

        storage.setItem(
          "role",
          response.data.user.role,
        );

        storage.setItem(
          "isEmailVerified",
          String(
            response.data.user.isEmailVerified
          ),
        );

        storage.setItem(
          "fullName",
          response.data.user.fullName,
        );

        toast.success(
          "Sign In Successful!",
        );
        await fetchCart();
        await fetchWishlist();
        window.location.href = "/";

      } catch (error: any) {

      toast.warning(
        error.response?.data?.message
        || "Login failed",
      );
    }
  };
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-stone-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-stone-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to access your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
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
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                ref={password}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-stone-300 placeholder-stone-500 text-stone-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-stone-50"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-stone-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-stone-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              onClick={login}
              type="button"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-stone-900 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4">
           <p className="text-sm text-stone-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-orange-600 hover:text-orange-500">
                 Sign up
              </Link>
           </p>
        </div>
      </div>
    </div>
  );
};
