import React, {
  useState,
  useEffect,
} from 'react';

import {
  User,
  Package,
  Palette,
} from 'lucide-react';

import { UserInfo } from '../components/profile/UserInfo';

import { OrderHistory } from '../components/profile/OrderHistory';

import { SavedDesigns } from '../components/profile/SavedDesigns';

import { initializeUserProfile } from '../services/profileService';

import { VerifyNotice } from '../components/VerifyNotice';

import custom_axios from '../axios/axios';

type TabType =
  | 'account'
  | 'orders'
  | 'designs';

export const Profile:
React.FC = () => {

  const [
    activeTab,
    setActiveTab,
  ] = useState<TabType>(
    'account',
  );

  const [user, setUser] =
    useState<any>(null);

  const [loading,
  setLoading] =
    useState(true);

  useEffect(() => {

    initializeUserProfile();

    const getProfile =
      async () => {

        try {

          const response =
            await custom_axios.get(
              '/auth/profile',
            );

          setUser(
            response.data,
          );

          console.log(
            response.data,
          );

        } catch (error) {

          console.log(error);

        } finally {

          setLoading(
            false,
          );
        }
      };

    getProfile();

  }, []);

  const tabs = [

    {
      id: 'account' as TabType,
      label: 'Account',
      icon: User,
    },

    {
      id: 'orders' as TabType,
      label: 'Orders',
      icon: Package,
    },

    {
      id: 'designs' as TabType,
      label: 'Saved Designs',
      icon: Palette,
    },
  ];

  if (loading) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">

        <p className="text-lg text-stone-600">

          Loading profile...

        </p>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-[#FFF8F0] py-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-8">

          <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-2">

            My{' '}

            <span className="text-orange-500">

              Profile

            </span>
          </h1>
          <VerifyNotice />
          <p className="text-lg text-stone-600">

            Manage your account,
            orders, and saved designs

          </p>
        </div>

        {/* TABS */}

        <div className="bg-white rounded-2xl p-2 mb-8 border border-stone-200 flex flex-wrap gap-2">

          {tabs.map((tab) => {

            const Icon =
              tab.icon;

            return (

              <button
                key={tab.id}

                onClick={() =>
                  setActiveTab(
                    tab.id,
                  )
                }

                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab ===
                  tab.id

                    ? 'bg-orange-500 text-white shadow-lg'

                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >

                <Icon className="h-5 w-5" />

                <span className="hidden sm:inline">

                  {tab.label}

                </span>
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}

        <div className="animate-in fade-in duration-300">

          {activeTab ===
            'account' && (

            <UserInfo
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab ===
            'orders' && (

            <OrderHistory />

          )}

          {activeTab ===
            'designs' && (

            <SavedDesigns />

          )}
        </div>
      </div>
    </div>
  );
};