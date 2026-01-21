import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { FaPlus, FaEdit, FaTrash, FaTags, FaUser, FaBox } from 'react-icons/fa'
import CreateBrands from '../../views/brands/CreateBrands'
import AlertBox from '../../services/AlertBox'
import { useOutletsContext } from '../../layouts/Management'
import UpdateBrands from '../../views/brands/UpdateBrands'
import { motion } from "framer-motion";
import { Button, Empty, Skeleton, Typography, Card, Statistic, Input, Tag } from 'antd'
import { useDeleteBrandMutation, useGetAllBrandQuery } from '../../../app/Features/brandsSlice'
import { toast } from 'react-toastify'

const { Title } = Typography;

const Brands = () => {
  const [id, setId] = useState(0)
  const [loadings, setLoadings] = useState(false)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const [viewMode, setViewMode] = useState("grid"); // "list" or "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const { setAlert, setLoading, loading, setMessage, setAlertStatus, reload, setReload } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const [brands, setBrands] = useState([]);
  const [filteredBrands, setFilteredBrands] = useState([]);
  const { data, isLoading, refetch } = useGetAllBrandQuery(token);
  const [deleteBrand, brandDel] = useDeleteBrandMutation();

  useEffect(() => {
    setBrands(data?.data || []);
    setFilteredBrands(data?.data || []);
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = brands.filter((item) =>
        item.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchTerm, brands]);

  // Calculate statistics
  const calculateStats = () => {
    const totalBrands = filteredBrands.length;
    const activeBrands = filteredBrands.length; // Assuming all brands are active
    const recentBrands = filteredBrands.slice(0, 5).length; // Last 5 brands

    return {
      totalBrands,
      activeBrands,
      recentBrands
    };
  };

  const stats = calculateStats();

  function handleDelete(brand_id) {
    setAlertBox(true);
    setId(brand_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    try {
      setLoading(true);
      await deleteBrand({ id, token });
      refetch();
      if (!brandDel.error && !brandDel.isLoading) {
        toast.success('Brand deleted successfully');
        setAlertBox(false);
        setLoading(false);
      }
    } catch (err) {
      toast.error(err?.message || err || 'An error occurred while deleting the brand');
      setLoading(false);
      setAlertBox(false);
    }
  }

  function onSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleUpdate(name, id) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id } })
  }

  const BrandCard = ({ brand, index }) => (
    // <motion.div
    //   initial={{ opacity: 0, scale: 0.9 }}
    //   animate={{ opacity: 1, scale: 1 }}
    //   transition={{ duration: 0.3, delay: index * 0.1 }}
    // >
    <Card
      className="h-full border-0 shadow-sm hover:shadow-sm transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50 hover:scale-[1.02] cursor-pointer"
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <FaTags className="text-2xl text-blue-600" />
          </div>
          <Tag color="blue" className="font-semibold">
            #{index + 1}
          </Tag>
        </div>

        {/* Brand Name */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
            {brand.brand_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaUser className="text-gray-400" />
            <span>Created by: {brand.created_by}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <Button
            type="primary"
            icon={<FaEdit />}
            onClick={() => handleUpdate(brand.brand_name, brand.brand_id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 border-0"
            size="small"
          >
            Edit
          </Button>
          <Button
            danger
            icon={<FaTrash />}
            onClick={() => handleDelete(brand.brand_id)}
            className="flex-1"
            size="small"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
    // </motion.div>
  );

  return (
    // <motion.div
    //   initial={{ opacity: 0, y: 20 }}
    //   animate={{ opacity: 1, y: 0 }}
    //   exit={{ opacity: 0, y: -20 }}
    //   transition={{ duration: 0.5 }}
    // >
    <div className="min-h-screen bg-transparent p-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaTags className="text-2xl text-blue-600" />
              </div>
              Brand Management
            </motion.h1>
            <p className="text-gray-600 text-lg">
              Manage your product brands and categories
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              icon={<FaPlus />}
              onClick={() => addModalRef.current?.showModal()}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
              size="large"
            >
              Add Brand
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-2">Total Brands</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalBrands}
                  </p>
                </div>
                <div className="p-3 bg-blue-400/20 rounded-full">
                  <FaTags className="text-2xl text-blue-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium mb-2">Active Brands</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activeBrands}
                  </p>
                </div>
                <div className="p-3 bg-green-400/20 rounded-full">
                  <FaBox className="text-2xl text-green-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-2">Recent Brands</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.recentBrands}
                  </p>
                </div>
                <div className="p-3 bg-purple-400/20 rounded-full">
                  <FaUser className="text-2xl text-purple-200" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div> */}

      {/* Controls Section */}
      {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        > */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* View Toggle and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 border">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "list"
                  ? "bg-white shadow-sm text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <IoIosList className="text-lg" />
                <span>List View</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                  ? "bg-white shadow-sm text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                <IoIosGrid className="text-lg" />
                <span>Grid View</span>
              </button>
            </div>
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search brands..."
                prefix={<IoIosSearch className="text-gray-400" />}
                value={searchTerm}
                onChange={onSearch}
                className="h-12 rounded-xl border-0 bg-gray-50 shadow-sm"
                allowClear
                size="large"
              />
            </div>
          </div>
        </div>
      </div>
      {/* </motion.div> */}

      {/* Alert Box */}
      <AlertBox
        isOpen={alertBox}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Content Section */}
      {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        > */}
      <div>
        {viewMode === "list" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Brand Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBrands.map((brand, index) => (
                    <tr key={brand.brand_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-600">{index + 1}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FaTags className="text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-900">{brand.brand_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FaUser className="text-gray-400" />
                          {brand.created_by}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            icon={<FaEdit />}
                            onClick={() => handleUpdate(brand.brand_name, brand.brand_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            size="small"
                          >
                            Edit
                          </Button>
                          <Button
                            danger
                            icon={<FaTrash />}
                            onClick={() => handleDelete(brand.brand_id)}
                            size="small"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isLoading && (
              <div className="p-6">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} active paragraph={{ rows: 1 }} className="mb-4" />
                ))}
              </div>
            )}
            {filteredBrands.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Empty
                  className="w-full flex flex-col items-center justify-center"
                  image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                  description={
                    <Typography.Text className="text-gray-500">
                      No brands found
                    </Typography.Text>
                  }
                >
                  <Button
                    type="primary"
                    icon={<FaPlus />}
                    onClick={() => addModalRef.current?.showModal()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Create Your First Brand
                  </Button>
                </Empty>
              </div>
            )}
          </div>
        ) : (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBrands.map((brand, index) => (
              <BrandCard key={brand.brand_id} brand={brand} index={index} />
            ))}
          </div>
        )}
        {viewMode === "grid" && isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="border-0 shadow-sm">
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            ))}
          </div>
        )}
        {viewMode === "grid" && filteredBrands.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Empty
              className="w-full flex flex-col items-center justify-center"
              image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
              description={
                <Typography.Text className="text-gray-500">
                  No brands found
                </Typography.Text>
              }
            >
              <Button
                type="primary"
                icon={<FaPlus />}
                onClick={() => addModalRef.current?.showModal()}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Your First Brand
              </Button>
            </Empty>
          </div>
        )}
        {/* </motion.div> */}
      </div>
      {/* Modals */}
      <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <CreateBrands data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>
      <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <UpdateBrands dataBrand={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </div>
    // </motion.div>  }
  )
}

export default Brands