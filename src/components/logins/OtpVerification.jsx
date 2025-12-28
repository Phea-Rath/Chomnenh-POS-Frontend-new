// src/components/OtpVerification.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const OtpVerification = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpField, setShowOtpField] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        try {
            const response = await axios.post('http://your-laravel-app/api/send-otp', {
                phone_number: phoneNumber
            });

            setShowOtpField(true);
            setCountdown(120); // 2 minutes countdown
            toast.success('OTP sent successfully!');
            console.log('OTP (for testing):', response.data.otp); // Remove in production
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            await axios.post('http://your-laravel-app/api/verify-otp', {
                phone_number: phoneNumber,
                otp: otp
            });

            setIsVerified(true);
            toast.success('Phone number verified successfully!');
        } catch (error) {
            toast.error(error.response?.data?.error || 'OTP verification failed');
        }
    };

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">OTP Verification</h1>

            {isVerified ? (
                <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="mt-4 text-lg font-medium">Phone number verified successfully!</p>
                </div>
            ) : (
                <>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Phone Number</label>
                        <PhoneInput
                            international
                            defaultCountry="US"
                            value={phoneNumber}
                            onChange={setPhoneNumber}
                            disabled={showOtpField}
                            className="border rounded p-2 w-full"
                        />
                    </div>

                    {showOtpField && (
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                className="border rounded p-2 w-full"
                                placeholder="123456"
                            />
                            {countdown > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    OTP expires in: {formatCountdown(countdown)}
                                </p>
                            )}
                            {countdown === 0 && showOtpField && (
                                <button
                                    onClick={handleSendOtp}
                                    className="text-blue-500 text-sm mt-1"
                                >
                                    Resend OTP
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex justify-center">
                        {!showOtpField ? (
                            <button
                                onClick={handleSendOtp}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded"
                            >
                                Send OTP
                            </button>
                        ) : (
                            <button
                                onClick={handleVerifyOtp}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-6 rounded"
                            >
                                Verify OTP
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default OtpVerification;