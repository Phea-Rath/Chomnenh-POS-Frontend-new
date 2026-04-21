import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { QRCodeCanvas } from 'qrcode.react'; // Recommended for embedding logos
import {
  BsQrCodeScan, BsPrinterFill, BsDownload,
  BsFillPaletteFill, BsLink45Deg
} from 'react-icons/bs';
import { FaStore } from 'react-icons/fa';
import { BiCopy, BiCheck } from 'react-icons/bi';
import { swallow } from 'downloadjs';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { toast } from 'react-toastify';
import { useGetUserProfileQuery } from '../../app/Features/usersSlice';
import { convertImageToBase64 } from '../services/serviceFunction';
import shopping from '../assets/shopping-cart.png';

const QRCodeGenerator = () => {
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('profileId');
  const [logoBase64, setLogoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: profileData } = useGetUserProfileQuery({ id, token });
  const designRef = useRef(null);

  const restaurantName = profileData?.data?.profile_name || "Your Restaurant";
  const description = profileData?.data?.description || "Scan to order from our digital menu";
  const qrValue = `${window.location.origin}/${token}/order-now/${id}`;

  useEffect(() => {
    if (profileData?.data?.image) {
      convertImageToBase64(profileData?.data?.image).then(setLogoBase64);
    }
  }, [profileData]);

  const downloadDesign = async () => {
    if (!designRef.current) return;
    try {
      setLoading(true);
      const dataUrl = await toPng(designRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
      });
      download(dataUrl, `${restaurantName.replace(/\s+/g, '_')}_QR.png`);
      toast.success('Design downloaded successfully!');
    } catch (e) {
      toast.error('Download failed');
    } finally {
      setLoading(false);
    }
  };

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy. Use HTTPS.');
    }
  };

  return (
    <div className="bg-transparent flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Main Single Card Container */}
        <div className="rounded-[2.5rem] shadow-md border border-slate-100 overflow-hidden">

          {/* Header Section */}
          <div className="p-4 text-center bg-slate-50 border-b border-slate-100">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              E-Menu <span className="text-indigo-600">QR</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Smarter ordering for your guests</p>
          </div>

          {/* Design Preview Area (The part that gets downloaded) */}
          <div ref={designRef} className="p-10 bg-white flex flex-col items-center">
            {/* Logo and Name */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md mx-auto border-4 border-white">
                <img
                  src={logoBase64 || shopping}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{restaurantName}</h2>
            </div>

            {/* QR Code with Logo Center */}
            <div className="relative p-6 bg-white rounded-3xl shadow-xl border border-slate-50">
              <QRCodeCanvas
                value={qrValue}
                size={220}
                level="H" // High error correction allows for logo
                includeMargin={false}
                imageSettings={{
                  src: logoBase64 || shopping,
                  x: undefined,
                  y: undefined,
                  height: 50,
                  width: 50,
                  excavate: true, // This clears the QR pixels behind the logo
                }}
              />
            </div>

            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">
                <BsQrCodeScan /> Scan To Place Order
              </span>
              <p className="text-slate-400 text-xs italic max-w-[200px] mx-auto pt-2">
                "{description}"
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
            {/* <button
              onClick={downloadDesign}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              <BsDownload className="text-lg" />
              {loading ? 'Preparing...' : 'Download Print Ready'}
            </button> */}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={copyURL}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all text-xs font-bold text-slate-600"
              >
                {copied ? <BiCheck className="text-lg text-green-500" /> : <BsLink45Deg className="text-lg" />}
                {copied ? 'Copied' : 'Copy Link'}
              </button>

              <button
                onClick={downloadDesign}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 transition-all text-xs font-bold text-slate-600"
              >
                {copied ? <BiCheck className="text-lg text-green-500" /> : <BsDownload className="text-lg" />}
                {copied ? 'Downloaded' : 'Download'}
              </button>

              {/* <Link
                to="/market"
                className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:text-emerald-500 transition-all text-xs font-bold text-slate-600"
              >
                <FaStore className="text-base" />
                Market
              </Link> */}
            </div>
          </div>
        </div>

        {/* Floating Print Tip */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
          <BsPrinterFill />
          <span className="text-xs font-medium">Tip: Use A5 Heavy Cardstock for best results</span>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;