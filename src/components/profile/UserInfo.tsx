import React, {
  useState,
  useEffect,
} from 'react';

import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Save,
} from 'lucide-react';

import { toast } from 'sonner';

import custom_axios from '../../axios/axios';

interface Props {
  user: any;
  setUser: any;
}

export const UserInfo:
React.FC<Props> = ({
  user,
  setUser,
}) => {

  const [isEditing,
  setIsEditing] =
    useState(false);

  const [formData,
  setFormData] =
    useState({

      fullName: '',

      email: '',

      phone: '',

      address: '',

      city: '',

      postalCode: '',
    });

  useEffect(() => {

    if (user) {

      setFormData({

        fullName:
          user.fullName || '',

        email:
          user.email || '',

        phone:
          user.phone || '',

        address:
          user.address || '',

        city:
          user.city || '',

        postalCode:
          user.postalCode || '',
      });
    }

  }, [user]);

  const handleSave =
    async () => {

      try {

        const response =
          await custom_axios.patch(
            '/auth/profile',
            {

              phone:
                formData.phone,

              address:
                formData.address,

              city:
                formData.city,

              postalCode:
                formData.postalCode,
            },
          );

        setUser(
          response.data,
        );

        setIsEditing(
          false,
        );

        toast.success(
          'Profile updated successfully!',
        );

      } catch (error) {

        console.log(error);

        toast.error(
          'Failed to update profile',
        );
      }
    };

  return (

    <div className="bg-white rounded-3xl p-8 border border-stone-200">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold text-stone-900">

          Account Information

        </h2>

        <button
          onClick={() =>

            isEditing
              ? handleSave()
              : setIsEditing(
                  true,
                )
          }

          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
        >

          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              Edit
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">

        {/* FULL NAME */}

        <div>

          <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">

            <User className="h-4 w-4" />

            Full Name

          </label>

          {isEditing ? (

            <input
              type="text"

              value={
                formData.fullName
              }

              disabled

              className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-stone-100 cursor-not-allowed"
            />

          ) : (

            <p className="text-lg text-stone-900 font-medium">

              {formData.fullName}

            </p>
          )}
        </div>

        {/* EMAIL */}

        <div>

          <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">

            <Mail className="h-4 w-4" />

            Email Address

          </label>

          {isEditing ? (

            <input
              type="email"

              value={
                formData.email
              }

              disabled

              className="w-full px-4 py-3 border border-stone-200 rounded-xl bg-stone-100 cursor-not-allowed"
            />

          ) : (

            <p className="text-lg text-stone-900 font-medium">

              {formData.email}

            </p>
          )}
        </div>

        {/* PHONE */}

        <div>

          <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">

            <Phone className="h-4 w-4" />

            Phone Number

          </label>

          {isEditing ? (

            <input
              type="tel"

              value={
                formData.phone
              }

              onChange={(e) =>
                setFormData({

                  ...formData,

                  phone:
                    e.target
                      .value,
                })
              }

              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

          ) : (

            <p className="text-lg text-stone-900 font-medium">

              {formData.phone ||
                'Not provided'}

            </p>
          )}
        </div>

        {/* ADDRESS */}

        <div>

          <label className="block text-sm font-medium text-stone-700 mb-2 flex items-center gap-2">

            <MapPin className="h-4 w-4" />

            Address

          </label>

          {isEditing ? (

            <div className="space-y-3">

              <textarea
                value={
                  formData.address
                }

                onChange={(e) =>
                  setFormData({

                    ...formData,

                    address:
                      e.target
                        .value,
                  })
                }

                rows={2}

                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />

              <div className="grid grid-cols-2 gap-3">

                <input
                  type="text"

                  placeholder="City"

                  value={
                    formData.city
                  }

                  onChange={(e) =>
                    setFormData({

                      ...formData,

                      city:
                        e.target
                          .value,
                    })
                  }

                  className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                <input
                  type="text"

                  placeholder="Postal Code"

                  value={
                    formData.postalCode
                  }

                  onChange={(e) =>
                    setFormData({

                      ...formData,

                      postalCode:
                        e.target
                          .value,
                    })
                  }

                  className="px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

          ) : (

            <p className="text-lg text-stone-900 font-medium">

              {formData.address ||
                'Not provided'}

              {formData.city &&
                formData.postalCode && (

                <span className="block text-sm text-stone-600 mt-1">

                  {formData.city},{' '}
                  {
                    formData.postalCode
                  }

                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};