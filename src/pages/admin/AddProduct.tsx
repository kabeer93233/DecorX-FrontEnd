import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { toast } from 'sonner';
import { ApiConstants } from '../../app/API/ApiConstants';
import custom_axios from '../../axios/axios';

export const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    category: 'Chair',
    price: '',
    width: '',
    height: '',
    image: '',
  });

  const categories = [
    'Chair',
    'Sofa',
    'Table',
    'Bed',
    'Storage',
    'Lighting',
    'Decor',
    'Wall Decor',
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setImageFile(file);

      setFormData({
        ...formData,
        image: URL.createObjectURL(file),
      });
    }
  };

  const addProduct = async () => {
  try {

    const data = new FormData();

    data.append('productName', formData.productName);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('price', formData.price);
    data.append('width', formData.width);
    data.append('height', formData.height);

    if (imageFile) {
      data.append('image', imageFile);
    }

    await custom_axios.post(
      ApiConstants.PRODUCTS.ADD,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    toast.success('Product Added Successfully');

    navigate('/admin/products');

  } catch (error) {
    toast.error('Failed To Add Product');
  }
};

  return (
    <AdminLayout>
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Add New Product
        </h1>

        <p className="text-gray-600 mt-1">
          Fill in the details below to add a new product
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Product Name */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>

            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Product Name"
            />
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>

            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Price"
            />
          </div>

          {/* Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width
            </label>

            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Width"
            />
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height
            </label>

            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Height"
            />
          </div>

          {/* Image */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                <Upload size={20} />
                Upload Image

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {formData.image && (
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                />
              )}
            </div>

            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="Image URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-4"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={addProduct}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Save Product
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};