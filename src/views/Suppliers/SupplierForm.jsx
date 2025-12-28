import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { FaSave, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../services/api";
import { toast } from "react-toastify";
import {
  useGetAllSupplierQuery,
  useGetSupplierByIdQuery,
} from "../../../app/Features/suppliesSlice";
import { IoMdCloudUpload } from "react-icons/io";

const SupplierForm = () => {
  const [location, setLocation] = React.useState({
    latitude: null,
    longitude: null,
  });
  const [viewImage, setViewImage] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [villages, setVillages] = useState([]);
  const [initialSupplier, setInitialSupplier] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isEditMode = !!id;
  const { data: supplierData, refetch } = useGetAllSupplierQuery(token);
  const { data: suppliers } = useGetSupplierByIdQuery({ id, token });

  const [dataForm, setFormData] = useState({
    image: null,
    supplier_name: "",
    supplier_address: "",
    supplier_tel: "",
    supplier_email: "",
    province: null,
    province_id: null,
    district: null,
    district_id: null,
    commune: null,
    commune_id: null,
    village: null,
    village_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch supplier data for edit mode
  useEffect(() => {
    if (isEditMode && suppliers?.data) {
      const supplier = supplierData?.data?.find(s => s.supplier_id == id);
      console.log(supplier);
      setViewImage(supplier?.image || "");
      setInitialSupplier(supplier || null);
      setFormData({
        image: null,
        supplier_name: supplier?.supplier_name || "",
        supplier_address: supplier?.supplier_address || "",
        supplier_tel: supplier?.supplier_tel || "",
        supplier_email: supplier?.supplier_email || "",
        province: supplier?.provinces || null,
        district: supplier?.districts || null,
        commune: supplier?.communes || null,
        village: supplier?.villages || null,
        province_id: supplier?.province_id || null,
        district_id: supplier?.district_id || null,
        commune_id: supplier?.commune_id || null,
        village_id: supplier?.village_id || null,
      });
    }
  }, [isEditMode, suppliers, supplierData, id]);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const res = await api.get("/provinces", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProvinces(res?.data?.data || []);
      } catch (err) {
        setProvinces([]);
      }
    };
    loadProvinces();
  }, [token]);

  // When province changes, fetch districts
  useEffect(() => {
    const provinceId = dataForm.province_id;
    if (!provinceId) {
      setDistricts([]);
      setCommunes([]);
      setVillages([]);
      return;
    }
    const run = async () => {
      try {
        const res = await api.get(`/districts/${provinceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDistricts(res.data.data || []);
      } catch (err) {
        setDistricts([]);
      }

      if (isEditMode && initialSupplier?.district_id) {
        setFormData((p) => ({ ...p, district_id: initialSupplier.district_id }));
      } else {
        setFormData((p) => ({ ...p, district_id: null, commune_id: null, village_id: null }));
      }
    };
    run();
  }, [dataForm.province_id, isEditMode, initialSupplier, token]);

  // When district changes, fetch communes
  useEffect(() => {
    const districtId = dataForm.district_id;
    if (!districtId) {
      setCommunes([]);
      setVillages([]);
      return;
    }
    const run = async () => {
      try {
        const res = await api.get(`/communes/${districtId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCommunes(res.data.data || []);
      } catch (err) {
        setCommunes([]);
      }

      if (isEditMode && initialSupplier?.commune_id) {
        setFormData((p) => ({ ...p, commune_id: initialSupplier.commune_id }));
      } else {
        setFormData((p) => ({ ...p, commune_id: null, village_id: null }));
      }
    };
    run();
  }, [dataForm.district_id, isEditMode, initialSupplier, token]);

  // When commune changes, fetch villages
  useEffect(() => {
    const communeId = dataForm.commune_id;
    if (!communeId) {
      setVillages([]);
      return;
    }
    const run = async () => {
      try {
        const res = await api.get(`/villages/${communeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setVillages(res.data.data || []);
      } catch (err) {
        setVillages([]);
      }

      if (isEditMode && initialSupplier?.village_id) {
        setFormData((p) => ({ ...p, village_id: initialSupplier.village_id }));
      } else {
        setFormData((p) => ({ ...p, village_id: null }));
      }
    };
    run();
  }, [dataForm.commune_id, isEditMode, initialSupplier, token]);

  // Validation functions
  const validateField = (name, value) => {
    const newFieldErrors = { ...fieldErrors };

    switch (name) {
      case 'supplier_name':
        if (!value || value.trim() === '') {
          newFieldErrors.supplier_name = 'Supplier name is required';
        } else if (value.length < 2) {
          newFieldErrors.supplier_name = 'Supplier name must be at least 2 characters';
        } else if (value.length > 100) {
          newFieldErrors.supplier_name = 'Supplier name must be less than 100 characters';
        } else {
          delete newFieldErrors.supplier_name;
        }
        break;

      case 'supplier_address':
        if (!value || value.trim() === '') {
          newFieldErrors.supplier_address = 'Supplier address is required';
        } else if (value.length < 5) {
          newFieldErrors.supplier_address = 'Supplier address must be at least 5 characters';
        } else {
          delete newFieldErrors.supplier_address;
        }
        break;

      case 'supplier_tel':
        if (value && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(value)) {
          newFieldErrors.supplier_tel = 'Please enter a valid phone number (8-15 digits)';
        } else {
          delete newFieldErrors.supplier_tel;
        }
        break;

      case 'supplier_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newFieldErrors.supplier_email = 'Please enter a valid email address';
        } else {
          delete newFieldErrors.supplier_email;
        }
        break;

      case 'image':
        if (!isEditMode && !value) {
          newFieldErrors.image = 'Supplier image is required';
        } else {
          delete newFieldErrors.image;
        }
        break;

      default:
        break;
    }

    setFieldErrors(newFieldErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    const newFieldErrors = { ...fieldErrors };

    // Required field validation
    if (!dataForm.supplier_name || dataForm.supplier_name.trim() === '') {
      newErrors.supplier_name = "Supplier name is required.";
      newFieldErrors.supplier_name = 'Supplier name is required';
    } else if (dataForm.supplier_name.length < 2) {
      newErrors.supplier_name = "Supplier name must be at least 2 characters.";
      newFieldErrors.supplier_name = 'Supplier name must be at least 2 characters';
    }

    if (!dataForm.supplier_address || dataForm.supplier_address.trim() === '') {
      newErrors.supplier_address = "Supplier address is required.";
      newFieldErrors.supplier_address = 'Supplier address is required';
    } else if (dataForm.supplier_address.length < 5) {
      newErrors.supplier_address = "Supplier address must be at least 5 characters.";
      newFieldErrors.supplier_address = 'Supplier address must be at least 5 characters';
    }

    // Phone validation
    if (dataForm.supplier_tel && !/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(dataForm.supplier_tel)) {
      newErrors.supplier_tel = "Please enter a valid phone number (8-15 digits).";
      newFieldErrors.supplier_tel = 'Please enter a valid phone number (8-15 digits)';
    }

    // Email validation
    if (dataForm.supplier_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataForm.supplier_email)) {
      newErrors.supplier_email = "Please enter a valid email address.";
      newFieldErrors.supplier_email = 'Please enter a valid email address';
    }

    // Image validation for new suppliers
    if (!isEditMode && !dataForm.image) {
      newErrors.image = "Supplier image is required for new suppliers.";
      newFieldErrors.image = 'Supplier image is required';
    }

    setFieldErrors(newFieldErrors);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ general: "Geolocation is not supported by your browser" });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newAddress = `${position.coords.latitude}, ${position.coords.longitude}`;
        setFormData((prev) => ({
          ...prev,
          supplier_address: newAddress,
        }));
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setErrors({});
        setLoading(false);
        validateField('supplier_address', newAddress);
      },
      (err) => {
        setErrors({ general: err.message });
        setLoading(false);
      }
    );
  };

  const handleInputChange = (e) => {

    const { name, value, title } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (title != '') {
      const selectedOption = e.target.options[e.target.selectedIndex];
      setFormData((prev) => ({ ...prev, [title]: selectedOption.dataset.id }));
    }

    validateField(name, value);

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name === "supplier_address") {
      setLocation({
        latitude: value.split(",")[0]?.trim(),
        longitude: value.split(",")[1]?.trim(),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix all validation errors before submitting.");
      const firstErrorField = Object.keys(fieldErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.focus();
        }
      }
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("supplier_name", dataForm.supplier_name.trim());
      formData.append("supplier_address", dataForm.supplier_address.trim());
      formData.append("supplier_tel", dataForm.supplier_tel?.trim() || "");
      formData.append("supplier_email", dataForm.supplier_email?.trim() || "");
      formData.append("provinces", dataForm.province ?? "");
      formData.append("districts", dataForm.district ?? "");
      formData.append("communes", dataForm.commune ?? "");
      formData.append("villages", dataForm.village ?? "");
      formData.append("province_id", dataForm.province_id ?? "");
      formData.append("district_id", dataForm.district_id ?? "");
      formData.append("commune_id", dataForm.commune_id ?? "");
      formData.append("village_id", dataForm.village_id ?? "");
      if (dataForm.image) {
        formData.append("image", dataForm.image);
      }

      if (isEditMode) {
        await api.post(`/suppliers/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Supplier updated successfully!");
      } else {
        await api.post("/suppliers", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Supplier created successfully!");
      }
      refetch();
      navigate("/dashboard/suppliers");
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
        `Error ${isEditMode ? "updating" : "creating"} supplier.`;
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeUpload = (e) => {
    const fileUpload = e.target.files[0];
    if (fileUpload) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(fileUpload.type)) {
        setErrors(prev => ({ ...prev, image: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' }));
        return;
      }

      if (fileUpload.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 2MB' }));
        return;
      }

      setViewImage(URL.createObjectURL(fileUpload));
      setFormData((p) => {
        return { ...p, image: fileUpload };
      });
      setErrors(prev => ({ ...prev, image: '' }));
      setFieldErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const removeImage = () => {
    setViewImage("");
    setFormData(p => ({ ...p, image: null }));
    if (!isEditMode) {
      setErrors(prev => ({ ...prev, image: 'Supplier image is required' }));
      setFieldErrors(prev => ({ ...prev, image: 'Supplier image is required' }));
    }
  };

  // Helper function to get input classes with error styling
  const getInputClass = (fieldName) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";
    return fieldErrors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  const getSelectClass = (fieldName) => {
    const baseClass = "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white";
    return fieldErrors[fieldName]
      ? `${baseClass} border-red-500 bg-red-50`
      : `${baseClass} border-gray-300 hover:border-gray-400`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className=" mx-auto px-2">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Edit Supplier" : "Create New Supplier"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update supplier information and details"
              : "Add a new supplier to your system"
            }
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-2xl p-4"
        >
          {/* Validation Summary */}
          {(Object.keys(errors).length > 0 || Object.keys(fieldErrors).length > 0) && (
            <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <h3 className="text-red-800 font-semibold text-lg">Please fix the following errors:</h3>
              </div>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {Object.values(errors).map((error, index) => (
                  error && <li key={index} className="ml-4">{error}</li>
                ))}
                {Object.values(fieldErrors).map((error, index) => (
                  error && <li key={`field-${index}`} className="ml-4">{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Upload & Location */}
            <div className="space-y-8">
              {/* Image Upload Section */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Supplier Image {!isEditMode && <span className="text-red-500">*</span>}
                  </h2>
                  {viewImage && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <FaTimes className="text-xs" />
                      Remove
                    </button>
                  )}
                </div>

                <label
                  htmlFor="up-image-item"
                  className={`block cursor-pointer transition-all duration-200 ${fieldErrors.image ? 'ring-2 ring-red-500 ring-offset-2 rounded-lg' : ''
                    }`}
                >
                  <div className={`w-full flex justify-center items-center p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${fieldErrors.image
                    ? 'border-red-500 bg-red-25'
                    : viewImage
                      ? 'border-blue-300 bg-blue-25'
                      : 'border-gray-400 hover:border-blue-400 hover:bg-blue-25'
                    }`}>
                    {viewImage ? (
                      <div className="text-center">
                        <img
                          className="h-48 w-48 object-cover rounded-lg shadow-md mx-auto"
                          src={viewImage}
                          alt="Supplier preview"
                        />
                        <p className="text-sm text-gray-600 mt-3">Click to change image</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <IoMdCloudUpload className="text-5xl text-blue-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Upload supplier image</h3>
                        <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                        <div className="px-6 py-2 bg-blue-500 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-600 transition-colors">
                          Browse files
                        </div>
                      </div>
                    )}
                  </div>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={changeUpload}
                  id="up-image-item"
                  hidden
                  name="up-image-item"
                />

                {fieldErrors.image && (
                  <div className="flex items-center gap-2 text-red-500 text-sm mt-3">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {fieldErrors.image}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 text-center">
                  Max size 2MB • JPEG, PNG, GIF, WebP
                  {!isEditMode && <span className="text-red-500 ml-1">* Required</span>}
                </p>
              </div>

              {/* Location Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FaMapMarkerAlt className="text-blue-500 text-xl" />
                  <h2 className="text-lg font-semibold text-gray-800">Location Services</h2>
                </div>

                <button
                  type="button"
                  onClick={getLocation}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${loading
                    ? "bg-gray-400 cursor-not-allowed text-gray-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                >
                  <FaMapMarkerAlt className="text-lg" />
                  {loading ? "Fetching Location..." : "Get My Current Location"}
                </button>

                {errors.general && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {errors.general}
                    </div>
                  </div>
                )}

                {location.latitude && location.longitude && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Location Preview:</h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <iframe
                        src={`https://www.google.com/maps?q=${location.latitude},${location.longitude}&hl=es;z=14&output=embed`}
                        width="100%"
                        height="200"
                        className="rounded-lg border-0"
                        loading="lazy"
                        title="Supplier location map"
                      ></iframe>
                      <div className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">Coordinates:</span> {location.latitude}, {location.longitude}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="supplier_name"
                      value={dataForm.supplier_name}
                      onChange={handleInputChange}
                      className={getInputClass('supplier_name')}
                      required
                      maxLength={100}
                      placeholder="Enter supplier full name"
                    />
                    {fieldErrors.supplier_name && (
                      <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {fieldErrors.supplier_name}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2 flex justify-between">
                      <span>Required field</span>
                      <span>{dataForm.supplier_name.length}/100 characters</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="supplier_address"
                      value={dataForm.supplier_address}
                      onChange={handleInputChange}
                      className={`${getInputClass('supplier_address')} resize-none`}
                      required
                      rows={3}
                      placeholder="Enter complete supplier address or use location service"
                    />
                    {fieldErrors.supplier_address && (
                      <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        {fieldErrors.supplier_address}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="supplier_tel"
                        value={dataForm.supplier_tel}
                        onChange={handleInputChange}
                        className={getInputClass('supplier_tel')}
                        placeholder="+1234567890"
                        maxLength={15}
                      />
                      {fieldErrors.supplier_tel && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {fieldErrors.supplier_tel}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="supplier_email"
                        value={dataForm.supplier_email}
                        onChange={handleInputChange}
                        className={getInputClass('supplier_email')}
                        placeholder="supplier@example.com"
                      />
                      {fieldErrors.supplier_email && (
                        <div className="flex items-center gap-2 text-red-500 text-sm mt-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {fieldErrors.supplier_email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Hierarchy */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Geographical Location</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                    <select
                      name="province"
                      title="province_id"
                      id={dataForm.province_id ?? ""}
                      value={dataForm.province ?? ""}
                      onChange={handleInputChange}
                      className={getSelectClass('province')}
                    >
                      <option value="">Select Province</option>
                      {provinces?.map((p) => (
                        <option key={p.id || p.province_id} value={p.khmer_name ?? p.name} data-id={p.id || p.province_id}>
                          {p.khmer_name} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                    <select
                      name="district"
                      title="district_id"
                      id={dataForm.district_id ?? ""}
                      value={dataForm.district ?? ""}
                      onChange={handleInputChange}
                      className={getSelectClass('district')}
                      disabled={!districts.length}
                    >
                      <option value="">Select District</option>
                      {districts.map((d) => (
                        <option key={d.id || d.district_id} value={d.khmer_name ?? d.name} data-id={d.id || d.district_id}>
                          {d.khmer_name} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
                    <select
                      name="commune"
                      title="commune_id"
                      id={dataForm.commune_id ?? ""}
                      value={dataForm.commune ?? ""}
                      onChange={handleInputChange}
                      className={getSelectClass('commune')}
                      disabled={!communes.length}
                    >
                      <option value="">Select Commune</option>
                      {communes.map((c) => (
                        <option key={c.id || c.commune_id} value={c.khmer_name ?? c.name} data-id={c.id || c.commune_id}>
                          {c.khmer_name} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
                    <select
                      name="village"
                      title="village_id"
                      id={dataForm.village_id ?? ""}
                      value={dataForm.village ?? ""}
                      onChange={handleInputChange}
                      className={getSelectClass('village')}
                      disabled={!villages.length}
                    >
                      <option value="">Select Village</option>
                      {villages.map((v) => (
                        <option key={v.id || v.village_id} value={v.khmer_name ?? v.name} data-id={v.id || v.village_id}>
                          {v.khmer_name} - {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
            <Link
              to="/dashboard/suppliers"
              className="px-6 py-3 border border-gray-300 flex gap-2 items-center text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer font-medium"
            >
              <FaTimes />
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 gap-3 flex items-center space-x-2 disabled:opacity-50 transition-all duration-200 cursor-pointer font-medium shadow-lg hover:shadow-xl"
            >
              <FaSave className="text-lg" />
              {loading
                ? "Saving..."
                : isEditMode
                  ? "Update Supplier"
                  : "Create Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;