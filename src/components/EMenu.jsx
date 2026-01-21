import React, { useState, useRef, useEffect } from 'react';
import { QRCode, Button, Segmented, Card, Tag, Image } from 'antd';
import { Link, useParams } from 'react-router';
import {
  BsEyeFill,
  BsQrCodeScan,
  BsPrinterFill,
  BsDownload,
  BsCameraFill,
  BsFillPaletteFill
} from 'react-icons/bs';
import {
  IoDownloadOutline,
  IoRestaurantOutline,
  IoScanOutline,
  IoPrintOutline
} from 'react-icons/io5';
import {
  FaUtensils,
  FaRegStar,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaGlobe,
  FaStore
} from 'react-icons/fa';
import { toPng } from 'html-to-image';
import { toast } from "react-toastify";
import download from 'downloadjs';
import saveAs from 'file-saver';
import shopping from '../assets/shopping-cart.png';
import { useGetUserProfileQuery } from '../../app/Features/usersSlice';
import { convertImageToBase64, convertToBase64 } from '../services/serviceFunction';
import api from '../services/api';

const QRCodeGenerator = () => {
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('profileId');
  const [logoBase64, setLogoBase64] = useState(null);
  const [renderType, setRenderType] = useState('svg');
  const [loading, setLoading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('png');
  const { data: profileData, refetch } = useGetUserProfileQuery({ id, token });
  const qrRef = useRef(null);
  const designRef = useRef(null);

  const restaurantName = profileData?.data?.profile_name || "Restaurant Name";
  const description = profileData?.data?.description || "Scan to order from our digital menu";
  const address = profileData?.data?.address || "123 Main Street, City";
  const phone = profileData?.data?.phone || "(123) 456-7890";
  const website = profileData?.data?.website || "www.restaurant.com";

  useEffect(() => {
    if (profileData?.data?.image) {
      const imageBase = convertImageToBase64(profileData?.data?.image).then(setLogoBase64);
      // console.log(imageBase);

      // setLogoBase64(imageBase);
    }
  }, [profileData]);


  // Download the entire design using file-saver
  const downloadDesign = async () => {
    if (!designRef.current) return;

    try {
      const dataUrl = await toPng(designRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
      });

      download(dataUrl, 'custom-image.png');
    } catch (e) {
      console.error(e);
    }
  };


  // Download QR code only
  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      setLoading(true);

      const dataUrl = await toPng(qrRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 4,
        quality: 1.0,
        cacheBust: true,
      });

      const blob = await fetch(dataUrl).then(res => res.blob());
      saveAs(blob, `${restaurantName.replace(/\s+/g, '_')}_QR_Code.png`);

      toast.success('QR Code downloaded successfully!', {
        position: "top-right",
        autoClose: 3000,
      });

    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error('Failed to download QR code. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">
            Table QR Code Generator
          </h1>
          <p className="text-lg text-blue-700">
            Create beautiful QR codes for your restaurant tables
          </p>
        </div>
        {/* {logoBase64} */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Design Preview */}
          <div className="lg:col-span-2">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <BsFillPaletteFill className="text-blue-600" />
                  <span className="text-xl font-semibold text-blue-900">Design Preview</span>
                </div>
              }
              className="shadow-xl border-2 border-blue-200"
            >
              <div ref={designRef} className="p-8 bg-gradient-to-br from-white to-blue-50 rounded-lg">
                {/* Restaurant Header */}
                <div className="flex flex-col items-center mb-10">
                  <div className="relative mb-6">
                    {/* hello{logoBase64} */}
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg bg-white p-2">
                      <Image
                        src={logoBase64}
                        alt={restaurantName}
                        className="w-full h-full object-cover rounded-full"
                        preview={false}
                      />
                    </div>

                    {/* Decorative Elements */}
                    {/* <div className="absolute -top-2 -right-2">
                      <div className="bg-blue-500 text-white p-2 rounded-full">
                        <FaUtensils size={20} />
                      </div>
                    </div> */}
                  </div>

                  {/* {/* Restaurant Info */}
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-blue-900 mb-2">
                      {restaurantName}
                    </h2>
                    {/* <div className="flex items-center justify-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <FaRegStar key={i} className="text-blue-400" />
                      ))}
                      <span className="text-blue-700 font-medium">5.0</span>
                    </div>

                    <p className="text-lg text-blue-800 mb-6 max-w-md mx-auto">
                      {description}
                    </p> */}
                  </div>
                </div>

                {/* Contact Info Row */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <FaPhoneAlt className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-blue-700">Call Us</p>
                      <p className="font-semibold text-blue-900">{phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <FaMapMarkerAlt className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-blue-700">Visit Us</p>
                      <p className="font-semibold text-blue-900">{address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <FaGlobe className="text-blue-600 text-xl" />
                    <div>
                      <p className="text-sm text-blue-700">Website</p>
                      <p className="font-semibold text-blue-900">{website}</p>
                    </div>
                  </div>
                </div> */}

                {/* QR Code Section */}
                <div className="flex flex-col items-center">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-3">
                      <BsQrCodeScan className="text-blue-700" />
                      <span className="text-blue-800 font-semibold">SCAN TO ORDER</span>
                    </div>
                    <p className="text-blue-700">
                      Scan this QR code to view our digital menu and place your order
                    </p>
                  </div>

                  {/* QR Code Container */}
                  <div
                    ref={qrRef}
                    className="p-6 bg-white rounded-2xl shadow-lg border-4 border-blue-200"
                  >
                    <div className="relative">
                      <QRCode
                        value={window.location.origin + '/' + token + '/order-now/' + localStorage.getItem('profileId')}
                        size={256}
                        color="#000000"
                        bgColor="#ffffff"
                        type={renderType}
                        iconSize={60}
                        icon={logoBase64 || shopping}
                        errorLevel="H"
                      />

                      {/* Decorative corners */}
                      <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl-lg"></div>
                      <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br-lg"></div>
                    </div>
                  </div>

                  {/* Scan Instructions */}
                  {/* <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <IoScanOutline className="text-2xl text-blue-600 animate-pulse" />
                      <span className="text-lg font-semibold text-blue-900">How to Order:</span>
                    </div>
                    <ol className="text-blue-700 list-decimal list-inside space-y-1">
                      <li>Open your camera app</li>
                      <li>Point at the QR code above</li>
                      <li>Tap the notification to open menu</li>
                      <li>Browse and order your favorite dishes</li>
                    </ol>
                  </div> */}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-blue-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                    <FaStore className="text-blue-600" />
                    <span className="font-medium">Thank you for dining with us!</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Digital ordering powered by Restaurant Management System
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Controls */}
          <div className="lg:col-span-1">
            <Card
              title={
                <div className="flex items-center gap-2">
                  <BsCameraFill className="text-blue-600" />
                  <span className="text-xl font-semibold text-blue-900">Download Options</span>
                </div>
              }
              className="shadow-xl border-2 border-blue-200 h-full"
            >
              <div className="space-y-6 download-controls">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-3">
                    <BsFillPaletteFill className="inline mr-2" />
                    Download Format
                  </label>
                  <Segmented
                    block
                    options={[
                      { label: 'PNG', value: 'png' },
                      { label: 'High Res', value: 'high-res' },
                    ]}
                    value={downloadFormat}
                    onChange={setDownloadFormat}
                    className="bg-blue-100"
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    type="primary"
                    icon={<BsDownload />}
                    onClick={downloadDesign}
                    loading={loading}
                    size="large"
                    block
                    className="h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 shadow-lg"
                  >
                    Download Full Design
                  </Button>

                  <Button
                    type="default"
                    icon={<BsQrCodeScan />}
                    onClick={downloadQRCode}
                    loading={loading}
                    size="large"
                    block
                    className="h-14 border-blue-300 text-blue-700 hover:text-blue-800 hover:border-blue-400"
                  >
                    Download QR Code Only
                  </Button>

                  <a
                    href={`/${token}/order-now/${localStorage.getItem('profileId')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      icon={<BsEyeFill />}
                      size="large"
                      block
                      className="h-14 border-blue-300 text-blue-700 hover:text-blue-800 hover:border-blue-400"
                    >
                      Preview Order Page
                    </Button>
                  </a>

                  <a
                    href="/market"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      icon={<FaStore />}
                      size="large"
                      block
                      className="h-14 border-green-300 text-green-700 hover:text-green-800 hover:border-green-400"
                    >
                      View Marketplace
                    </Button>
                  </a>
                </div>

                {/* Print Instructions */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <BsPrinterFill className="text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Printing Guide</h3>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                      <span>Recommended size: A5 (148 × 210mm)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                      <span>Use high-quality paper (200-300gsm)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                      <span>Place in acrylic frames on tables</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                      <span>Test scan from multiple angles</span>
                    </li>
                  </ul>
                </div>

                {/* Design Tips */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">Design Tips</h3>
                  <div className="flex flex-wrap gap-2">
                    <Tag color="blue" className="text-xs">High Contrast</Tag>
                    <Tag color="green" className="text-xs">Clean Layout</Tag>
                    <Tag color="orange" className="text-xs">Brand Colors</Tag>
                    <Tag color="purple" className="text-xs">Clear Instructions</Tag>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;