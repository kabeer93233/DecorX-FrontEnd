import React from 'react';
import { MapPin, User, Phone, Home } from 'lucide-react';

interface ShippingFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
}

interface ShippingFormProps {
  formData: ShippingFormData;
  onChange: (data: ShippingFormData) => void;
}

export const ShippingForm: React.FC<ShippingFormProps> = ({ formData, onChange }) => {
  const handleChange = (field: keyof ShippingFormData, value: string) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6 bg-white p-8 rounded-3xl border border-stone-200">
      <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
        <MapPin className="h-6 w-6 text-orange-500" />
        Shipping Information
      </h2>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              autoComplete='name'
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="John Doe"
              required
              className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Email Address *
          </label>

          <input
            type="email"
            autoComplete='email'
            value={formData.email}
            onChange={(e) =>
              handleChange(
                'email',
                e.target.value
              )
            }
            placeholder="john@example.com"
            required
            className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
              className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Street Address *
          </label>
          <div className="relative">
            <Home className="absolute left-4 top-4 h-5 w-5 text-stone-400" />
            <textarea
              value={formData.address}
              autoComplete='street-address'
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main Street, Apt 4B"
              required
              rows={2}
              className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* City and Postal Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="New York"
              required
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Postal Code *
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="10001"
              required
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
