import React, { useEffect, useState } from 'react';
import { FaEdit, FaCheck, FaTimes, FaLayerGroup, FaInfoCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button, Tag } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllCategoriesQuery, useUpdateCategoryMutation } from '../../../app/Features/categoriesSlice';

const UpdateCategory = ({ onAdd, data }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [category, setCategory] = useState({ category_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllCategoriesQuery(token);
  const [updateCategory] = useUpdateCategoryMutation();

  // Initialize state from props
  useEffect(() => {
    if (data) {
      setCategory({
        category_name: data.name || '',
        created_by: 0
      });
    }
  }, [data]);

  const handleConfirm = async () => {
    if (!category.category_name.trim()) {
      toast.warning('Category name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateCategory({ id: data.id, itemData: category, token }).unwrap();
      refetch();
      toast.success('Category updated successfully');
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title="Confirm Update"
        message={`Are you sure you want to rename "${data.name}" to "${category.category_name}"?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText="Yes, Update"
        cancelText="Discard"
      />

      {/* Header Section - Violet Theme */}
      <div className="p-8 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-violet-600">
            <FaEdit className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">Edit Category</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Modify category name and settings</p>
          </div>
        </div>
        <Tag color="purple" className="rounded-full px-4 py-1 font-bold border-none bg-violet-200/50 text-violet-700 hidden sm:block">
          REF: #{data.id}
        </Tag>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Category Name
              </label>
              {data.name !== category.category_name && (
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded tracking-tighter uppercase">
                  Pending Change
                </span>
              )}
            </div>
            <Input
              size="large"
              placeholder="Enter category name..."
              value={category.category_name}
              onChange={(e) => setCategory(prev => ({ ...prev, category_name: e.target.value }))}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
            <FaInfoCircle className="text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500 font-medium">
                Changing this name will update the classification for all items currently under <span className="text-slate-900 font-bold">"{data.name}"</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaCheck />}
            onClick={() => setAlertBox(true)}
            disabled={data.name === category.category_name}
            className={`h-14 flex-1 rounded-2xl font-bold text-base order-2 sm:order-1 border-none shadow-lg transition-all
              ${data.name === category.category_name
                ? 'bg-slate-200 text-slate-400 shadow-none'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-100'}`}
          >
            Save Changes
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

export default UpdateCategory;