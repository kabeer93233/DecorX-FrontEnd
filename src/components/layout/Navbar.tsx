import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  User,
  Search,
  Menu,
  X
} from 'lucide-react';
import {
  getAccessToken,
  getRole,
} from '../../utils/auth';

import { useShop } from '../../context/ShopContext';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import custom_axios from '../../axios/axios';

export const Navbar = () => {

  const { cartCount, wishlist } = useShop();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const navigate = useNavigate();
  const token =
    getAccessToken();

  const role =
    getRole();

  const logout = async () => {

    try {

      const refreshToken =
      localStorage.getItem(
        "refresh_token",
      ) ||

      sessionStorage.getItem(
        "refresh_token",
      );

      await custom_axios.post(
        "/auth/logout",
        {
          refreshToken,
        },
      );

      localStorage.clear();
      sessionStorage.clear();

      navigate("/login");

      window.location.reload();

    } catch (error) {

      console.log(error);
    }
  };

  const toggleMenu = () =>
    setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Shop', path: '/shop' },
    { name: 'AI Decor', path: '/ai-designer' },

    ...(token
      ? [
          { name: 'Contact', path: '/contact' },
          { name: 'Profile', path: '/profile' },

          ...(role === 'admin'
            ? [
                {
                  name: 'Admin',
                  path: '/admin',
                },
              ]
            : []),
        ]
      : []),
  ];

  return (

    <nav className="sticky top-0 z-50 w-full bg-[#FFF8F0]/80 backdrop-blur-md border-b border-stone-200">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex justify-between items-center h-20">

          {/* Logo */}

          <Link
            to="/"
            className="flex-shrink-0 flex items-center"
          >
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Decor
              <span className="text-orange-500">
                X
              </span>
            </h1>
          </Link>

          {/* Desktop Navigation */}

          <div className="hidden md:flex items-center space-x-8">

            {navLinks.map((link) => (

              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  clsx(
                    'text-sm font-medium transition-colors duration-200 hover:text-orange-500',
                    isActive
                      ? 'text-orange-500'
                      : 'text-stone-600'
                  )
                }
              >
                {link.name}
              </NavLink>

            ))}

          </div>

          {/* Desktop Icons */}

          <div className="hidden md:flex items-center space-x-6">

            <button className="text-stone-600 hover:text-orange-500 transition-colors">
              <Search className="h-5 w-5" />
            </button>

            {token && (

              <Link
                to="/wishlist"
                className="relative text-stone-600 hover:text-orange-500 transition-colors"
              >

                <Heart className="h-5 w-5" />

                {wishlist.length > 0 && (

                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">

                    {wishlist.length}

                  </span>

                )}

              </Link>

            )}

            {token && (

              <Link
                to="/cart"
                className="relative text-stone-600 hover:text-orange-500 transition-colors"
              >

                <ShoppingCart className="h-5 w-5" />

                {cartCount > 0 && (

                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">

                    {cartCount}

                  </span>

                )}

              </Link>

            )}

            {token ? (

              <button
                onClick={logout}
                className="text-stone-600 hover:text-orange-500 transition-colors"
              >
                Logout
              </button>

            ) : (

              <Link
                to="/login"
                className="text-stone-600 hover:text-orange-500 transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>

            )}

          </div>

          {/* Mobile Menu Button */}

          <div className="flex md:hidden items-center space-x-4">

            {token && (

              <Link
                to="/cart"
                className="relative text-stone-600 hover:text-orange-500 transition-colors"
              >

                <ShoppingCart className="h-5 w-5" />

                {cartCount > 0 && (

                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">

                    {cartCount}

                  </span>

                )}

              </Link>

            )}

            <button
              onClick={toggleMenu}
              className="text-stone-600 hover:text-orange-500 focus:outline-none"
            >

              {isMenuOpen
                ? <X className="h-6 w-6" />
                : <Menu className="h-6 w-6" />
              }

            </button>

          </div>

        </div>

      </div>

      {/* Mobile Menu */}

      <AnimatePresence>

        {isMenuOpen && (

          <motion.div
            initial={{
              opacity: 0,
              height: 0
            }}
            animate={{
              opacity: 1,
              height: 'auto'
            }}
            exit={{
              opacity: 0,
              height: 0
            }}
            className="md:hidden bg-white border-t border-stone-200"
          >

            <div className="px-4 pt-2 pb-6 space-y-1">

              {navLinks.map((link) => (

                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() =>
                    setIsMenuOpen(false)
                  }
                  className="block px-3 py-3 text-base font-medium text-stone-700 hover:text-orange-500 hover:bg-orange-50 rounded-md"
                >

                  {link.name}

                </Link>

              ))}

              <div className="border-t border-stone-100 my-2 pt-2 flex space-x-4 px-3">

                {token && (

                  <Link
                    to="/wishlist"
                    onClick={() =>
                      setIsMenuOpen(false)
                    }
                    className="flex items-center space-x-2 text-stone-600"
                  >

                    <Heart className="h-5 w-5" />

                    <span>
                      Wishlist ({wishlist.length})
                    </span>

                  </Link>

                )}

                {!token && (

                  <Link
                    to="/login"
                    onClick={() =>
                      setIsMenuOpen(false)
                    }
                    className="flex items-center space-x-2 text-stone-600"
                  >

                    <User className="h-5 w-5" />

                    <span>Account</span>

                  </Link>

                )}

              </div>

            </div>

          </motion.div>

        )}

      </AnimatePresence>

    </nav>
  );
};