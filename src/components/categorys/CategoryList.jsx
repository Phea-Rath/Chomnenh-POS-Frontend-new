import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io'
import { FaPlus, FaEdit, FaTrash, FaFolder, FaUser, FaBox, FaTags } from 'react-icons/fa'
import CreateCategory from '../../views/categorys/CreateCategory'
import { useOutletsContext } from '../../layouts/Management'
import UpdateCategory from '../../views/categorys/UpdateCategory'
import AlertBox from '../../services/AlertBox'
import { motion } from "framer-motion";
import { Button, Empty, Skeleton, Space, Typography, Card, Statistic, Input, Tag } from 'antd'
import { useDeleteCategoryMutation, useGetAllCategoriesQuery } from '../../../app/Features/categoriesSlice'
import { toast } from 'react-toastify'

const { Title } = Typography;

const CategoryList = () => {
  const [category, setCategory] = useState([]);
  const [filteredCategory, setFilteredCategory] = useState([]);
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, category_name: "" });
  const [viewMode, setViewMode] = useState("grid"); // "list" or "grid"
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isLoading, refetch } = useGetAllCategoriesQuery(token);
  const [deleteCategory, categoryDel] = useDeleteCategoryMutation();

  useEffect(() => {
    setCategory(data?.data || []);
    setFilteredCategory(data?.data || []);
  }, [data]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = category.filter((item) =>
        item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategory(filtered);
    } else {
      setFilteredCategory(category);
    }
  }, [searchTerm, category]);

  // Calculate statistics
  const calculateStats = () => {
    const totalCategories = filteredCategory.length;
    const activeCategories = filteredCategory.length; // Assuming all categories are active
    const recentCategories = filteredCategory.slice(0, 5).length; // Last 5 categories

    return {
      totalCategories,
      activeCategories,
      recentCategories
    };
  };

  const stats = calculateStats();

  function handleDelete(category_id) {
    setAlertBox(true);
    setId(category_id);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    setAlertBox(false);
    setLoading(true);
    try {
      await deleteCategory({ id, token });
      if (!categoryDel.error) {
        refetch();
        toast.success('Category deleted successfully');
        setLoading(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while deleting the category');
      setLoading(false);
    }
  }

  function onSearch(e) {
    setSearchTerm(e.target.value);
  }

  function handleUpdate(category_name, category_id) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: category_name, id: category_id } });
  }

  const CategoryCard = ({ category, index }) => (
    <div>
      <Card
        className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/50 hover:scale-[1.02] cursor-pointer"
        bodyStyle={{ padding: '20px' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FaFolder className="text-2xl text-purple-600" />
            </div>
            <Tag color="purple" className="font-semibold">
              #{index + 1}
            </Tag>
          </div>

          {/* Category Name */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">
              {category.category_name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaUser className="text-gray-400" />
              <span>Created by: {category.created_by}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <Button
              type="primary"
              icon={<FaEdit />}
              onClick={() => handleUpdate(category.category_name, category.category_id)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 border-0"
              size="small"
            >
              Edit
            </Button>
            <Button
              danger
              icon={<FaTrash />}
              onClick={() => handleDelete(category.category_id)}
              className="flex-1"
              size="small"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaFolder className="text-2xl text-purple-600" />
                </div>
                Category Management
              </motion.h1>
              <p className="text-gray-600 text-lg">
                Organize your products with categories
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                icon={<FaPlus />}
                onClick={() => addModalRef.current?.showModal()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                size="large"
              >
                Add Category
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
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-2">Total Categories</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalCategories}
                  </p>
                </div>
                <div className="p-3 bg-purple-400/20 rounded-full">
                  <FaFolder className="text-2xl text-purple-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-2">Active Categories</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activeCategories}
                  </p>
                </div>
                <div className="p-3 bg-blue-400/20 rounded-full">
                  <FaTags className="text-2xl text-blue-200" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm font-medium mb-2">Recent Categories</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.recentCategories}
                  </p>
                </div>
                <div className="p-3 bg-pink-400/20 rounded-full">
                  <FaUser className="text-2xl text-pink-200" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div> */}

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* View Toggle and Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 border">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "list"
                    ? "bg-white shadow-md text-purple-600 font-semibold"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  <IoIosList className="text-lg" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${viewMode === "grid"
                    ? "bg-white shadow-md text-purple-600 font-semibold"
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
                  placeholder="Search categories..."
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
        </motion.div>

        {/* Alert Box */}
        <AlertBox
          isOpen={alertBox}
          title="Delete Category"
          message="Are you sure you want to delete this category? This action cannot be undone."
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === "list" ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCategory.map((cat, index) => (
                      <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-600">{index + 1}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FaFolder className="text-purple-600" />
                            </div>
                            <span className="font-semibold text-gray-900">{cat.category_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaUser className="text-gray-400" />
                            {cat.created_by}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              icon={<FaEdit />}
                              onClick={() => handleUpdate(cat.category_name, cat.category_id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                              size="small"
                            >
                              Edit
                            </Button>
                            <Button
                              danger
                              icon={<FaTrash />}
                              onClick={() => handleDelete(cat.category_id)}
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

              {filteredCategory.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Empty
                  className="w-full flex flex-col items-center justify-center"
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    description={
                      <Typography.Text className="text-gray-500">
                        No categories found
                      </Typography.Text>
                    }
                  >
                    <Button
                      type="primary"
                      icon={<FaPlus />}
                      onClick={() => addModalRef.current?.showModal()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Create Your First Category
                    </Button>
                  </Empty>
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategory.map((cat, index) => (
                <CategoryCard key={cat.category_id} category={cat} index={index} />
              ))}
            </div>
          )}

          {viewMode === "grid" && isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="border-0 shadow-lg">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </Card>
              ))}
            </div>
          )}

          {viewMode === "grid" && filteredCategory.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Empty
                  className="w-full flex flex-col items-center justify-center"
                image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                description={
                  <Typography.Text className="text-gray-500">
                    No categories found
                  </Typography.Text>
                }
              >
                <Button
                  type="primary"
                  icon={<FaPlus />}
                  onClick={() => addModalRef.current?.showModal()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Your First Category
                </Button>
              </Empty>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <CreateCategory data={edit} onAdd={() => addModalRef.current?.close()} />
        </div>
      </dialog>

      <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box bg-white max-w-2xl">
          <UpdateCategory data={edit} onAdd={() => updateModalRef.current?.close()} />
        </div>
      </dialog>
    </motion.div>
  )
}

export default CategoryList