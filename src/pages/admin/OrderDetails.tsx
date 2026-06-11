import React, {
  useState,
  useEffect,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Calendar,
} from 'lucide-react';

import { AdminLayout }
from '../../components/admin/AdminLayout';

import { toast }
from 'sonner';

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

export const OrderDetails =
() => {

  const navigate =
  useNavigate();

  const { id } =
  useParams();

  const [
    order,
    setOrder,
  ] = useState<any>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // FETCH ORDER

  useEffect(() => {

    const fetchOrder =
    async () => {

      try {

        const response =
        await custom_axios.get(

          `/orders/${id}`,
        );

        console.log(
          response.data,
        );

        setOrder(
          response.data,
        );

      } catch (error) {

        console.log(error);

        toast.error(
          'Order not found',
        );

        navigate(
          '/admin/orders',
        );

      } finally {

        setLoading(false);
      }
    };

    fetchOrder();

  }, [id, navigate]);

  // UPDATE STATUS

  const handleStatusChange =
  async (
    newStatus: string,
  ) => {

    try {

      await custom_axios.patch(

        `/orders/${order.id}/status`,

        {
          status: newStatus,
        },
      );

      setOrder({

        ...order,

        orderStatus:
        newStatus,
      });

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

        <div className="text-center py-12">

          <p className="text-gray-500">

            Loading...

          </p>

        </div>

      </AdminLayout>
    );
  }

  if (!order) {

    return null;
  }

  return (

    <AdminLayout>

      <div className="mb-8">

        <button
          onClick={() =>
            navigate(
              '/admin/orders',
            )
          }
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >

          <ArrowLeft size={20} />

          Back to Orders

        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-3xl font-bold text-gray-900">

              Order Details

            </h1>

            <p className="text-gray-600 mt-1">

              Order ID:
              {' '}
              {order.id}

            </p>

          </div>

          <span
            className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(
              order.orderStatus,
            )} w-fit`}
          >

            {
              order.orderStatus
            }

          </span>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}

        <div className="lg:col-span-2 space-y-6">

          {/* ITEMS */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">

              <Package size={20} />

              Order Items

            </h2>

            <div className="space-y-4">

              {order.items?.map(
                (
                  item: any,
                  index: number,
                ) => (

                  <div
                    key={index}
                    className="flex items-center gap-4 pb-4 border-b border-gray-200 last:border-0"
                  >

                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />

                    <div className="flex-1">

                      <h3 className="font-medium text-gray-900">

                        {item.name}

                      </h3>

                      <p className="text-sm text-gray-600">

                        Quantity:
                        {' '}
                        {item.quantity}

                      </p>

                    </div>

                    <div className="text-right">

                      <p className="font-bold text-gray-900">

                        $
                        {
                          Number(
                            item.price,
                          ).toFixed(2)
                        }

                      </p>

                      <p className="text-sm text-gray-600">

                        Total:
                        {' '}
                        $

                        {
                          (
                            Number(
                              item.price,
                            ) *

                            Number(
                              item.quantity,
                            )
                          ).toFixed(2)
                        }

                      </p>

                    </div>

                  </div>
                ),
              )}

            </div>

          </div>

          {/* CUSTOMER */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">

              <User size={20} />

              Customer Information

            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <p className="text-sm text-gray-600">

                  Full Name

                </p>

                <p className="font-medium text-gray-900">

                  {order.fullName}

                </p>

              </div>

              <div>

                <p className="text-sm text-gray-600">

                  Phone Number

                </p>

                <p className="font-medium text-gray-900">

                  {order.phone}

                </p>

              </div>

              <div>

                <p className="text-sm text-gray-600">

                  Email

                </p>

                <p className="font-medium text-gray-900">

                  {order.email}

                </p>

              </div>

            </div>

          </div>

          {/* ADDRESS */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">

              <MapPin size={20} />

              Shipping Address

            </h2>

            <div className="space-y-2">

              <p className="text-gray-900">

                {order.address}

              </p>

              <p className="text-gray-900">

                {order.city},
                {' '}
                {order.postalCode}

              </p>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="space-y-6">

          {/* STATUS */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4">

              Update Status

            </h2>

            <select
              value={
                order.orderStatus
              }
              onChange={(e) =>
                handleStatusChange(
                  e.target.value,
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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

          </div>

          {/* PAYMENT */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

              <CreditCard size={20} />

              Payment Details

            </h2>

            <div className="space-y-3">

              <div className="flex justify-between">

                <span className="text-gray-600">

                  Payment Method:

                </span>

                <span className="font-medium text-gray-900">

                  {
                    order.paymentMethod ===
                    'cod'

                    ? 'Cash on Delivery'

                    : 'Card'
                  }

                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-600">

                  Payment Status:

                </span>

                <span className="font-medium text-gray-900">

                  {
                    order.paymentStatus
                  }

                </span>

              </div>

            </div>

          </div>

          {/* SUMMARY */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4">

              Order Summary

            </h2>

            <div className="space-y-3">

              <div className="flex justify-between text-gray-600">

                <span>

                  Total:

                </span>

                <span>

                  $
                  {
                    Number(
                      order.total,
                    ).toFixed(2)
                  }

                </span>

              </div>

            </div>

          </div>

          {/* DATE */}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">

              <Calendar size={20} />

              Order Date

            </h2>

            <p className="text-gray-900">

              {
                new Date(
                  order.createdAt,
                ).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )
              }

            </p>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
};
