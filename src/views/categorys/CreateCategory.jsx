import React, { useState } from 'react';
import { FaFolderPlus, FaCheck, FaTimes, FaLayerGroup } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateCategoryMutation, useGetAllCategoriesQuery } from '../../../app/Features/categoriesSlice';

const CreateCategory = ({ onAdd }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [category, setCategory] = useState({ category_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllCategoriesQuery(token);
  const [createCategory] = useCreateCategoryMutation();

  const handleConfirm = async () => {
    if (!category.category_name.trim()) {
      toast.warning('Please enter a category name');
      return;
    }

    try {
      setLoading(true);
      await createCategory({ itemData: category, token }).unwrap();
      refetch();
      toast.success('Category created successfully');
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title="Confirm New Category"
        message={`Do you want to create the "${category.category_name}" category?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText="Create Now"
        cancelText="Discard"
      />

      {/* Header Section - Emerald Theme */}
      <div className="p-8 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-emerald-600">
            <FaLayerGroup className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">New Category</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Group your products for better organization</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
              Category Name
            </label>
            <Input
              size="large"
              placeholder="e.g. Electronics, Home Decor, Soft Drinks..."
              value={category.category_name}
              onChange={(e) => setCategory({ ...category, category_name: e.target.value, created_by: 0 })}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex gap-3 items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-700 font-medium">
              Categories help filter your inventory and generate sales reports.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 border-none font-bold text-base order-2 sm:order-1"
          >
            Create Category
          </Button>

          <form method="dialog" className="order-1 sm:order-2">
            <Button
              icon={<FaTimes />}
              className="h-14 w-full sm:w-14 rounded-2xl border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 flex items-center justify-center font-bold"
              onClick={onAdd}
            />
          </form>
        </div>
      </div>
    </section>
  );
};

export default CreateCategory;