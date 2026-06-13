import React, {
  useEffect,
  useState,
} from 'react';

import { Link }
from 'react-router-dom';

import {
  Search,
  Eye,
  Trash2,
} from 'lucide-react';

import { toast }
from 'sonner';

import { AdminLayout }
from '../../components/admin/AdminLayout';

import custom_axios
from '../../axios/axios';

const getStatusColor =
(status: string) => {

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

export const OrdersManagement =
() => {

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  const [
    orders,
    setOrders,
  ] = useState<any[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const statuses = [

    'all',

    'pending',

    'processing',

    'shipped',

    'delivered',

    'cancelled',
  ];

  // FETCH ORDERS

  useEffect(() => {

    const fetchOrders =
    async () => {

      try {

        const token =
        localStorage.getItem(
          'token',
        );

        const response =
        await custom_axios.get(

          '/orders',

          {
            headers: {

              Authorization:
              `Bearer ${token}`,
            },
          },
        );

        console.log(
          response.data,
        );

        setOrders(
          response.data,
        );

      } catch (error) {

        console.log(error);

        toast.error(
          'Failed to fetch orders',
        );

      } finally {

        setLoading(false);
      }
    };

    fetchOrders();

  }, []);

  // FILTER

  const filteredOrders =
  orders.filter((order) => {

    const matchesSearch =

      String(order.id)
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase(),
      ) ||

      order.fullName
      ?.toLowerCase()
      .includes(
        searchTerm.toLowerCase(),
      );

    const matchesStatus =

      statusFilter === 'all' ||

      order.orderStatus ===
      statusFilter;

    return (
      matchesSearch &&
      matchesStatus
    );
  });

  // DELETE ORDER

  const handleDelete =
  async (id: number) => {

    if (
      !window.confirm(
        'Are you sure you want to delete this order?',
      )
    ) {

      return;
    }

    try {

      const token =
      localStorage.getItem(
        'token',
      );

      await custom_axios.delete(

        `/orders/${id}`,

        {
          headers: {

            Authorization:
            `Bearer ${token}`,
          },
        },
      );

      setOrders(

        orders.filter(

          (o) =>
            o.id !== id,
        ),
      );

      toast.success(
        'Order deleted successfully',
      );

    } catch (error) {

      console.log(error);

      toast.error(
        'Failed to delete order',
      );
    }
  };

  // UPDATE STATUS

  const handleStatusChange =
  async (
    id: number,
    newStatus: string,
  ) => {

    try {

      const token =
      localStorage.getItem(
        'token',
      );

      await custom_axios.patch(

        `/orders/${id}/status`,

        {
          orderStatus:
          newStatus,
        },

        {
          headers: {

            Authorization:
            `Bearer ${token}`,
          },
        },
      );

      setOrders(

        orders.map((o) =>

          o.id === id

            ? {

                ...o,

                orderStatus:
                newStatus,
              }

            : o,
        ),
      );

      toast.success(
        'Order status updated',
      );

    } catch (error) {

      console.log(error);

      toast.error(
        'Failed to update status',
      );
    }
  };

  if (loading) {

    return (

      <AdminLayout>

        <div className="text-center py-20">

          <p className="text-gray-500">

            Loading orders...

          </p>

        </div>

      </AdminLayout>
    );
  }

  return (

    <AdminLayout>

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">

          Orders Management

        </h1>

        <p className="text-gray-600 mt-1">

          Manage all customer orders

        </p>

      </div>

      {/* FILTERS */}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* SEARCH */}

          <div className="relative">

            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value,
                )
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value,
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >

            {statuses.map(
              (status) => (

                <option
                  key={status}
                  value={status}
                >

                  {status === 'all'

                    ? 'All Statuses'

                    : status
                        .charAt(0)
                        .toUpperCase() +

                      status.slice(1)}

                </option>
              ),
            )}

          </select>

        </div>

        <div className="mt-4 text-sm text-gray-600">

          Showing
          {' '}
          {filteredOrders.length}
          {' '}
          of
          {' '}
          {orders.length}
          {' '}
          orders

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Order ID

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Customer

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Items

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Total

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Payment

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Status

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Date

                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody className="bg-white divide-y divide-gray-200">

              {filteredOrders.map(
                (order) => (

                  <tr
                    key={order.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">

                      #{order.id}

                    </td>

                    <td className="px-6 py-4">

                      <div className="text-sm font-medium text-gray-900">

                        {order.fullName}

                      </div>

                      <div className="text-sm text-gray-500">

                        {order.phone}

                      </div>

                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">

                      {
                        order.items
                        ?.length
                      }
                      {' '}
                      item(s)

                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-900">

                      $
                      {
                        Number(
                          order.total,
                        ).toFixed(2)
                      }

                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">

                      {
                        order.paymentMethod ===
                        'cod'

                          ? 'Cash on Delivery'

                          : 'Card'
                      }

                    </td>

                    <td className="px-6 py-4">

                      <select
                        value={
                          order.orderStatus
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value,
                          )
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.orderStatus,
                        )}`}
                      >

                        <option value="pending">

                          Pending

                        </option>

                        <option value="processing">

                          Processing

                        </option>

                        <option value="shipped">

                          Shipped

                        </option>

                        <option value="delivered">

                          Delivered

                        </option>

                        <option value="cancelled">

                          Cancelled

                        </option>

                      </select>

                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">

                      {
                        new Date(
                          order.createdAt,
                        ).toLocaleDateString()
                      }

                    </td>

                    <td className="px-6 py-4 text-sm">

                      <div className="flex items-center gap-2">

                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="text-orange-600 hover:text-orange-800 p-2"
                        >

                          <Eye size={18} />

                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(
                              order.id,
                            )
                          }
                          className="text-red-600 hover:text-red-800 p-2"
                        >

                          <Trash2 size={18} />

                        </button>

                      </div>

                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

        </div>

        {filteredOrders.length === 0 && (

          <div className="text-center py-12">

            <p className="text-gray-500">

              No orders found

            </p>

          </div>
        )}

      </div>

    </AdminLayout>
  );
};