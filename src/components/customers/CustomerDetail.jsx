import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { FaArrowLeft, FaEdit, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendar } from 'react-icons/fa';
import { FaMapLocationDot } from "react-icons/fa6";
import { useGetCustomerByIdQuery } from '../../../app/Features/customersSlice';
import { Card, Skeleton, Button, Empty } from 'antd';
import { motion } from 'framer-motion';

const CustomerDetail = () => {
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data: customer, isLoading, error, refetch } = useGetCustomerByIdQuery({ id, token });

  const formatAddress = (customer) => {
    const parts = [
      customer?.villages,
      customer?.communes,
      customer?.districts,
      customer?.provinces
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : customer?.customer_address || 'N/A';
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

  if (error || !customer?.data) {
    return (
      <div className="min-h-screen bg-transparent py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Empty
            description="Customer not found"
            className="py-16"
          >
            <Link to="/customers">
              <Button type="primary">Back to Customers</Button>
            </Link>
          </Empty>
        </div>
      </div>
    );
  }

  const customerData = customer.data;

  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <FaArrowLeft /> Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
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
                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100">
                      {customerData.image ? (
                        <img
                          src={customerData.image}
                          alt={customerData.customer_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl text-green-600 font-bold">
                            {customerData.customer_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mt-4 text-center">
                      {customerData.customer_name}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Customer</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">ID</span>
                      <span className="font-medium text-gray-900">#{customerData.customer_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Created</span>
                      <span className="font-medium text-gray-900">
                        {customerData.created_at ? new Date(customerData.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="shadow-lg border-0 mt-4">
                <div className="flex flex-col gap-3">
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(formatAddress(customerData))}`}
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
                  <Link to={`/customers/edit/${customerData.customer_id}`} className="w-full">
                    <Button
                      icon={<FaEdit />}
                      type="primary"
                      className="w-full"
                      size="large"
                    >
                      Edit Customer
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
                      <p className="font-medium text-gray-900">{customerData.customer_tel || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaEnvelope className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-900">{customerData.customer_email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Location Details" className="shadow-lg mb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Province</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {customerData.provinces || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">District</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {customerData.districts || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Commune</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {customerData.communes || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Village</p>
                      <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {customerData.villages || 'N/A'}
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
                      {customerData.customer_address || 'N/A'}
                    </p>
                    {customerData.customer_address && (
                      <p className="text-sm text-gray-500 mt-2">
                        {formatAddress(customerData)}
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

export default CustomerDetail;
