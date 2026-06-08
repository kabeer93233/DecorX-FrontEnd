import React, { useState } from 'react';

import {
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import { SectionHeading }
from '../components/ui/SectionHeading';

import custom_axios
from '../axios/axios';

import { toast }
from 'sonner';

export const Contact = () => {

  const [formData, setFormData] =
    useState({

      firstName: '',
      lastName: '',
      email: '',
      subject: 'General Inquiry',
      message: '',
    });

  const [loading, setLoading] =
    useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >,
  ) => {

    setFormData({

      ...formData,

      [e.target.name]:
      e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {

    e.preventDefault();

    try {

      setLoading(true);

      await custom_axios.post(

        '/contact',

        formData,
      );

      toast.success(
        'Message sent successfully',
      );

      setFormData({

        firstName: '',
        lastName: '',
        email: '',
        subject: 'General Inquiry',
        message: '',
      });

    } catch (error) {

      toast.error(
        'Failed to send message',
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="text-center mb-16">

        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">

          Contact Us

        </h1>

        <p className="text-xl text-stone-600 max-w-2xl mx-auto">

          Have a question or need help? We'd love to hear from you.

        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

        {/* Contact Info */}

        <div>

          <SectionHeading title="Get In Touch" />

          <p className="text-stone-600 mb-8 leading-relaxed">

            Whether you're looking for more information,
            or you'd like to let us know how we did,
            you'll find easy ways to contact us right here.

          </p>

          <div className="space-y-6 mb-12">

            <div className="flex items-start space-x-4">

              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0">

                <MapPin className="h-6 w-6" />

              </div>

              <div>

                <h4 className="font-bold text-stone-900 text-lg">

                  Visit Us

                </h4>

                <p className="text-stone-600">

                  123 Furniture Street,
                  Design City,
                  DC 45678

                </p>

              </div>

            </div>

            <div className="flex items-start space-x-4">

              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0">

                <Phone className="h-6 w-6" />

              </div>

              <div>

                <h4 className="font-bold text-stone-900 text-lg">

                  Call Us

                </h4>

                <p className="text-stone-600">

                  +1 (555) 123-4567

                </p>

                <p className="text-stone-500 text-sm">

                  Mon - Fri, 9am - 6pm

                </p>

              </div>

            </div>

            <div className="flex items-start space-x-4">

              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 flex-shrink-0">

                <Mail className="h-6 w-6" />

              </div>

              <div>

                <h4 className="font-bold text-stone-900 text-lg">

                  Email Us

                </h4>

                <p className="text-stone-600">

                  info@decorx.com

                </p>

              </div>

            </div>

          </div>

          {/* Map */}

          <div className="w-full h-64 bg-stone-200 rounded-2xl overflow-hidden relative">

            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000"
              alt="Map"
              className="w-full h-full object-cover opacity-60"
            />

            <div className="absolute inset-0 flex items-center justify-center">

              <span className="bg-white/80 px-4 py-2 rounded-full font-bold text-stone-900">

                Map Integration Placeholder

              </span>

            </div>

          </div>

        </div>

        {/* Form */}

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-stone-100">

          <h3 className="text-2xl font-bold text-stone-900 mb-6">

            Send us a Message

          </h3>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div>

                <label className="block text-sm font-medium text-stone-700 mb-2">

                  First Name

                </label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-stone-700 mb-2">

                  Last Name

                </label>

                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
                />

              </div>

            </div>

            <div>

              <label className="block text-sm font-medium text-stone-700 mb-2">

                Email Address

              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
              />

            </div>

            <div>

              <label className="block text-sm font-medium text-stone-700 mb-2">

                Subject

              </label>

              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
              >

                <option>
                  General Inquiry
                </option>

                <option>
                  Order Support
                </option>

                <option>
                  Returns & Exchanges
                </option>

                <option>
                  Design Consultation
                </option>

              </select>

            </div>

            <div>

              <label className="block text-sm font-medium text-stone-700 mb-2">

                Message

              </label>

              <textarea
                rows={5}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                required
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-stone-50"
              />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-xl hover:bg-orange-500 transition-colors shadow-lg disabled:opacity-50"
            >

              {
                loading
                ? 'Sending...'
                : 'Send Message'
              }

            </button>

          </form>

        </div>

      </div>

    </div>
  );
};