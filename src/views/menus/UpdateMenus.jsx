import React, { useEffect, useState } from 'react';
import { FaEdit, FaSyncAlt, FaLink, FaImage, FaCloudUploadAlt, FaTimes, FaCheck } from 'react-icons/fa';
import { Input, Select, Divider, Button } from 'antd';
import { toast } from 'react-toastify';

// Components & Services
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllMenuQuery, useUpdateMenuMutation } from '../../../app/Features/menusSlice';
import { useGetPermissionByIdQuery } from '../../../app/Features/permissionSlice';
import api from '../../services/api';

const UpdateMenus = ({ onAdd, dataMenu }) => {
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [iconPreview, setIconPreview] = useState(null);

  // Initialize state with specific naming to match backend expectation
  const [menus, setMenus] = useState({
    menu_name: "",
    menu_type: "",
    menu_icon: "",
    menu_path: ""
  });

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const { data: allMenus, refetch, isLoading: isLoadMenus } = useGetAllMenuQuery(token);
  const { refetch: permRefetch } = useGetPermissionByIdQuery({ id: userId, token });
  const [updateMenu] = useUpdateMenuMutation();

  // Sync dataMenu to local state and handle initial preview if icon is a URL
  useEffect(() => {
    if (dataMenu) {
      setMenus({
        menu_name: dataMenu.name || "",
        menu_type: dataMenu.type || "",
        menu_icon: dataMenu.icon || "",
        menu_path: dataMenu.path || ""
      });
      if (typeof dataMenu.icon === 'string' && dataMenu.icon.startsWith('http')) {
        setIconPreview(dataMenu.icon);
      }
    }
  }, [dataMenu]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMenus(prev => ({ ...prev, menu_icon: file }));
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    setAlertBox(false);
    try {
      setLoading(true);

      // Since menu_icon can now be a file, we use FormData for the update
      const formData = new FormData();
      formData.append('menu_name', menus.menu_name);
      formData.append('menu_type', menus.menu_type);
      formData.append('menu_path', menus.menu_path);
      // Only append if it's a new file; otherwise, the backend keeps existing
      if (menus.menu_icon instanceof File) {
        formData.append('menu_icon', menus.menu_icon);
      } else {
        formData.append('menu_icon', menus.menu_icon);
      }

      await updateMenu({ id: dataMenu.id, itemData: formData, token }).unwrap();
      // const res = await api.post(`/menus/${dataMenu.id}`, formData, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'multipart/form-data',
      //   },
      // });
      refetch();
      permRefetch();

      toast.success('System configuration updated');
      setAlertBox(false);
      onAdd();

      if (!isLoadMenus) {
        localStorage.setItem('menus', JSON.stringify(allMenus));
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#f5f5f7] rounded-lg overflow-hidden border border-[#d2d2d7] shadow-xl">
      <AlertBox
        isOpen={alertBox}
        title="Confirm Modification"
        message={`Save changes to the "${dataMenu?.name}" navigation record?`}
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
      />

      {/* OS-Style Header */}
      <div className="bg-white px-5 py-3 border-b border-[#d2d2d7] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaSyncAlt className="text-[#007aff] text-xs animate-spin-slow" />
          <span className="text-[13px] font-semibold text-slate-700 tracking-tight">Update Routing Resource</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          UUID: {dataMenu?.id}
        </span>
      </div>

      <div className="p-6">
        <div className="bg-white border border-[#d2d2d7] rounded-md shadow-sm overflow-hidden">

          {/* Top Form Section */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">ឈ្មោះមីនុយ (Menu Name)</label>
                <Input
                  size="small"
                  value={menus.menu_name}
                  onChange={(e) => setMenus({ ...menus, menu_name: e.target.value })}
                  className="rounded border-[#d2d2d7] text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">ទីតាំងមីនុយ (Placement)</label>
                <select
                  className="w-full border rounded-sm border-gray-300 text-[13px]"
                  placeholder="Select System Layer"
                  value={menus?.menu_type}
                  onChange={(e) => setMenus({ ...menus, menu_type: e.target.value })}

                >
                  <option value={1}>SideBar Navigation</option>
                  <option value={2}>Home Dashboard</option>
                  <option value={3}>System Settings</option>
                  <option value={4}>Analytical Reports</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase ml-1">មីនុយ​ Path (Route URI)</label>
              <Input
                size="small"
                prefix={<FaLink className="text-slate-300 mr-1" />}
                value={menus.menu_path}
                onChange={(e) => setMenus({ ...menus, menu_path: e.target.value })}
                className="rounded border-[#d2d2d7] text-[13px]"
              />
            </div>
          </div>

          <Divider className="my-0" />

          {/* Icon/Media Management Section */}
          <div className="p-6 bg-slate-50/50">
            <label className="text-[11px] font-bold text-slate-600 uppercase block mb-3 ml-1">Resource Icon</label>
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="w-20 h-20 bg-white border-2 border-dashed border-[#d2d2d7] rounded-xl flex items-center justify-center overflow-hidden relative group">
                {iconPreview ? (
                  <img src={iconPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FaImage className="text-slate-200 text-2xl" />
                )}
                <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-[10px] font-bold">
                  CHANGE
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-[13px] font-bold text-slate-700">Update Visual Asset</h4>
                <p className="text-[11px] text-slate-500 mb-3">Upload a new icon to replace the current system asset.</p>
                <input
                  type="file"
                  id="icon-update-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <Button
                  size="small"
                  icon={<FaCloudUploadAlt />}
                  onClick={() => document.getElementById('icon-update-upload').click()}
                  className="text-[12px] rounded border-[#d2d2d7]"
                >
                  Upload New
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-end gap-2 border-t border-[#d2d2d7] pt-5">
          <form method="dialog">
            <button
              onClick={onAdd}
              className="px-5 py-1.5 rounded bg-white border border-[#d2d2d7] text-[12px] text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
          </form>
          <button
            onClick={() => setAlertBox(true)}
            className="px-6 py-1.5 rounded bg-[#007aff] border border-[#0070e0] text-[12px] text-white font-bold hover:bg-[#006ee0] active:bg-[#0062c9] shadow-sm transition-all flex items-center gap-2"
          >
            <FaCheck className="text-[10px]" /> Save Record
          </button>
        </div>
      </div>
    </section>
  );
};

export default UpdateMenus;