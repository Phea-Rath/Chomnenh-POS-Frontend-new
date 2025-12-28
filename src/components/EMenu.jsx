import React, { useState, useRef, useEffect } from 'react';
import { QRCode, Button, Segmented } from 'antd';
import { Link, useParams } from 'react-router';
import { BsEyeFill } from 'react-icons/bs';
import { IoDownloadOutline } from 'react-icons/io5';
import { FaUtensils } from 'react-icons/fa';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import shopping from '../assets/shopping-cart.png';
import { useGetUserProfileQuery } from '../../app/Features/usersSlice';
import { convertToBase64 } from '../services/serviceFunction';

const QRCodeGenerator = () => {
  const token = localStorage.getItem('token');
  const id = localStorage.getItem('profileId');
  const [logoBase64, setLogoBase64] = useState(null);
  // const { id } = useParams();
  const [renderType, setRenderType] = useState('svg');
  const { data: profileData, refetch } = useGetUserProfileQuery({ id, token });
  const qrRef = useRef(null);
  const designRef = useRef(null);
  const restaurantName = "Gourmet Delight Restaurant";
  const description = "Scan to order from our digital menu";

  useEffect(() => {
    if (profileData?.data.image) {
      convertToBase64(profileData?.data.image).then(setLogoBase64);
    }
  }, [profileData]);
  console.log(logoBase64);

  // Download just the QR code
  const downloadCanvasQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png', 1.0);
      doDownload(url, 'Gourmet-Delight-QRCode.png');
    }
  };

  const downloadSvgQRCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      doDownload(url, profileData?.data?.profile_name + '-QRCode.svg');
    }
  };

  // Download the entire design (excluding buttons)
  const downloadDesign = async () => {
    if (!designRef.current) return;

    try {
      const elementsToHide = designRef.current.querySelectorAll(
        "button, .ant-segmented, .ant-segmented-item, .component-hidden"
      );

      const originalStyles = [];

      elementsToHide.forEach((el) => {
        originalStyles.push({
          el,
          visibility: el.style.visibility,
          display: el.style.display,
        });
        el.style.visibility = "hidden";
        el.style.display = "none";
      });

      const dataUrl = await toPng(designRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,   // 🔥 FIX CORS FONT ISSUE
      });

      originalStyles.forEach(({ el, visibility, display }) => {
        el.style.visibility = visibility;
        el.style.display = display;
      });

      doDownload(dataUrl, profileData?.data?.profile_name + "-QR.png");
    } catch (error) {
      console.error("Error generating image:", error);
    }
  };



  const doDownload = (url, fileName) => {
    const a = document.createElement('a');
    a.download = fileName;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div ref={designRef} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl component-hidden font-bold text-center text-amber-800 mb-2">Table QR Code</h1>
        <p className="text-center component-hidden text-gray-600 mb-8">For digital ordering system</p>

        {/* QR Code Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 flex flex-col items-center">
            {/* Logo */}
            <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-500 flex items-center justify-center mb-4 object-cover">
              <img src={`${profileData?.data.image}`} alt={logoBase64} />
            </div>

            {/* Restaurant Name */}
            <h2 className="text-2xl font-semibold text-amber-900 text-center">{profileData?.data.profile_name}</h2>

            {/* Description */}
            <p className="text-gray-600 text-center mt-2 mb-6">{description}</p>
          </div>

          {/* QR Code Container with border */}
          <div ref={qrRef} className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm">
            <QRCode
              value={window.location.origin + '/' + token + '/order-now/' + localStorage.getItem('profileId')}
              size={256}
              color="#000000"
              bgColor="#ffffff"
              type={renderType}
              iconSize={40}
              icon={shopping || null}
            />
          </div>
        </div>

        {/* Controls - These will be hidden in the downloaded image */}
        <div className="space-y-4">
          {/* <div className="flex justify-center">
            <Segmented
              options={['svg', 'canvas']}
              value={renderType}
              onChange={setRenderType}
              className="bg-amber-100"
            />
          </div> */}

          <div className="flex flex-col gap-3">
            {/* <Button
              type="primary"
              icon={<IoDownloadOutline />}
              onClick={renderType === 'canvas' ? downloadCanvasQRCode : downloadSvgQRCode}
              size="large"
              className="bg-amber-500 hover:bg-amber-600 border-amber-500 h-12 font-semibold"
            >
              Download QR Code Only
            </Button> */}

            <Button
              type="primary"
              icon={<IoDownloadOutline />}
              onClick={downloadDesign}
              size="large"
              className="bg-amber-700 hover:bg-amber-800 border-amber-700 h-12 font-semibold"
            >
              Download Full Design
            </Button>

            <a href={`/${token}/order-now/${localStorage.getItem('profileId')}`} target='_blank' className="w-full">
              <Button
                icon={<BsEyeFill />}
                size="large"
                className="w-full h-12 border-amber-300 text-amber-700 hover:text-amber-800 hover:border-amber-400 font-semibold"
              >
                View Order Page
              </Button>
            </a>
            <a href={`/market`} target='_blank' className="w-full">
              <Button
                icon={<BsEyeFill />}
                size="large"
                className="w-full h-12 border-amber-300 text-amber-700 hover:text-amber-800 hover:border-amber-400 font-semibold"
              >
                View MarketPlace
              </Button>
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-800 mb-2">Printing Instructions:</h3>
          <ul className="text-sm text-amber-700 list-disc pl-5 space-y-1">
            <li>Use "Download Full Design" for the complete table QR code</li>
            <li>Recommended print size: 10cm × 15cm</li>
            <li>Place in a frame on each table for customers to scan</li>
            <li>For best quality, use the SVG format when possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;