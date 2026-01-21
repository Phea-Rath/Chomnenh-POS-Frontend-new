import React, { useState } from "react";
import {
    RiPhoneLine,
    RiLockPasswordLine,
    RiShieldCheckLine,
    RiArrowRightLine,
    RiCheckFill,
    RiArrowLeftLine
} from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";
import { Link, useNavigate } from "react-router";

const ForgotPassword = () => {
    const navigater = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        phone: "",
        otp: "",
        password: "",
        confirmPassword: ""
    });

    // Validation States
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    // Step 1: Submit Phone Number
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        if (!formData.phone || formData.phone.length < 9) {
            setErrors({ phone: "Please enter a valid phone number" });
            return;
        }
        setLoading(true);
        // Simulate API Call
        const res = await api.post('send-otp', { phone_number: formData.phone });
        if (res.data.status !== 200) {
            setLoading(false);
            toast.error("Failed to send OTP. Please try again.");
            return;
        }
        setTimeout(() => {
            setLoading(false);
            setStep(2);
            toast.info("OTP sent to your phone");
        }, 1000);
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (formData.otp.length !== 6) {
            setErrors({ otp: "OTP must be 6 digits" });
            return;
        }
        setLoading(true);
        // Simulate API Verification
        const res = await api.post('verify-otp', { phone_number: formData.phone, otp: formData.otp });
        if (res.data.status !== 200) {
            setLoading(false);
            toast.error("Failed to send OTP. Please try again.");
            return;
        }
        setTimeout(() => {
            setLoading(false);
            setStep(3);
        }, 1000);
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (formData.password.length < 6) newErrors.password = "Min 6 characters required";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        // Simulate API 
        const res = await api.post('new-password', { phone_number: formData.phone, new_password: formData.password });
        if (res.data.status !== 200) {
            setLoading(false);
            toast.error("Failed to reset password. Please try again.");
            return;
        }
        setTimeout(() => {
            setLoading(false);
            toast.success("Password reset successfully!");
            // Redirect to login or reset state
            navigater("/Login");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">

                {/* Progress Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Account Recovery</h2>
                    <p className="text-blue-100 text-sm mt-1">Step {step} of 3</p>

                    <div className="flex justify-center gap-2 mt-4">
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`h-1.5 w-12 rounded-full transition-all duration-300 ${s <= step ? 'bg-white' : 'bg-blue-400'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {/* STEP 1: PHONE INPUT */}
                    {step === 1 && (
                        <form onSubmit={handlePhoneSubmit} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    <RiPhoneLine size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Forgot Password?</h3>
                                <p className="text-gray-500 text-sm">Enter your phone number to receive an OTP</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="012 345 678"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'}`}
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Send OTP"} <RiArrowRightLine />
                            </button>
                            <Link to="/" className="block text-center mt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full text-blue-600 cursor-pointer rounded-xl underline transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <RiArrowLeftLine /> Back to Login
                                </button>
                            </Link>
                        </form>
                    )}

                    {/* STEP 2: OTP VERIFICATION */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <RiShieldCheckLine size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">Verify Code</h3>
                                <p className="text-gray-500 text-sm">Enter the 6-digit code sent to your phone</p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    name="otp"
                                    maxLength="6"
                                    placeholder="0 0 0 0 0 0"
                                    className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    value={formData.otp}
                                    onChange={handleChange}
                                />
                                {errors.otp && <p className="text-red-500 text-xs text-center mt-2">{errors.otp}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                            >
                                {loading ? "Verifying..." : "Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-gray-500 text-sm font-medium hover:text-blue-600"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}

                    {/* STEP 3: NEW PASSWORD */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div className="text-center mb-6">
                                <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                                    <RiLockPasswordLine size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800">New Password</h3>
                                <p className="text-gray-500 text-sm">Please create a strong new password</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${errors.password ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <RiLockPasswordLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Reset Password"} <RiCheckFill size={20} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;