import React, { useState } from 'react';
import { FaCompass, FaLink, FaImage, FaCloudUploadAlt, FaCheck } from 'react-icons/fa';
import { Input, Divider, Button } from 'antd';
import { toast } from 'react-toastify';
import api from '../../services/api';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import {
  INITIAL_MENU_FORM,
  MENU_TYPE_OPTIONS,
  getParentMenuId,
} from './menuFormConfig';

const CreateMenus = ({ onClose, onSuccess }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [iconPreview, setIconPreview] = useState(null);
  const [menus, setMenus] = useState(INITIAL_MENU_FORM);

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const { refetch: permRefetch } = useGetPermissionByIdQuery({ id: userId, token });

  const resetForm = () => {
    setMenus(INITIAL_MENU_FORM);
    setIconPreview(null);
    setAlertBox(false);
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // Handle Image Upload & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenus(prev => ({ ...prev, menu_icon: file }));
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  async function handleConfirm() {
    try {
      const parentMenuId = getParentMenuId(menus.menu_type, menus.parent_menu);
      setLoading(true);
      const formData = new FormData();
      formData.append('menu_name', menus.menu_name);
      formData.append('menu_type', menus.menu_type);
      formData.append('parent_menu', parentMenuId ?? '');
      formData.append('menu_path', menus.menu_path);
      formData.append('order_menu', menus.order_menu);
      if (menus.menu_icon instanceof File) {
        formData.append('menu_icon', menus.menu_icon);
      }
      formData.append('created_by', 0);

      const res = await api.post('/menus', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 200) {
        permRefetch();
        toast.success('System menu deployed');
        resetForm();
        onSuccess?.(res.data?.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'System error: Link failed');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = menus.menu_name.trim() && menus.menu_type && menus.menu_path.trim();

  return (
    <section className="bg-[#f5f5f7] rounded-lg overflow-hidden border border-[#d2d2d7] shadow-xl">
      <AlertBox
        isOpen={alertBox}
        title="System Link Confirmation"
        message={`Confirming creation of "${menus.menu_name}" routing entity?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
      />

      {/* Header Bar */}
      <div className="bg-white px-5 py-3 border-b border-[#d2d2d7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaCompass className="text-slate-500" />
          <span className="text-[13px] font-semibold text-slate-700 tracking-tight">Navigation Interface Architect</span>
        </div>
        <div className="flex gap-1.5 opacity-30">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white border border-[#d2d2d7] rounded-md shadow-sm overflow-hidden">

          {/* Menu Name & Type */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase ml-1">ឈ្មោះមីនុយ (Menu Name)</label>
                <Input
                  size="small"
                  placeholder="e.g. Dashboard"
                  onChange={(e) => setMenus({ ...menus, menu_name: e.target.value })}
                  className="rounded border-[#d2d2d7] text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase ml-1">ទីតាំងមីនុយ (Placement)</label>
                <select
                  className="w-full border rounded-sm border-gray-300 text-[13px]"
                  value={menus.menu_type}
                  onChange={(e) => setMenus({ ...menus, menu_type: e.target.value })}
                >
                  <option value="">Select System Layer</option>
                  {MENU_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase ml-1">មីនុយ​ Path (Route)</label>
              <Input
                size="small"
                prefix={<FaLink className="text-slate-300 mr-1" />}
                placeholder="/management/dashboard"
                onChange={(e) => setMenus({ ...menus, menu_path: e.target.value })}
                className="rounded border-[#d2d2d7] text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase ml-1">សៀវភៅតម្រៀប (Order Index)</label>
              <Input
                size="small"
                type="number"
                min={0}
                value={menus.order_menu}
                onChange={(e) => setMenus({ ...menus, order_menu: Number(e.target.value) })}
                className="rounded border-[#d2d2d7] text-[13px]"
              />
            </div>
          </div>

          <Divider className="my-0" />

          {/* Image Upload Section */}
          <div className="p-6 bg-slate-50/50">
            <label className="text-[11px] font-bold text-slate-700 uppercase block mb-3 ml-1">មីនុយ​ Icon (Visual Identity)</label>
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-24 h-24 bg-white border-2 border-dashed border-[#d2d2d7] rounded-xl flex items-center justify-center overflow-hidden relative group">
                {iconPreview ? (
                  <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FaImage className="text-slate-200 text-3xl" />
                )}
                <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[10px] font-bold">
                  REPLACE
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-[13px] font-bold text-slate-700">Upload SVG or PNG icon</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
                  Upload a high-resolution icon for the sidebar. Recommended size: 64x64px.
                </p>
                <input
                  type="file"
                  id="icon-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <Button
                  size="small"
                  icon={<FaCloudUploadAlt />}
                  onClick={() => document.getElementById('icon-upload').click()}
                  className="mt-2 text-[12px] rounded border-[#d2d2d7] font-semibold"
                >
                  Choose File
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Tray */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#d2d2d7] pt-5">
          <form method="dialog">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-1.5 rounded bg-white border border-[#d2d2d7] text-[12px] text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors font-medium"
            >
              Discard
            </button>
          </form>
          <button
            type="button"
            onClick={() => setAlertBox(true)}
            disabled={!canSubmit}
            className="px-6 py-1.5 rounded bg-[#007aff] border border-[#0070e0] text-[12px] text-white font-bold hover:bg-[#006ee0] active:bg-[#0062c9] shadow-sm transition-colors flex items-center gap-2"
          >
            <FaCheck className="text-[10px]" /> Initialize Menu
          </button>
        </div>
      </div>
    </section>
  );
};

export default CreateMenus;
