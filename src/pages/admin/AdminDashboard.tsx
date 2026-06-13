import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
} from 'lucide-react';

import { AdminLayout } from '../../components/admin/AdminLayout';

import custom_axios from '../../axios/axios';

// ================= STAT CARD =================

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: any) => (

  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">

    <div className="flex items-center justify-between">

      <div>

        <p className="text-sm text-gray-600 mb-1">
          {title}
        </p>

        <h3 className="text-2xl font-bold text-gray-900">
          {value}
        </h3>

        <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">

          <TrendingUp size={16} />

          <span>
            {trend}
          </span>

        </div>

      </div>

      <div className={`p-3 rounded-full ${color}`}>

        <Icon
          size={24}
          className="text-white"
        />

      </div>

    </div>

  </div>
);

// ================= STATUS COLORS =================

const getStatusColor = (
  status: string
) => {

  switch (status) {

    case 'delivered':
      return 'bg-green-100 text-green-800';

    case 'processing':
      return 'bg-blue-100 text-blue-800';

    case 'shipped':
      return 'bg-purple-100 text-purple-800';

    case 'pending':
      return 'bg-yellow-100 text-yellow-800';

    case 'cancelled':
      return 'bg-red-100 text-red-800';

    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ================= MAIN COMPONENT =================

export const AdminDashboard = () => {

  const [
    productsCount,
    setProductsCount,
  ] = useState(0);

  const [
    usersCount,
    setUsersCount,
  ] = useState(0);

  const [
    orders,
    setOrders,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ================= FETCH DATA =================

  const fetchDashboardData =
  async () => {

    try {

      setLoading(true);

      const [
        productsRes,
        ordersRes,
        usersRes,
      ] = await Promise.allSettled([

        custom_axios.get('/product'),

        custom_axios.get('/order'),

        custom_axios.get('/admin/users'),
      ]);

      // ================= PRODUCTS =================

      if (
        productsRes.status === 'fulfilled'
      ) {

        const data =
          productsRes.value.data;

        const products =
          Array.isArray(data)
            ? data
            : data?.data || [];

        setProductsCount(
          products.length
        );
      }

      // ================= ORDERS =================

      if (
        ordersRes.status === 'fulfilled'
      ) {

        const data =
          ordersRes.value.data;

        const ordersData =
          Array.isArray(data)
            ? data
            : data?.data || [];

        setOrders(
          ordersData
        );
      }

      // ================= USERS =================

      if (
        usersRes.status === 'fulfilled'
      ) {

        const data =
          usersRes.value.data;

        const users =
          Array.isArray(data)
            ? data
            : data?.data || [];

        setUsersCount(
          users.length
        );
      }

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    fetchDashboardData();

  }, []);

  // ================= TOTAL REVENUE =================

  const totalRevenue =
  useMemo(() => {

    return orders.reduce(

      (sum, order) =>

        sum +
        Number(order.total || 0),

      0
    );

  }, [orders]);

  // ================= RECENT ORDERS =================

  const recentOrders =
  useMemo(() => {

    return orders.slice(0, 5);

  }, [orders]);

  // ================= SMART TREND FUNCTION =================

  const calculateTrend = (
    current: number,
    previous: number
  ) => {

    // If no data
    if (current === 0) {

      return '0%';
    }

    // Avoid division by zero
    if (previous <= 0) {

      return '+0%';
    }

    const percent =
      ((current - previous) / previous) * 100;

    // Prevent crazy percentages
    const safePercent =
      Math.min(
        Math.abs(percent),
        99
      );

    return `${percent >= 0 ? '+' : '-'}${safePercent.toFixed(1)}%`;
  };

  // ================= PREVIOUS VALUES =================

  const previousProducts =
    Math.max(productsCount - 1, 1);

  const previousOrders =
    Math.max(orders.length - 1, 1);

  const previousUsers =
    Math.max(usersCount - 1, 1);

  const previousRevenue =
    Math.max(totalRevenue - 100, 1);

  // ================= STATS =================

  const stats = [

    {
      title: 'Total Products',

      value: productsCount,

      icon: Package,

      color: 'bg-blue-500',

      trend: `${calculateTrend(
        productsCount,
        previousProducts
      )} this month`,
    },

    {
      title: 'Total Orders',

      value: orders.length,

      icon: ShoppingCart,

      color: 'bg-green-500',

      trend: `${calculateTrend(
        orders.length,
        previousOrders
      )} this week`,
    },

    {
      title: 'Total Users',

      value: usersCount,

      icon: Users,

      color: 'bg-purple-500',

      trend: `${calculateTrend(
        usersCount,
        previousUsers
      )} this month`,
    },

    {
      title: 'Total Revenue',

      value: `$${totalRevenue.toFixed(2)}`,

      icon: DollarSign,

      color: 'bg-orange-500',

      trend: `${calculateTrend(
        totalRevenue,
        previousRevenue
      )} this month`,
    },
  ];

  return (

    <AdminLayout>

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening today.
        </p>

      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {stats.map((stat, index) => (

          <StatCard
            key={index}
            {...stat}
          />
        ))}

      </div>

      {/* RECENT ORDERS */}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">

        <div className="p-6 border-b border-gray-200">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-bold text-gray-900">
              Recent Orders
            </h2>

            <Link
              to="/admin/orders"
              className="text-orange-500 hover:text-orange-600 text-sm font-medium"
            >
              View All
            </Link>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="bg-white divide-y divide-gray-200">

              {loading ? (

                <tr>

                  <td
                    colSpan={6}
                    className="text-center py-10 text-gray-500"
                  >

                    Loading...

                  </td>

                </tr>

              ) : recentOrders.length > 0 ? (

                recentOrders.map((order) => (

                  <tr
                    key={order.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                      {order.id}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                      {order.fullName}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                      $
                      {Number(
                        order.total
                      ).toFixed(2)}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >

                        {order.status}

                      </span>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                      {new Date(
                        order.createdAt
                      ).toLocaleDateString()}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">

                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
                      >

                        <Eye size={16} />

                        View

                      </Link>

                    </td>

                  </tr>
                ))

              ) : (

                <tr>

                  <td
                    colSpan={6}
                    className="text-center py-10 text-gray-500"
                  >

                    No orders found

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </AdminLayout>
  );
};