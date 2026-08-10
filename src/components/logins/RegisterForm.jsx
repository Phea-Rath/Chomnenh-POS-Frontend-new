import React, { useEffect, useState } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { 
  FaUser, 
  FaPhone, 
  FaLock, 
  FaCalendarAlt, 
  FaSave, 
  FaTimes, 
  FaCloudUploadAlt,
  FaImage,
  FaShieldAlt,
  FaInfoCircle
} from "react-icons/fa";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import api from "../../services/api";
import { useNavigate } from "react-router";
import { DatePicker, InputNumber, Alert } from "antd";
import dayjs from "dayjs";
import { useGetAllUserQuery } from "@/features/auth/usersSlice";
import { toast } from "react-toastify";
import { useGetAllRoleQuery } from "@/features/auth/rolesSlice";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Button from "../../utils/Button";
import Input from "../../utils/Input";
import { getToken } from '@/utils/tokenStore';

const RegisterForm = () => {
  const { t } = useTranslation();
  const { darkMode, setLoading, reload, setReload } = useOutletsContext();

  const [viewImage, setViewImage] = useState(null);
  const [fileImage, setFileImage] = useState();
  const navigator = useNavigate();
  const toDay = new Date();

  const [alertBox, setAlertBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState({
    profile_id: 0,
    created_by: 0,
    status: 1,
    role: "",
    start_date: `${toDay.getFullYear()}-${toDay.getMonth() + 1}-${toDay.getDate()}`,
    term: 1,
  });

  const token = getToken();
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (date) => {
    if (!date) return;
    setStartDate(date);
    const dateObj = new Date(date);
    setUsers(prev => ({ ...prev, start_date: `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}` }));
  };

  const handleTermChange = (value) => {
    setTerm(value);
    setUsers(prev => ({ ...prev, term: value }));
  };

  const handleEndDateChange = (date) => {
    if (!date) return;
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

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);
    setSubmitting(true);
    const formData = new FormData();
    if (fileImage) formData.append("image", fileImage);
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
        setSubmitting(false);
        navigator(-1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "An error occurred while creating the user");
      setLoading(false);
      setSubmitting(false);
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

  return (
    <div className="view-page bg-transparent transition-colors">
      <AlertBox
        isOpen={alertBox}
        title={t('confirmation')}
        message="Are you sure you want to create this user?"
        onConfirm={handleConfirm}
        onCancel={() => setAlertBox(false)}
        confirmText={t('createUser')}
        cancelText={t('cancel')}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b-0 border-x p-4 dark:border-gray-500 border-gray-200 bg-white dark:bg-gray-600">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:!text-gray-100">
            {t('createNewUser')}
          </h1>
          <p className="text-gray-600 text-xs dark:!text-gray-400 mt-2">
            {t('createNewUserSubtitle')}
          </p>
        </div>
        <div className="mt-6 flex justify-center items-center gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            variant='save'
            outline={false}
          >
            <FaSave />{submitting ? t('processing') : t('create')}
          </Button>
          <Button
            type="button"
            variant='cancel'
            onClick={() => navigator(-1)}
          >
            <FaTimes />{t('back')}
          </Button>
        </div>
      </div>

      <form>
        <div className="grid grid-cols-1">
          {/* User Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="">
              <div className=" bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <FaUser className="text-cyan-500" />
                  {t('userInformation')}
                </h3>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Image Part */}
                  <div className="w-50 shrink-0">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      {t('profilePicture')} <FaImage className="text-gray-400" />
                    </label>
                    <div
                      onClick={() => document.getElementById("image-item").click()}
                      className={`relative group cursor-pointer border-2 rounded-[2px] transition-all duration-200 aspect-square flex flex-col items-center justify-center overflow-hidden
                        ${errors.image ? 'border-red-500' : 'border-dashed border-gray-300 dark:border-gray-600 hover:border-cyan-400'}`}
                    >
                      {viewImage ? (
                        <>
                          <img src={viewImage} alt="Profile" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <FaCloudUploadAlt size={24} />
                            <span className="text-[10px] font-bold uppercase mt-1">Change</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <FaUser size={32} className="mx-auto text-gray-300 dark:text-gray-500 mb-2" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Upload</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" onChange={changeUpload} id="image-item" hidden />
                    {viewImage && (
                      <button
                        type="button"
                        onClick={() => { setViewImage(null); setFileImage(null); }}
                        className="w-full mt-2 py-1 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-[2px] transition-all"
                      >
                        {t('removeImage')}
                      </button>
                    )}
                  </div>

                  {/* Inputs Part */}
                  <div className="grow">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaUser className="text-gray-400" />
                            {t('usernameLabel')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="text"
                          value={users.username}
                          onChange={val => handleInputChange('username', val)}
                          placeholder={t('usernameLabel')}
                          className={`w-full ${errors.username ? 'border-red-500' : ''} text-input`}
                        />
                        {errors.username && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.username}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaPhone className="text-gray-400" />
                            {t('phoneNumber')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="tel"
                          value={users.phone_number}
                          onChange={val => handleInputChange('phone_number', val)}
                          placeholder={t('phoneNumber')}
                          className={`w-full ${errors.phone_number ? 'border-red-500' : ''} text-input`}
                        />
                        {errors.phone_number && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.phone_number}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaLock className="text-gray-400" />
                            {t('passwordLabel')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="password"
                          value={users.password}
                          onChange={val => handleInputChange('password', val)}
                          placeholder="••••••••"
                          className={`w-full ${errors.password ? 'border-red-500' : ''} text-input`}
                        />
                        {errors.password && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaLock className="text-gray-400" />
                            {t('confirmPasswordLabel')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <Input
                          type="password"
                          value={users.confirm_password}
                          onChange={val => handleInputChange('confirm_password', val)}
                          placeholder="••••••••"
                          className={`w-full ${errors.confirm_password ? 'border-red-500' : ''} text-input`}
                        />
                        {errors.confirm_password && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.confirm_password}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:!text-gray-300 mb-2">
                          <span className="flex items-center text-sm font-semibold gap-2">
                            <FaShieldAlt className="text-gray-400" />
                            {t('roleLabel')} <span className="text-red-500">*</span>
                          </span>
                        </label>
                        <select 
                          value={users.role_id || ''} 
                          onChange={e => handleRoleChange(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-600/70 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-gray-600 rounded-[2px] transition-all outline-none focus:border-[#13b5ea] text-[13px] h-[38px]"
                        >
                          <option value="">{t('selectRole')}</option>
                          {roles?.data?.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                        </select>
                        {errors.role_id && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.role_id}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-between bg-gray-100 dark:bg-transparent dark:border-gray-500 p-4 border border-gray-200 border-t-0">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full text-cyan-600 dark:text-cyan-400">
                      <FaInfoCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {t('securityRequirements')}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold tracking-tighter mt-0.5">
                        {t('reqUsername')} • {t('reqPassword')} • {t('reqRole')}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest hidden sm:block">
                    {t('fieldsMarkedWith')} <span className="text-red-500">*</span> {t('required')}
                  </div>
              </div>
            </div>
          </motion.div>

          {/* Contract Section */}
          {users.role_id == 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="mt-4 bg-gray-100 p-4 border dark:bg-transparent dark:border-gray-500 border-gray-200">
                <h3 className="text-md font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <FaCalendarAlt className="text-cyan-500" />
                  {t('contractPeriod')}
                </h3>

                <div className="flex flex-wrap gap-5 mb-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      {t('startDate')} <FaCalendarAlt className="text-gray-400" />
                    </label>
                    <DatePicker 
                      className="date-picker w-full" 
                      size="large"
                      value={startDate} 
                      onChange={handleStartDateChange} 
                      format="YYYY-MM-DD" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      {t('termMonths')}
                    </label>
                    <InputNumber 
                      min={1} 
                      max={36} 
                      value={term} 
                      onChange={handleTermChange} 
                      className="w-full h-[40px] flex items-center no-spinner border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                      {t('endDate')}
                    </label>
                    <DatePicker 
                      className="date-picker w-full" 
                      size="large"
                      value={endDate} 
                      onChange={handleEndDateChange} 
                      format="YYYY-MM-DD" 
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-[2px] w-fit">
                  <div className="w-1.5 h-1.5 bg-[#13b5ea] rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {t('contractExpires')}: <span className="text-[#13b5ea]">{endDate.format('YYYY-MM-DD')}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
