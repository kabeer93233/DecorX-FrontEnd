import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { toast } from 'sonner';
import custom_axios from '../../axios/axios';

type Product = {
  id: number;
  productName: string;
  description: string;
  category: string;
  price: number;
  image: string;
  rating?: number;
  isNew?: boolean;
};

export const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getProducts = async () => {
    try {
      const response = await custom_axios.get('/product');

      console.log(response.data);

      setProducts(response.data);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const categories = [
    'all',
    ...new Set(products.map((p) => p.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ||
      product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product ID: ${id}?`
    );

    if (!confirmDelete) return;

    try {
      await custom_axios.delete(`/product/${id}`);

      toast.success('Product deleted successfully');

      setProducts((prev) =>
        prev.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete product');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Products Management
            </h1>

            <p className="text-gray-600 mt-1">
              Manage all your products inventory
            </p>
          </div>

          <Link
            to="/admin/add-product"
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors w-fit"
          >
            <Plus size={20} />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />

            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredProducts.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-left">Price</th>
                <th className="px-6 py-3 text-left">Rating</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.productName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />

                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>

                        <div className="text-xs text-gray-500">
                          {product.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {product.category}
                  </td>

                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${product.price}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    ⭐ {product.rating || 0}
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {product.isNew ? 'New' : 'Active'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 p-2"
                      >
                        <Eye size={18} />
                      </Link>

                      <Link
                        to={`/admin/edit-product/${product.id}`}
                        className="text-orange-600 hover:text-orange-800 p-2"
                      >
                        <Edit size={18} />
                      </Link>

                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};