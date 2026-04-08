import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { FaArrowLeft, FaEdit, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendar } from 'react-icons/fa';
import { FaMapLocationDot } from "react-icons/fa6";
import { useGetSupplierByIdQuery } from '../../../app/Features/suppliesSlice';
import { Card, Skeleton, Button, Empty } from 'antd';
import { motion } from 'framer-motion';

const SupplierDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data: supplier, isLoading, error, refetch } = useGetSupplierByIdQuery({ id, token });

  const formatAddress = (supplier) => {
    const parts = [
      supplier?.villages,
      supplier?.communes,
      supplier?.districts,
      supplier?.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : supplier?.supplier_address || 'N/A';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg">
            <Skeleton active avatar paragraph={{ rows: 6 }} />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !supplier?.data) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Empty
            description="Supplier not found"
            className="py-16"
          >
            <Link to="/suppliers">
              <Button type="primary">Back to Suppliers</Button>
            </Link>
          </Empty>
        </div>
      </div>
    );
  }

  const supplierData = supplier.data;

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/suppliers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <FaArrowLeft /> Back to Suppliers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-lg border-0 overflow-hidden">
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100">
                      {supplierData.image ? (
                        <img
                          src={supplierData.image}
                          alt={supplierData.supplier_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl text-blue-600 font-bold">
                            {supplierData.supplier_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mt-4 text-center">
                      {supplierData.supplier_name}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Supplier</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">ID</span>
                      <span className="font-medium text-gray-900">#{supplierData.supplier_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Created</span>
                      <span className="font-medium text-gray-900">
                        {supplierData.created_at ? new Date(supplierData.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="shadow-lg border-0 mt-4">
                <div className="flex flex-col gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(supplierData))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      icon={<FaMapLocationDot />}
                      className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      size="large"
                    >
                      View on Maps
                    </Button>
                  </a>
                  <Link to={`/suppliers/edit/${supplierData.supplier_id}`} className="w-full">
                    <Button
                      icon={<FaEdit />}
                      type="primary"
                      className="w-full"
                      size="large"
                    >
                      Edit Supplier
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card title="Contact Information" className="shadow-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaPhone className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">{supplierData.supplier_tel || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaEnvelope className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{supplierData.supplier_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {supplierData.description && (
                <Card title="Description" className="shadow-lg mb-6">
                  <p className="text-gray-700 leading-relaxed italic">
                    "{supplierData.description}"
                  </p>
                </Card>
              )}

              <Card title="Location Details" className="shadow-lg mb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Province</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {supplierData.provinces || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">District</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {supplierData.districts || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Commune</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {supplierData.communes || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Village</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {supplierData.villages || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Full Address" className="shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                    <FaMapMarkerAlt className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700">
                      {supplierData.supplier_address || 'N/A'}
                    </p>
                    {supplierData.supplier_address && (
                      <p className="text-sm text-gray-500 mt-2">
                        {formatAddress(supplierData)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
