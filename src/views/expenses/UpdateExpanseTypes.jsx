import React, { useEffect, useState } from 'react';
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllExpanseTypesQuery } from '../../../app/Features/expenseTypesSlice';
import { toast } from 'react-toastify';
import {
  Card,
  Input,
  Button,
  Form,
  Alert,
} from 'antd';
import {
  FaSave,
  FaTimes,
  FaTag,
  FaLayerGroup,
  FaInfoCircle,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useViewText } from '../viewText';

const UpdateExpanseType = ({ onAdd, data }) => {
  const { vt } = useViewText();
  const token = localStorage.getItem('token');
  const { setLoading } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const [expenseTypes, setExpanseTypes] = useState({
    expense_type_name: '',
    description: '',
    created_by: '',
    status: 'active',
  });

  const { refetch } = useGetAllExpanseTypesQuery(token);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const nextState = {
      expense_type_name: data?.name || data?.expense_type_name || '',
      description: data?.description || '',
      created_by: data?.created_by || localStorage.getItem('userId') || '0',
      status: data?.status || 'active',
    };

    setExpanseTypes(nextState);
    form.setFieldsValue({
      expense_type_name: nextState.expense_type_name,
    });
  }, [data, form]);

  async function handleConfirm() {
    try {
      setLoading(true);
      setIsLoading(true);
      setAlertBox(false);

      const response = await api.put(`/expense_types/${data?.id}`, expenseTypes, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 200) {
        refetch();
        onAdd();
        toast.success(response.data.message || vt('Expense category updated successfully!'));
      } else {
        toast.error(response.data.message || vt('Failed to update expense category'));
      }
    } catch (error) {
      toast.error(error?.message || vt('An error occurred while updating the expense category'));
    } finally {
      setIsLoading(false);
      setLoading(false);
      setAlertBox(false);
    }
  }

  function handleSubmit() {
    if (!expenseTypes.expense_type_name.trim()) {
      toast.error(vt('Please enter a category name'));
      return;
    }
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }

  function onExpanseTypeName(e) {
    setExpanseTypes((prev) => ({
      ...prev,
      expense_type_name: e.target.value,
      created_by: localStorage.getItem('userId') || prev.created_by || '0',
    }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="view-page"
    >
      <AlertBox
        isOpen={alertBox}
        title={vt('Update Expense Category')}
        message={vt('Are you sure you want to update this expense category?')}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText={vt('Update')}
        cancelText={vt('Cancel')}
      />

      <div className="max-w-4xl mx-auto p-5">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
              <FaLayerGroup className="text-2xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vt('Update Expense Type')}</h1>
              <p className="text-gray-600">{vt('Edit the expense category name to keep your expenses organized')}</p>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
        >
          <Card className="shadow-lg border-0">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> {vt('Category Name')}
                </label>
                <Input
                  size="large"
                  placeholder={vt('Enter category name (e.g., Office Supplies, Travel, Marketing)')}
                  value={expenseTypes.expense_type_name}
                  onChange={onExpanseTypeName}
                  prefix={<FaTag className="text-gray-400" />}
                  className="w-full"
                  required
                />
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <FaInfoCircle />
                  <span>{vt('Choose a descriptive name for easy identification')}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="primary"
              icon={<FaSave />}
              onClick={handleSubmit}
              size="large"
              loading={isLoading}
              className="h-12 flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-0 shadow-lg"
              disabled={!expenseTypes.expense_type_name.trim()}
            >
              {vt('Update Category')}
            </Button>

            <Button
              type="default"
              icon={<FaTimes />}
              onClick={onAdd}
              size="large"
              className="h-12 flex-1 border-gray-300 hover:border-gray-400"
            >
              {vt('Cancel')}
            </Button>
          </div>

          {!expenseTypes.expense_type_name.trim() && (
            <Alert
              message={vt('Required Field')}
              description={vt('Please enter a category name to continue')}
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Form>
      </div>
    </motion.div>
  );
};

export default UpdateExpanseType;
