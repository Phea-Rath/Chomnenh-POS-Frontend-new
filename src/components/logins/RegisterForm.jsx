import React, { useEffect, useState } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { FiUser, FiPhone, FiLock, FiCalendar } from "react-icons/fi";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import api from "../../services/api";
import { useNavigate } from "react-router";
import { Button, DatePicker, InputNumber, Space, message, Card } from "antd";
import dayjs from "dayjs";
import { useGetAllUserQuery, useGetUserLoginQuery } from "../../../app/Features/usersSlice";
import { toast } from "react-toastify";
import { useGetAllRoleQuery } from "../../../app/Features/rolesSlice";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const RegisterForm = () => {
  const { t } = useTranslation();
  const { darkMode } = useOutletsContext();

  const [viewImage, setViewImage] = useState(null);
  const [fileImage, setFileImage] = useState();
  const navigator = useNavigate();
  const toDay = new Date();

  const { setLoading, reload, setReload } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [users, setUsers] = useState({
    profile_id: 0,
    created_by: 0,
    status: 1,
    role: "",
    start_date: `${toDay.getFullYear()}-${toDay.getMonth() + 1}-${toDay.getDate()}`,
    term: 1,
  });

  const token = localStorage.getItem("token");
  const { data } = useGetUserLoginQuery(token);
  const { data: roles } = useGetAllRoleQuery(token);
  const { refetch } = useGetAllUserQuery(token);

  const [startDate, setStartDate] = useState(dayjs());
  const [term, setTerm] = useState(1);
  const [endDate, setEndDate] = useState(dayjs().add(1, "month"));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const newEndDate = startDate?.add(term, "month");
    const date = new Date(newEndDate);
    setUsers(prev => ({ ...prev, end_date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` }));
    setEndDate(newEndDate);
  }, [startDate, term]);

  const validateForm = () => {
    const newErrors = {};
    if (!users.username?.trim()) newErrors.username = "Username is required";
    if (!users.password) newErrors.password = "Password is required";
    else if (users.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (users.password !== users.confirm_password) newErrors.confirm_password = "Passwords do not match";
    if (!users.phone_number?.trim()) newErrors.phone_number = "Phone number is required";
    else if (!/^[0-9+\-\s]+$/.test(users.phone_number)) newErrors.phone_number = "Invalid phone number";
    if (!users.role_id) newErrors.role_id = "Please select a role";
    if (users.role_id == 3 && !users.start_date) newErrors.start_date = "Start date is required";
    if (!fileImage) newErrors.image = "Profile image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    const dateObj = new Date(date);
    setUsers(prev => ({ ...prev, start_date: `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}` }));
  };

  const handleTermChange = (value) => {
    setTerm(value);
    setUsers(prev => ({ ...prev, term: value }));
  };

  const handleEndDateChange = (date) => {
    const dateObj = new Date(date);
    setUsers(prev => ({ ...prev, end_date: `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}` }));
    setEndDate(date);
    const newTerm = date.diff(startDate, "month");
    setUsers(prev => ({ ...prev, term: newTerm }));
    setTerm(newTerm);
  };

  function changeUpload(e) {
    const fileUpload = e.target.files[0];
    if (!fileUpload) return;
    if (fileUpload.size > 3 * 1024 * 1024) { toast.error("Image size exceeds 3MB limit"); return; }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(fileUpload.type)) { toast.error("Please upload a valid image (JPEG, PNG, GIF)"); return; }
    setFileImage(fileUpload);
    setViewImage(URL.createObjectURL(fileUpload));
    setErrors(prev => ({ ...prev, image: undefined }));
  }

  function handleSubmit() {
    if (!validateForm()) { toast.error("Please fix the errors in the form"); return; }
    setAlertBox(true);
  }

  function handleCancel() { setAlertBox(false); }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);
    const formData = new FormData();
    formData.append("image", fileImage);
    formData.append("username", users?.username);
    formData.append("password", users?.password);
    formData.append("phone_number", users?.phone_number);
    formData.append("role", users?.role);
    formData.append("role_id", Number(users?.role_id));
    formData.append("status", users?.status);
    formData.append("created_by", users?.created_by);
    if (users?.role_id == 3) {
      formData.append("start_date", users?.start_date);
      formData.append("end_date", users?.end_date);
      formData.append("term", users?.term);
    }
    try {
      const response = await api.post("/register", formData, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status == 200) {
        setReload(!reload); refetch();
        toast.success(response.data.message || "User created successfully");
        setLoading(false);
        navigator(-1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "An error occurred while creating the user");
      setLoading(false);
    }
  }

  const handleInputChange = (field, value) => {
    setUsers(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleRoleChange = (value) => {
    const role_name = roles?.data?.find(role => role.role_id == value)?.role_name;
    const updatedUsers = { ...users, role_id: value, role: role_name };
    if (value != 3) { updatedUsers.start_date = ""; updatedUsers.term = ""; }
    setUsers(updatedUsers);
    if (errors.role_id) setErrors(prev => ({ ...prev, role_id: undefined }));
  };

  const inputCls = (err) =>
    `w-full px-4 py-3 border rounded-lg outline-none transition-all text-sm
     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
     placeholder-gray-400 dark:placeholder-gray-500
     ${err ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30'}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-transparent py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AlertBox
          isOpen={alertBox}
          title={t('confirmation')}
          message="Are you sure you want to create this user?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText={t('createUser')}
          cancelText={t('cancel')}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('createNewUser')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('createNewUserSubtitle')}</p>
        </div>

        <Card className={`shadow-lg border-0 dark:!bg-gray-800 dark:!border-gray-600`}>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Left — Profile Image */}
              <div className="lg:col-span-1">
                <div className="sticky top-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-500" />{t('profilePicture')}
                    </h2>

                    <div className="space-y-3">
                      <div
                        onClick={() => document.getElementById("image-item").click()}
                        className={`relative group cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md
                          ${errors.image ? 'border-red-500' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400'}`}
                      >
                        {viewImage ? (
                          <div className="relative">
                            <img src={viewImage} alt="Profile preview" className="w-full h-64 object-cover rounded-lg" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="text-white text-center">
                                <IoMdCloudUpload className="text-3xl mx-auto mb-2" />
                                <p className="text-sm">{t('clickToChange')}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <IoMdCloudUpload className="text-5xl text-gray-400 mb-4" />
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-2">{t('uploadProfilePicture')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 text-center">{t('supportsFormats')}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">{t('maxFileSize')}</p>
                            <button className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm">
                              {t('browseFiles')}
                            </button>
                          </div>
                        )}
                      </div>

                      {errors.image && <p className="text-red-500 text-sm">• {errors.image}</p>}

                      {viewImage && (
                        <button
                          onClick={() => { setViewImage(null); setFileImage(null); document.getElementById("image-item").value = ""; }}
                          className="w-full py-2 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {t('removeImage')}
                        </button>
                      )}
                    </div>

                    <input type="file" accept="image/*" onChange={changeUpload} id="image-item" hidden name="image-item" />
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t('quickTips')}</h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                      {[t('tipClearPicture'), t('tipPassword'), t('tipRole')].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2"><span className="text-blue-500">•</span><span>{tip}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right — Form */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <FiUser className="text-blue-500" />{t('userInformation')}
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><FiUser className="text-gray-400" />{t('usernameLabel')} *</span>
                      </label>
                      <input type="text" value={users.username || ''} onChange={e => handleInputChange('username', e.target.value)}
                        className={inputCls(errors.username)} placeholder={t('usernameLabel')} />
                      {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><FiPhone className="text-gray-400" />{t('phoneNumber')} *</span>
                      </label>
                      <input type="tel" value={users.phone_number || ''} onChange={e => handleInputChange('phone_number', e.target.value)}
                        className={inputCls(errors.phone_number)} placeholder={t('phoneNumber')} />
                      {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><FiLock className="text-gray-400" />{t('passwordLabel')} *</span>
                      </label>
                      <input type="password" value={users.password || ''} onChange={e => handleInputChange('password', e.target.value)}
                        className={inputCls(errors.password)} placeholder={t('passwordLabel')} />
                      {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><FiLock className="text-gray-400" />{t('confirmPasswordLabel')} *</span>
                      </label>
                      <input type="password" value={users.confirm_password || ''} onChange={e => handleInputChange('confirm_password', e.target.value)}
                        className={inputCls(errors.confirm_password)} placeholder={t('confirmPasswordLabel')} />
                      {errors.confirm_password && <p className="text-red-500 text-sm">{errors.confirm_password}</p>}
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <span className="flex items-center gap-2"><FiUser className="text-gray-400" />{t('roleLabel')} *</span>
                    </label>
                    <select value={users.role_id || ''} onChange={e => handleRoleChange(e.target.value)}
                      className={inputCls(errors.role_id) + ' bg-white dark:bg-gray-700'}>
                      <option value="">{t('selectRole')}</option>
                      {data?.data?.role_id == 1
                        ? roles?.data?.filter(r => r.role_id != 1).map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)
                        : roles?.data?.filter(r => r.role_id != 1 && r.role_id != 2).map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                    </select>
                    {errors.role_id && <p className="text-red-500 text-sm">{errors.role_id}</p>}
                  </div>

                  {/* Contract Period */}
                  {users.role_id == 3 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800"
                    >
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-blue-500" />
                        <h3 className="font-medium text-blue-800 dark:text-blue-300">{t('contractPeriod')}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('startDate')} *</label>
                          <DatePicker size="large" className="w-full" value={startDate} onChange={handleStartDateChange} format="YYYY-MM-DD" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('termMonths')}</label>
                          <InputNumber size="large" min={1} max={36} value={term} onChange={handleTermChange} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('endDate')}</label>
                          <DatePicker size="large" className="w-full" value={endDate} onChange={handleEndDateChange} format="YYYY-MM-DD" />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        <p>{t('contractExpires')} <span className="font-semibold">{endDate.format('MMMM D, YYYY')}</span></p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-[#1e3a5f] hover:bg-[#163057] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    {t('createUser')}
                  </button>
                  <button
                    onClick={() => navigator(-1)}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center gap-2"><span className="text-red-500">*</span>{t('requiredFields')}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default RegisterForm;