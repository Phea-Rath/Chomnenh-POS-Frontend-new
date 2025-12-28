// src/App.js

import OtpVerification from './components/OtpVerification';
import { Toaster } from 'react-hot-toast';

function OTPpage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <OtpVerification />
            <Toaster position="top-center" />
        </div>
    );
}

export default OTPpage;