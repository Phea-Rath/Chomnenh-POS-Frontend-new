import React, { useState } from 'react';
import { FaTags, FaPlus, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Input, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useCreateBrandMutation, useGetAllBrandQuery } from '../../../app/Features/brandsSlice';

const CreateBrands = ({ onAdd }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [brandData, setBrandData] = useState({ brand_name: "", created_by: 0 });

  const token = localStorage.getItem('token');
  const { refetch } = useGetAllBrandQuery(token);
  const [createBrand] = useCreateBrandMutation();

  const handleConfirm = async () => {
    if (!brandData.brand_name.trim()) {
      toast.warning('Please enter a brand name');
      return;
    }

    try {
      setLoading(true);
      await createBrand({ itemData: brandData, token }).unwrap();
      refetch();
      toast.success('Brand created successfully');
      setAlertBox(false);
      onAdd(); // Close modal
    } catch (error) {
      toast.error(error?.data?.message || 'An error occurred while creating the brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white overflow-hidden">
      {/* Alert Confirmation */}
      <AlertBox
        isOpen={alertBox}
        title="Confirm Creation"
        message={`Do you want to add "${brandData.brand_name}" to your brand list?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      {/* Header Section */}
      <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600">
            <FaTags className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 leading-none">New Brand</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Add a new manufacturer to your inventory</p>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
              Brand Identity
            </label>
            <Input
              size="large"
              placeholder="e.g. Nike, Apple, Samsung..."
              value={brandData.brand_name}
              onChange={(e) => setBrandData({ ...brandData, brand_name: e.target.value })}
              className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-medium text-lg px-6"
            />
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
            <p className="text-xs text-blue-600 font-medium leading-relaxed">
              <strong>Tip:</strong> Ensure the brand name is unique to avoid duplicates in your reports.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button
            type="primary"
            icon={<FaPlus />}
            onClick={() => setAlertBox(true)}
            className="h-14 flex-1 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 border-none font-bold text-base order-2 sm:order-1"
          >
            Create Brand
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

export default CreateBrands;