import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FaSave, FaTimes, FaMapMarkerAlt, FaUser, FaEnvelope, FaPhone, FaMapMarkedAlt, FaTrash, FaEdit, FaTruck } from "react-icons/fa";
import { IoMdCloudUpload } from "react-icons/io";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";
import { useOutletsContext } from "../../layouts/Management";
import {
  useCreateCustomerMutation,
  useGetAllCustomerQuery, 
  useUpdateCustomerMutation,
} from "@/features/customers/customersSlice";
import api from "../../services/api";
import AlertBox from "../../services/AlertBox";
import Input from "../../utils/Input";
import RichSearch from "../../utils/RichSearch";
import Button from "../../utils/Button";
import { useNotify } from "../../utils/NotificationProvider";
import { motion } from "framer-motion";
import { getToken } from '@/utils/tokenStore';
const MENU_ID = 15;
const CustomerForm = () => {
  const { t } = useTranslation();
  const notify = useNotify();
  const token = getToken();
  const { id } = useParams();
  const navigate = useNavigate();
  const { setLoading, loading } = useOutletsContext();
  const isUpdate = Boolean(id);
  const initialData = JSON.parse(localStorage.getItem("itemEdit")) || null;

  // State management
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [viewImage, setViewImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [villages, setVillages] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  
  const [dataForm, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_tel: "",
    customer_address: "",
    province_id: null,
    district_id: null,
    commune_id: null,
    village_id: null,
    provinces: "",
    districts: "",
    communes: "",
    villages: "",
  });

  const [errors, setErrors] = useState({});

  const { refetch } = useGetAllCustomerQuery(token);
  const [updateCustomer] = useUpdateCustomerMutation();

  // Initialize data in edit mode
  useEffect(() => {
    if (isUpdate && initialData) {
      setViewImage(initialData.image || "");
      setFormData({
        customer_name: initialData.customer_name || "",
        customer_email: initialData.customer_email || "",
        customer_tel: initialData.customer_tel || "",
        customer_address: initialData.customer_address || "",
        province_id: initialData.province_id || null,
        district_id: initialData.district_id || null,
        commune_id: initialData.commune_id || null,
        village_id: initialData.village_id || null,
        provinces: initialData.provinces || "",
        districts: initialData.districts || "",
        communes: initialData.communes || "",
        villages: initialData.villages || "",
      });

      if (initialData.customer_address && initialData.customer_address.includes(',')) {
        const coords = initialData.customer_address.split(',');
        setLocation({
          latitude: coords[0].trim(),
          longitude: coords[1].trim(),
        });
      }
    }
  }, [isUpdate]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await api.get("/provinces", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProvinces(res?.data?.data || []);
      } catch (err) {
        setProvinces([]);
      }
    };
    loadProvinces();
  }, [token]);

  // Hierarchy loading logic
  useEffect(() => {
    if (!dataForm.province_id) {
      setDistricts([]); setCommunes([]); setVillages([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await api.get(`/districts/${dataForm.province_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDistricts(res.data.data || []);
      } catch (err) { setDistricts([]); }
    };
    loadDistricts();
  }, [dataForm.province_id, token]);

  useEffect(() => {
    if (!dataForm.district_id) {
      setCommunes([]); setVillages([]);
      return;
    }
    const loadCommunes = async () => {
      try {
        const res = await api.get(`/communes/${dataForm.district_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCommunes(res.data.data || []);
      } catch (err) { setCommunes([]); }
    };
    loadCommunes();
  }, [dataForm.district_id, token]);

  useEffect(() => {
    if (!dataForm.commune_id) {
      setVillages([]);
      return;
    }
    const loadVillages = async () => {
      try {
        const res = await api.get(`/villages/${dataForm.commune_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVillages(res.data.data || []);
      } catch (err) { setVillages([]); }
    };
    loadVillages();
  }, [dataForm.commune_id, token]);

  const validateForm = () => {
    const newErrors = {};
    if (!dataForm.customer_name || dataForm.customer_name.trim() === '') {
      newErrors.customer_name = t('customerNameRequired', 'Customer name is required');
    }
    if (dataForm.customer_tel && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(dataForm.customer_tel)) {
      newErrors.customer_tel = t('invalidPhoneFormat', 'Invalid phone format (8-15 digits)');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        notify.error(t('error'), t('fileTooLarge', 'File too large (Max 2MB)'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setViewImage(e.target.result);
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const removeImage = () => {
    setViewImage("");
    setImageFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmissionError(null);
    if (validateForm()) {
      setAlertBox(true);
    } else {
      notify.error(t('error'), t('fixValidationErrors', 'Please fix validation errors'));
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setAlertBox(false);
    setSubmissionError(null);

    try {
      const formData = new FormData();
      Object.keys(dataForm).forEach(key => {
        formData.append(key, dataForm[key] || "");
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (isUpdate) {
        await updateCustomer({
          id: initialData.customer_id,
          itemData: formData,
          token,
        }).unwrap();
        notify.success(t('success'), t('customerUpdated', 'Customer updated successfully!'));
      } else {
        await api.post("customers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        notify.success(t('success'), t('customerCreated', 'Customer created successfully!'));
      }
      refetch();
      navigate(-1);
      localStorage.removeItem("itemEdit");
    } catch (err) {
      const errMsg = err?.data?.message || err?.message || t('operationFailed', 'Operation failed');
      setSubmissionError(errMsg);
      notify.error(t('error'), errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (val) => {
    setFormData(prev => ({ ...prev, customer_address: val }));
    if (val.includes(',')) {
      const coords = val.split(',');
      setLocation({
        latitude: coords[0].trim(),
        longitude: coords[1].trim(),
      });
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      notify.error(t('error'), t('geolocationNotSupported', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newAddress = `${lat}, ${lng}`;
        setFormData(prev => ({ ...prev, customer_address: newAddress }));
        setLocation({ latitude: lat, longitude: lng });
      },
      (err) => notify.error(t('error'), err.message)
    );
  };

  return (
    <div className="view-page bg-transparent transition-colors">
        <AlertBox
          isOpen={alertBox}
          title={t('confirm', "Confirmation")}
          message={isUpdate ? t('confirmUpdateCustomer', 'Update this customer?') : t('confirmCreateCustomer', 'Create this customer?')}
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText={isUpdate ? t('update') : t('create')}
          cancelText={t('cancel')}
        />

        <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
                        {isUpdate ? t('editCustomer') : t('createNewCustomer')}
                    </h1>
                    <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
                        {isUpdate ? t('updateCustomerInfo') : t('addNewCustomerSystem')}
                    </p>
                </div>
                <div className="flex justify-center items-center gap-2">
                    <Button
                    actionType="is_modify"
                    menuId={MENU_ID}
                        onClick={handleSubmit}
                        disabled={loading}
                        variant='primary'
                    >
                        {isUpdate ? <FaEdit /> : <FaSave />}
                        {loading ? t('saving') : isUpdate ? t('update') : t('create')}
                    </Button>
                    <Button
                        variant='cancel'
                        onClick={() => navigate(-1)}
                        disabled={loading}
                    >
                        <FaTimes />{t('back')}
                    </Button>
                </div>
            </div>

            {submissionError && (
                <div className="px-4 border-x dark:border-gray-500 border-gray-200">
                    <Alert
                        message={t('error', 'Error')}
                        description={submissionError}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setSubmissionError(null)}
                        className="my-4"
                    />
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    {/* Left Column: Image & Basic Info */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                                    <FaUser className="text-cyan-500" />
                                    {t('basicInformation')}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('customerName')} <span className="text-red-500">*</span></label>
                                        <Input
                                            value={dataForm.customer_name}
                                            onChange={(val) => setFormData(p => ({ ...p, customer_name: val }))}
                                            placeholder={t('enterCustomerName')}
                                        />
                                        {errors.customer_name && <p className="text-red-500 text-xs">{errors.customer_name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneNumber')}</label>
                                        <Input
                                            value={dataForm.customer_tel}
                                            onChange={(val) => setFormData(p => ({ ...p, customer_tel: val }))}
                                            placeholder="+1234567890"
                                        />
                                        {errors.customer_tel && <p className="text-red-500 text-xs">{errors.customer_tel}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailAddress')}</label>
                                        <Input
                                            type="email"
                                            value={dataForm.customer_email}
                                            onChange={(val) => setFormData(p => ({ ...p, customer_email: val }))}
                                            placeholder="email@example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressCoordinates')}</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={dataForm.customer_address}
                                                onChange={handleLocationChange}
                                                placeholder="lat, lng"
                                            />
                                            <button type="button" onClick={getCurrentLocation} className="p-2 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 rounded-lg hover:bg-cyan-200 transition-colors">
                                                <FaMapMarkerAlt />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <div className="bg-gray-100 p-4 border border-t-0 dark:bg-transparent dark:border-gray-500 border-gray-200">
                                <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                                    <FaMapMarkedAlt className="text-emerald-500" />
                                    {t('geographicalLocation')}
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('province')}</label>
                                        <RichSearch
                                            data={provinces}
                                            value={dataForm.province_id}
                                            onSelected={(id) => {
                                                const p = provinces.find(x => x.id === id || x.province_id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, province_id: id, provinces: p?.khmer_name || p?.name || "",
                                                    district_id: null, commune_id: null, village_id: null 
                                                }));
                                            }}
                                            keyFields={{ id: 'id', title: 'khmer_name', subtitle: 'name' }}
                                            placeholder={t('selectProvince')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('district')}</label>
                                        <RichSearch
                                            data={districts}
                                            value={dataForm.district_id}
                                            onSelected={(id) => {
                                                const d = districts.find(x => x.id === id || x.district_id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, district_id: id, districts: d?.khmer_name || d?.name || "",
                                                    commune_id: null, village_id: null 
                                                }));
                                            }}
                                            keyFields={{ id: 'id', title: 'khmer_name', subtitle: 'name' }}
                                            placeholder={t('selectDistrict')}
                                            disabled={!districts.length}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('commune')}</label>
                                        <RichSearch
                                            data={communes}
                                            value={dataForm.commune_id}
                                            onSelected={(id) => {
                                                const c = communes.find(x => x.id === id || x.commune_id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, commune_id: id, communes: c?.khmer_name || c?.name || "",
                                                    village_id: null 
                                                }));
                                            }}
                                            keyFields={{ id: 'id', title: 'khmer_name', subtitle: 'name' }}
                                            placeholder={t('selectCommune')}
                                            disabled={!communes.length}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('village')}</label>
                                        <RichSearch
                                            data={villages}
                                            value={dataForm.village_id}
                                            onSelected={(id) => {
                                                const v = villages.find(x => x.id === id || x.village_id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, village_id: id, villages: v?.khmer_name || v?.name || ""
                                                }));
                                            }}
                                            keyFields={{ id: 'id', title: 'khmer_name', subtitle: 'name' }}
                                            placeholder={t('selectVillage')}
                                            disabled={!villages.length}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Image & Location Preview */}
                    <div className="lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="bg-gray-100 p-4 border lg:border-l-0 dark:bg-transparent dark:border-gray-500 border-gray-200 h-full">
                                <div className="space-y-6 grid grid-cols-2 gap-3 lg:block">
                                    {/* Image Upload */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-md font-semibold dark:text-white flex items-center gap-2">
                                                <IoMdCloudUpload className="text-cyan-500" />
                                                {t('customerImage')}
                                            </h3>
                                            {viewImage && (
                                                <button type="button" onClick={removeImage} className="text-red-500 hover:text-red-600 transition-colors text-sm">
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <label htmlFor="image-upload" className="block cursor-pointer">
                                            <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-sm transition-all duration-200 ${
                                                viewImage ? 'border-cyan-300 dark:border-cyan-500/50 bg-cyan-50/30' : 'border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                                            }`}>
                                                {viewImage ? (
                                                    <img src={viewImage} alt="Preview" className="max-h-48 rounded-sm object-contain mx-auto" />
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <IoMdCloudUpload className="text-4xl text-cyan-400 mx-auto mb-2" />
                                                        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('clickToUpload')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                        <input type="file" id="image-upload" hidden accept="image/*" onChange={handleImageChange} />
                                    </div>

                                    {/* Location Preview */}
                                    <div className="pt-4 lg:border-t border-gray-200 dark:border-gray-600">
                                        <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                                            <FaMapMarkedAlt className="text-cyan-500" />
                                            {t('locationPreview')}
                                        </h3>
                                        
                                        {location.latitude && location.longitude ? (
                                            <div className="space-y-2">
                                                <div className="rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 h-48">
                                                    <iframe
                                                        src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
                                                        width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location Map"
                                                    ></iframe>
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">
                                                    {location.latitude}, {location.longitude}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-sm">
                                                <FaMapMarkerAlt className="text-2xl mx-auto mb-2 opacity-50" />
                                                <p className="text-xs">{t('noLocationSet')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </form>
        </div>
    </div>
  );
};

export default CustomerForm;
