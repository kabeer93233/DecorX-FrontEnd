import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">
              Decor<span className="text-orange-500">X</span>
            </h2>
            <p className="text-stone-600 mb-6 leading-relaxed">
              We create stylish and modern furniture that is both functional and beautiful. Transform your home into a haven of comfort.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-stone-400 hover:text-orange-500 transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-stone-400 hover:text-orange-500 transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-stone-400 hover:text-orange-500 transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-stone-400 hover:text-orange-500 transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-stone-600 hover:text-orange-500 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-stone-600 hover:text-orange-500 transition-colors">Contact Us</Link></li>
              <li><Link to="/blog" className="text-stone-600 hover:text-orange-500 transition-colors">Blog</Link></li>
              <li><Link to="/privacy" className="text-stone-600 hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-stone-600 hover:text-orange-500 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Services</h3>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-stone-600 hover:text-orange-500 transition-colors">My Account</Link></li>
              <li><Link to="/cart" className="text-stone-600 hover:text-orange-500 transition-colors">Order Tracking</Link></li>
              <li><Link to="/wishlist" className="text-stone-600 hover:text-orange-500 transition-colors">Wishlist</Link></li>
              <li><Link to="/shop" className="text-stone-600 hover:text-orange-500 transition-colors">Shopping Cart</Link></li>
              <li><Link to="/returns" className="text-stone-600 hover:text-orange-500 transition-colors">Returns</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Contact Info</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-stone-600">
                <MapPin className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>123 Furniture Street, Design City, DC 45678</span>
              </li>
              <li className="flex items-center space-x-3 text-stone-600">
                <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-3 text-stone-600">
                <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <span>info@decorx.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-stone-500 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} DecorX. All rights reserved.
          </p>
          <div className="flex space-x-4">
             {/* Payment icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  );
};
