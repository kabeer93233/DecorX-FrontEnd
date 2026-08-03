import React, {
  useEffect,
  useState,
} from 'react';

import {
  Search,
  Trash2,
  Ban,
  CheckCircle,
} from 'lucide-react';

import { AdminLayout }
from '../../components/admin/AdminLayout';

import { toast }
from 'sonner';

import custom_axios
from '../../axios/axios';

interface User {

  id: number;

  fullName: string;

  email: string;

  role: string;

  isBlocked: boolean;

  createdAt: string;
}

export const UsersManagement = () => {

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  const [
    users,
    setUsers,
  ] = useState<User[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // FETCH USERS

  const fetchUsers =
  async () => {

    try {

      setLoading(true);

      const response =
      await custom_axios.get(
        '/admin/users',
      );

      setUsers(
        response.data,
      );

    } catch (error:any) {

      console.log(error);

      toast.error(
        error?.response?.data?.message ||
        'Failed to fetch users',
      );

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    fetchUsers();

  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'users') fetchUsers();
    };
    window.addEventListener('decorx-refresh', handler);
    return () => window.removeEventListener('decorx-refresh', handler);
  }, []);

  // FILTER USERS

  const filteredUsers =
  users.filter((user) => {

    const matchesSearch =

      user.fullName
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase(),
      ) ||

      user.email
      .toLowerCase()
      .includes(
        searchTerm.toLowerCase(),
      ) ||

      user.id
      .toString()
      .includes(
        searchTerm,
      );

    const matchesStatus =

      statusFilter === 'all' ||

      (
        statusFilter === 'active' &&
        !user.isBlocked
      ) ||

      (
        statusFilter === 'blocked' &&
        user.isBlocked
      );

    return (
      matchesSearch &&
      matchesStatus
    );
  });

  // DELETE USER

  const handleDelete =
  async (
    id: number,
    name: string,
  ) => {

    const confirmDelete =
    window.confirm(
      `Are you sure you want to delete "${name}"?`,
    );

    if (!confirmDelete) {

      return;
    }

    try {

      await custom_axios.delete(
        `/admin/users/${id}`,
      );

      setUsers((prev) =>

        prev.filter(
          (user) =>
          user.id !== id,
        )
      );

      toast.success(
        'User deleted successfully',
      );

    } catch (error:any) {

      console.log(error);

      toast.error(
        error?.response?.data?.message ||
        'Failed to delete user',
      );
    }
  };

  // BLOCK / UNBLOCK USER

  const handleToggleStatus =
  async (
    id: number,
    isBlocked: boolean,
  ) => {

    try {

      if (isBlocked) {

        await custom_axios.patch(
          `/admin/users/${id}/unblock`,
        );

      } else {

        await custom_axios.patch(
          `/admin/users/${id}/block`,
        );
      }

      setUsers((prev) =>

        prev.map((user) =>

          user.id === id
          ? {
              ...user,
              isBlocked:
              !isBlocked,
            }
          : user
        )
      );

      toast.success(

        isBlocked
        ? 'User unblocked successfully'
        : 'User blocked successfully',
      );

    } catch (error:any) {

      console.log(error);

      toast.error(
        error?.response?.data?.message ||
        'Failed to update user status',
      );
    }
  };

  return (

    <AdminLayout>

      {/* HEADER */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-900">

          Users Management

        </h1>

        <p className="text-gray-600 mt-1">

          Manage all registered users

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
              placeholder="Search by name, email or ID..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value,
                )
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

          </div>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value,
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >

            <option value="all">
              All Users
            </option>

            <option value="active">
              Active
            </option>

            <option value="blocked">
              Blocked
            </option>

          </select>

        </div>

        <div className="mt-4 text-sm text-gray-600">

          Showing
          {' '}

          {filteredUsers.length}

          {' '}

          of
          {' '}

          {users.length}

          {' '}

          users

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    colSpan={7}
                    className="text-center py-10 text-gray-500"
                  >

                    Loading users...

                  </td>

                </tr>

              ) : filteredUsers.length > 0 ? (

                filteredUsers.map((user) => (

                  <tr
                    key={user.id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                      #{user.id}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="flex items-center">

                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">

                          {user.fullName
                            .charAt(0)
                            .toUpperCase()}

                        </div>

                        <div className="ml-3">

                          <p className="text-sm font-medium text-gray-900">

                            {user.fullName}

                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                      {user.email}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                      {new Date(
                        user.createdAt,
                      ).toLocaleDateString()}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                      {user.role}

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isBlocked
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >

                        {user.isBlocked
                          ? 'blocked'
                          : 'active'}

                      </span>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">

                      <div className="flex items-center gap-2">

                        {/* BLOCK / UNBLOCK */}

                        <button
                          onClick={() =>
                            handleToggleStatus(
                              user.id,
                              user.isBlocked,
                            )
                          }
                          className={`p-2 ${
                            user.isBlocked
                              ? 'text-green-600 hover:text-green-800'
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title={
                            user.isBlocked
                            ? 'Unblock User'
                            : 'Block User'
                          }
                        >

                          {user.isBlocked ? (

                            <CheckCircle size={18} />

                          ) : (

                            <Ban size={18} />

                          )}

                        </button>

                        {/* DELETE */}

                        <button
                          onClick={() =>
                            handleDelete(
                              user.id,
                              user.fullName,
                            )
                          }
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Delete User"
                        >

                          <Trash2 size={18} />

                        </button>

                      </div>

                    </td>

                  </tr>
                ))
              ) : (

                <tr>

                  <td
                    colSpan={7}
                    className="text-center py-12 text-gray-500"
                  >

                    No users found

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