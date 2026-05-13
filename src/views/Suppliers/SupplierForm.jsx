import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { FaSave, FaTimes, FaMapMarkerAlt, FaTruck, FaEnvelope, FaPhone, FaMapMarkedAlt, FaTrash, FaEdit, FaInfoCircle } from "react-icons/fa";
import { IoMdCloudUpload } from "react-icons/io";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useOutletsContext } from "../../layouts/Management";
import {
  useGetAllSupplierQuery,
  useGetSupplierByIdQuery,
} from "../../../app/Features/suppliesSlice";
import api from "../../services/api";
import AlertBox from "../../services/AlertBox";
import Input from "../../utils/Input";
import RichSearch from "../../utils/RichSearch";
import Button from "../../utils/Button";

const SupplierForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const { setLoading, loading } = useOutletsContext();
  const isEditMode = Boolean(id);

  // State management
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [viewImage, setViewImage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [villages, setVillages] = useState([]);
  const [alertBox, setAlertBox] = useState(false);
  const [initialSupplier, setInitialSupplier] = useState(null);

  const [dataForm, setFormData] = useState({
    supplier_name: "",
    supplier_address: "",
    supplier_tel: "",
    supplier_email: "",
    description: "",
    province: "",
    province_id: null,
    district: "",
    district_id: null,
    commune: "",
    commune_id: null,
    village: "",
    village_id: null,
  });

  const [errors, setErrors] = useState({});

  const { data: supplierData, refetch } = useGetAllSupplierQuery(token);
  const { data: supplierDetails } = useGetSupplierByIdQuery({ id, token }, { skip: !isEditMode });

  // Load existing supplier data
  useEffect(() => {
    if (isEditMode && supplierData?.data) {
      const supplier = supplierData.data.find(s => String(s.supplier_id) === String(id));
      if (supplier) {
        setInitialSupplier(supplier);
        setViewImage(supplier.image || "");
        setFormData({
          supplier_name: supplier.supplier_name || "",
          supplier_address: supplier.supplier_address || "",
          supplier_tel: supplier.supplier_tel || "",
          supplier_email: supplier.supplier_email || "",
          description: supplier.description || "",
          province: supplier.provinces || "",
          province_id: supplier.province_id || null,
          district: supplier.districts || "",
          district_id: supplier.district_id || null,
          commune: supplier.communes || "",
          commune_id: supplier.commune_id || null,
          village: supplier.villages || "",
          village_id: supplier.village_id || null,
        });

        if (supplier.supplier_address && supplier.supplier_address.includes(',')) {
          const coords = supplier.supplier_address.split(',');
          setLocation({
            latitude: coords[0].trim(),
            longitude: coords[1].trim(),
          });
        }
      }
    }
  }, [isEditMode, id, supplierData]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await api.get("/provinces", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProvinces(res?.data?.data || []);
      } catch (err) { setProvinces([]); }
    };
    loadProvinces();
  }, [token]);

  // Hierarchy loading
  useEffect(() => {
    if (!dataForm.province_id) {
      setDistricts([]); setCommunes([]); setVillages([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await api.get(`/districts/${dataForm.province_id}`, {
          headers: { Authorization: `Bearer ${token}` }
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
          headers: { Authorization: `Bearer ${token}` }
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
          headers: { Authorization: `Bearer ${token}` }
        });
        setVillages(res.data.data || []);
      } catch (err) { setVillages([]); }
    };
    loadVillages();
  }, [dataForm.commune_id, token]);

  const validateForm = () => {
    const newErrors = {};
    if (!dataForm.supplier_name || dataForm.supplier_name.trim() === '') {
      newErrors.supplier_name = t('supplierNameRequired', 'Supplier name is required');
    }
    if (!dataForm.supplier_address || dataForm.supplier_address.trim() === '') {
      newErrors.supplier_address = t('supplierAddressRequired', 'Supplier address is required');
    }
    if (dataForm.supplier_tel && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(dataForm.supplier_tel)) {
      newErrors.supplier_tel = t('invalidPhoneFormat', 'Invalid phone format (8-15 digits)');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('fileTooLarge', 'File too large (Max 2MB)'));
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
    if (validateForm()) {
      setAlertBox(true);
    } else {
      toast.error(t('fixValidationErrors', 'Please fix validation errors'));
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setAlertBox(false);

    try {
      const formData = new FormData();
      Object.keys(dataForm).forEach(key => {
        formData.append(key, dataForm[key] || "");
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (isEditMode) {
        await api.post(`/suppliers/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(t('supplierUpdated', 'Supplier updated successfully!'));
      } else {
        await api.post("/suppliers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(t('supplierCreated', 'Supplier created successfully!'));
      }
      refetch();
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || t('operationFailed', 'Operation failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (val) => {
    setFormData(prev => ({ ...prev, supplier_address: val }));
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
      toast.error(t('geolocationNotSupported', 'Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newAddress = `${lat}, ${lng}`;
        setFormData(prev => ({ ...prev, supplier_address: newAddress }));
        setLocation({ latitude: lat, longitude: lng });
      },
      (err) => toast.error(err.message)
    );
  };

  const textareaClasses = "w-full px-4 py-2 bg-transparent text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-400 rounded-sm outline-none transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 min-h-[100px]";

  return (
    <div className="bg-transparent py-8">
      <div className="mx-auto px-2">
        <AlertBox
          isOpen={alertBox}
          title={t('confirm', "Confirmation")}
          message={isEditMode ? t('confirmUpdateSupplier', 'Update this supplier?') : t('confirmCreateSupplier', 'Create this supplier?')}
          onConfirm={handleConfirm}
          onCancel={() => setAlertBox(false)}
          confirmText={isEditMode ? t('update') : t('create')}
          cancelText={t('cancel')}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isEditMode ? t('editSupplier') : t('createNewSupplier')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? t('updateSupplierInfo') : t('addNewSupplierSystem')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image & Location */}
          <div className="lg:col-span-1 space-y-6">
            {/* Image Upload */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('supplierImage')}</h2>
                {viewImage && (
                  <button type="button" onClick={removeImage} className="text-red-500 hover:text-red-600 transition-colors">
                    <FaTrash />
                  </button>
                )}
              </div>
              
              <label htmlFor="image-upload" className="block cursor-pointer">
                <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  viewImage ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50/30' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}>
                  {viewImage ? (
                    <img src={viewImage} alt="Preview" className="max-h-64 rounded-lg object-contain mx-auto" />
                  ) : (
                    <div className="text-center py-8">
                      <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">{t('clickToUpload', 'Click to upload image')}</p>
                    </div>
                  )}
                </div>
              </label>
              <input type="file" id="image-upload" hidden accept="image/*" onChange={handleImageChange} />
            </div>

            
          </div>

          {/* Right Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FaTruck className="text-blue-500 text-xl" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('basicInformation')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('supplierName')} <span className="text-red-500">*</span></label>
                  <Input
                    value={dataForm.supplier_name}
                    onChange={(val) => setFormData(p => ({ ...p, supplier_name: val }))}
                    placeholder={t('enterSupplierName')}
                  />
                  {errors.supplier_name && <p className="text-red-500 text-xs">{errors.supplier_name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneNumber')}</label>
                  <Input
                    value={dataForm.supplier_tel}
                    onChange={(val) => setFormData(p => ({ ...p, supplier_tel: val }))}
                    placeholder="+1234567890"
                  />
                  {errors.supplier_tel && <p className="text-red-500 text-xs">{errors.supplier_tel}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailAddress')}</label>
                  <Input
                    type="email"
                    value={dataForm.supplier_email}
                    onChange={(val) => setFormData(p => ({ ...p, supplier_email: val }))}
                    placeholder="supplier@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('supplierAddress')} <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <Input
                      value={dataForm.supplier_address}
                      onChange={handleLocationChange}
                      placeholder="Address or lat, lng"
                    />
                    <button type="button" onClick={getCurrentLocation} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <FaMapMarkerAlt />
                    </button>
                  </div>
                  {errors.supplier_address && <p className="text-red-500 text-xs">{errors.supplier_address}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('description')}</label>
                  <textarea
                    className={textareaClasses}
                    value={dataForm.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder={t('addSupplierDescription', 'Add a brief description about the supplier')}
                  />
                </div>
              </div>
            </div>

            {/* Geographical Location */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FaMapMarkedAlt className="text-emerald-500 text-xl" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('geographicalLocation')}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('province')}</label>
                  <RichSearch
                    data={provinces}
                    value={dataForm.province_id}
                    onSelected={(id) => {
                      const p = provinces.find(x => x.id === id || x.province_id === id);
                      setFormData(prev => ({ 
                        ...prev, province_id: id, province: p?.khmer_name || p?.name || "",
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
                        ...prev, district_id: id, district: d?.khmer_name || d?.name || "",
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
                        ...prev, commune_id: id, commune: c?.khmer_name || c?.name || "",
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
                        ...prev, village_id: id, village: v?.khmer_name || v?.name || ""
                      }));
                    }}
                    keyFields={{ id: 'id', title: 'khmer_name', subtitle: 'name' }}
                    placeholder={t('selectVillage')}
                    disabled={!villages.length}
                  />
                </div>
              </div>
            </div>
            {/* Location Preview */}
            <div className="bg-primary p-4 rounded-sm">
              <div className="flex items-center gap-3 mb-4">
                <FaMapMarkedAlt className="text-blue-500 text-xl" />
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('locationPreview')}</h2>
              </div>
              
              {location.latitude && location.longitude ? (
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-48">
                    <iframe
                      src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
                      width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Location Map"
                    ></iframe>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {location.latitude}, {location.longitude}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FaMapMarkerAlt className="text-3xl mx-auto mb-2 opacity-50" />
                  <p>{t('noLocationSet', 'No location coordinates set')}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="danger" outline onClick={() => navigate(-1)} disabled={loading}>
                <FaTimes /> {t('cancel')}
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {isEditMode ? <FaEdit /> : <FaSave />}
                {loading ? t('saving') : isEditMode ? t('updateSupplier') : t('createSupplier')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
