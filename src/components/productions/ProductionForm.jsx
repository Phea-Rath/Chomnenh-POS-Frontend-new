import React, { useEffect, useMemo, useState } from 'react';
import {
  LuArrowLeft,
  LuCalendar,
  LuFileText,
  LuListChecks,
  LuPackage,
  LuPlus,
  LuRefreshCw,
  LuSave,
  LuTrash2,
  LuX
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import { useDebounce } from 'use-debounce';
import dayjs from 'dayjs';
import { FaBox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Input from '../../utils/Input';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import { useGetAllItemsQuery } from '../../../app/Features/itemsSlice';
import { useGetAllRawMaterialQuery } from '../../../app/Features/RawMaterialSlice';
import { useGetAllProductionQuery } from '../../../app/Features/productSlice';

const defaultForm = {
  item_id: '',
  quantity: '',
  production_date: dayjs().format('YYYY-MM-DD'),
  notes: '',
};

const defaultModalState = {
  raw_material_id: '',
  quantity: '',
  unit: '',
  cost_per_unit: '',
};

const ProductionForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const token = localStorage.getItem('token');

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
  const [currentProduction, setCurrentProduction] = useState(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [costLoading, setCostLoading] = useState(false);

  const [itemSearch, setItemSearch] = useState('');
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedItemSearch] = useDebounce(itemSearch, 500);
  const [debouncedRawSearch] = useDebounce(rawSearch, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [rawMaterialModalVisible, setRawMaterialModalVisible] = useState(false);
  const [selectedRawMaterialForModal, setSelectedRawMaterialForModal] = useState(null);
  const [modalForm, setModalForm] = useState(defaultModalState);
  const [modalError, setModalError] = useState('');

  const { data: itemData } = useGetAllItemsQuery({
    limit,
    page: currentPage,
    search: debouncedItemSearch,
    token
  });
  const { data: rawData } = useGetAllRawMaterialQuery({
    limit: 50,
    page: 1,
    search: debouncedRawSearch,
    token
  });
  const { refetch } = useGetAllProductionQuery({
    limit: 10,
    page: 1,
    search: '',
    token
  });

  const items = itemData?.data || [];
  const rawMaterials = rawData?.data || [];

  const availableRawMaterials = useMemo(() => {
    const selectedIds = selectedRawMaterials.map((rm) => rm.raw_material_id);
    return rawMaterials.filter((rm) => !selectedIds.includes(rm.id));
  }, [rawMaterials, selectedRawMaterials]);

  const totalCost = useMemo(() => {
    return selectedRawMaterials.reduce((sum, material) => {
      return sum + (Number(material.quantity) || 0) * (Number(material.cost_per_unit) || 0);
    }, 0);
  }, [selectedRawMaterials]);

  useEffect(() => {
    setCurrentPage(1);
    setLimit(10);
  }, [debouncedItemSearch]);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const fetchProductionData = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/production/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status !== 200) {
          throw new Error(t('failedToFetchData'));
        }

        const production = response.data?.data;
        setCurrentProduction(production);

        setForm({
          item_id: production?.item_id || '',
          quantity: production?.quantity || '',
          production_date: production?.production_date
            ? dayjs(production.production_date).format('YYYY-MM-DD')
            : dayjs().format('YYYY-MM-DD'),
          notes: production?.notes || '',
        });

        if (Array.isArray(production?.details)) {
          setSelectedRawMaterials(
            production.details.map((detail, index) => ({
              key: detail.id || `${detail.raw_material_id}-${index}`,
              raw_material_id: detail.raw_material_id,
              material_name: detail.material_name || 'Unknown Material',
              material_code: detail.material_code || 'N/A',
              primary_unit: detail.primary_unit || 'unit',
              secondary_unit: detail.secondary_unit || '',
              selected_unit: detail.primary_unit || 'unit',
              quantity: Number(detail.quantity) || 0,
              cost_per_unit: Number(detail.cost_per_unit) || 0,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching production:', error);
        toast.error(t('failedToLoadProductionData'));
      } finally {
        setLoading(false);
      }
    };

    fetchProductionData();
  }, [id, isEditMode, t, token]);

  useEffect(() => {
    if (!items.length || !form.item_id) {
      return;
    }

    const item = items.find((entry) => String(entry.item_id) === String(form.item_id));
    if (item) {
      setSelectedItem(item);
    }
  }, [items, form.item_id]);

  const onScrollFetch = (event) => {
    const target = event.target;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    if (nearBottom && (itemData?.pagination?.total || 0) > items.length) {
      setLimit((prev) => prev + 10);
    }
  };

  const handleItemSelect = (value) => {
    const item = items.find((entry) => String(entry.item_id) === String(value));
    setForm((prev) => ({ ...prev, item_id: value }));
    setSelectedItem(item || null);
    setFormErrors((prev) => ({ ...prev, item_id: '' }));
  };

  const handleRawMaterialSelect = (materialId) => {
    const material = availableRawMaterials.find((entry) => String(entry.id) === String(materialId));
    setSelectedRawMaterialForModal(material || null);
    setModalForm({
      raw_material_id: materialId,
      quantity: '',
      unit: material?.primary_unit || '',
      cost_per_unit: '',
    });
    setModalError('');
  };

  const fetchCost = async (materialId, quantityInPrimaryUnit) => {
    if (!materialId || !quantityInPrimaryUnit) {
      return;
    }

    try {
      setCostLoading(true);
      const response = await api.get(`total-cost/${quantityInPrimaryUnit}/${materialId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const cost = Number(response.data?.data?.totalCost) || 0;
        setModalForm((prev) => ({ ...prev, cost_per_unit: cost }));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('failedToFetchData'));
    } finally {
      setCostLoading(false);
    }
  };

  const handleModalQuantityCostRefresh = async (nextState = modalForm, nextMaterial = selectedRawMaterialForModal) => {
    const quantity = Number(nextState.quantity);
    if (!quantity || !nextMaterial) {
      return;
    }

    const conversionValue = Number(nextMaterial.conversion_value) || 1;
    const quantityInPrimaryUnit =
      nextState.unit === nextMaterial.secondary_unit ? quantity / conversionValue : quantity;

    await fetchCost(nextMaterial.id, quantityInPrimaryUnit);
  };

  const resetModal = () => {
    setModalForm(defaultModalState);
    setSelectedRawMaterialForModal(null);
    setRawMaterialModalVisible(false);
    setModalError('');
    setCostLoading(false);
  };

  const handleAddRawMaterial = () => {
    const selectedMaterial = rawMaterials.find(
      (material) => String(material.id) === String(modalForm.raw_material_id)
    );

    if (!selectedMaterial) {
      setModalError(t('selectRawMaterial'));
      return;
    }

    if (!modalForm.quantity || Number(modalForm.quantity) <= 0) {
      setModalError(t('enterQuantity'));
      return;
    }

    if (!modalForm.cost_per_unit || Number(modalForm.cost_per_unit) <= 0) {
      setModalError(t('enterCost'));
      return;
    }

    const selectedUnit = modalForm.unit || selectedMaterial.primary_unit;
    const conversionValue = Number(selectedMaterial.conversion_value) || 1;
    const quantityInPrimaryUnit =
      selectedUnit === selectedMaterial.secondary_unit
        ? Number(modalForm.quantity) / conversionValue
        : Number(modalForm.quantity);

    const exists = selectedRawMaterials.some(
      (entry) => String(entry.raw_material_id) === String(modalForm.raw_material_id)
    );

    if (exists) {
      setModalError(t('duplicateItem'));
      return;
    }

    if (Number(selectedMaterial.in_stock) <= 0) {
      setModalError(t('itemOutStock'));
      return;
    }

    if (Number(selectedMaterial.in_stock) < quantityInPrimaryUnit) {
      setModalError(t('notEnoughItemInStock'));
      return;
    }

    const newMaterial = {
      key: Date.now(),
      raw_material_id: selectedMaterial.id,
      material_name: selectedMaterial.material_name || 'Unknown Material',
      material_code: selectedMaterial.material_code || 'N/A',
      primary_unit: selectedMaterial.primary_unit || 'unit',
      secondary_unit: selectedMaterial.secondary_unit || '',
      selected_unit: selectedUnit,
      quantity: quantityInPrimaryUnit,
      cost_per_unit: Number(modalForm.cost_per_unit),
    };

    setSelectedRawMaterials((prev) => [...prev, newMaterial]);
    setFormErrors((prev) => ({ ...prev, raw_materials: '' }));
    toast.success(t('rawMaterialAddedSuccess'));
    resetModal();
  };

  const handleRemoveRawMaterial = (key) => {
    setSelectedRawMaterials((prev) => prev.filter((material) => material.key !== key));
  };

  const handleUpdateRawMaterial = (key, field, value) => {
    setSelectedRawMaterials((prev) =>
      prev.map((material) =>
        material.key === key
          ? {
              ...material,
              [field]: Number(value) || 0,
            }
          : material
      )
    );
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.production_date) {
      nextErrors.production_date = t('productionDate');
    }

    if (!form.item_id) {
      nextErrors.item_id = t('item');
    }

    if (!form.quantity) {
      nextErrors.quantity = t('enterQuantity');
    } else if (!Number.isInteger(Number(form.quantity)) || Number(form.quantity) <= 0) {
      nextErrors.quantity = t('quantityWholeNumber');
    }

    if (!selectedRawMaterials.length) {
      nextErrors.raw_materials = t('atLeastOneRawMaterialRequired');
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        item_id: form.item_id,
        quantity: Number(form.quantity),
        production_date: form.production_date,
        notes: form.notes,
        total_cost: Number(totalCost.toFixed(2)),
        raw_materials: selectedRawMaterials.map((material) => ({
          raw_material_id: material.raw_material_id,
          quantity: Number(material.quantity),
          cost_per_unit: Number(material.cost_per_unit),
        })),
      };

      const response = isEditMode
        ? await api.put(`/production/${id}`, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        : await api.post('/production', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

      if (response.status === 200) {
        toast.success(isEditMode ? t('productionRecordUpdated') : t('productionRecordCreated'));
        refetch();
        navigate(-1);
      }
    } catch (error) {
      console.error('Error saving production:', error);
      toast.error(error?.response?.data?.message || error.message || t('failedToSaveProduction'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(defaultForm);
    setSelectedItem(null);
    setSelectedRawMaterials([]);
    setFormErrors({});
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="view-page min-h-screen bg-transparent p-4 md:p-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <LuArrowLeft />
              {t('backToProduction')}
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-3 ${isEditMode ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                <LuPackage className={`text-2xl ${isEditMode ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? t('editProductionRecord') : t('createNewProduction')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {isEditMode ? t('updateProductionDetails') : t('recordNewProductionBatch')}
                </p>
              </div>
            </div>
          </div>

          {isEditMode && currentProduction ? (
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                ID: {currentProduction.id}
              </span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                {dayjs(currentProduction.production_date).format('MMM D, YYYY')}
              </span>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <LuCalendar className="text-blue-500" />
              {t('productionInformation')}
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="production_date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('productionDate')}
                </label>
                <input
                  id="production_date"
                  type="date"
                  value={form.production_date}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, production_date: event.target.value }));
                    setFormErrors((prev) => ({ ...prev, production_date: '' }));
                  }}
                  className="rounded-sm border border-gray-300 bg-transparent px-4 py-2 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-gray-400 dark:text-white"
                />
                {formErrors.production_date ? (
                  <p className="text-sm text-red-500">{formErrors.production_date}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label htmlFor="item" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('item')}
                </label>
                <RichSearch
                  data={items}
                  keyFields={{
                    id: 'id',
                    title: 'name',
                    subtitle: 'code',
                    image: 'image',
                    price: 'price',
                    quantity: 'quantity'
                  }}
                  value={form.item_id}
                  onSelected={handleItemSelect}
                  onSearch={setItemSearch}
                  onScrollReader={onScrollFetch}
                  placeholder={t('item')}
                />
                {formErrors.item_id ? <p className="text-sm text-red-500">{formErrors.item_id}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quantity')}
                </label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={form.quantity}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, quantity: value }));
                    setFormErrors((prev) => ({ ...prev, quantity: '' }));
                  }}
                  addonAfter={<span className="text-sm dark:text-gray-300">{t('unitsCount')}</span>}
                />
                {formErrors.quantity ? <p className="text-sm text-red-500">{formErrors.quantity}</p> : null}
              </div>

              {selectedItem ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-900/10 md:col-span-2">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{selectedItem.name}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">{selectedItem.code}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
                <LuListChecks className="text-green-500" />
                {t('rawMaterialsConsumption')}
              </h2>

              <Button
                type="button"
                onClick={() => setRawMaterialModalVisible(true)}
                disabled={!availableRawMaterials.length}
              >
                <LuPlus />
                {t('add')}
              </Button>
            </div>

            {formErrors.raw_materials ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {formErrors.raw_materials}
              </div>
            ) : null}

            {selectedRawMaterials.length ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/40">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('material')}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('quantity')}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">{t('costPerUnit')}</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">{t('total')}</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                      {selectedRawMaterials.map((material) => {
                        const rowTotal = (Number(material.quantity) || 0) * (Number(material.cost_per_unit) || 0);
                        return (
                          <tr key={material.key} className="align-top">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{material.material_name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{material.material_code}</div>
                            </td>
                            <td className="px-4 py-3 min-w-48">
                              <Input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={material.quantity}
                                onChange={(value) => handleUpdateRawMaterial(material.key, 'quantity', value)}
                                addonAfter={<span className="text-sm dark:text-gray-300">{t(String(material.primary_unit).toUpperCase())}</span>}
                              />
                            </td>
                            <td className="px-4 py-3 min-w-40">
                              <Input
                                type="number"
                                min={0.01}
                                step={0.01}
                                value={material.cost_per_unit}
                                onChange={(value) => handleUpdateRawMaterial(material.key, 'cost_per_unit', value)}
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                              ${rowTotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRawMaterial(material.key)}
                                className="inline-flex rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                              >
                                <LuTrash2 />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-900/30">
                  <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('totalCost')}</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/70 py-10 text-center dark:border-gray-700 dark:bg-gray-900/20">
                <LuPackage className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">{t('noRawMaterials')}</p>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-500">{t('rawMaterials')}</p>
                
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100">
              <LuFileText className="text-sky-500" />
              {t('Note')}
            </h2>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={t('enterNotesPlaceholder')}
              className="textarea-input"
            />
          </div>

          <div className="flex flex-col justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row">
            <Button type="button" variant="danger" outline onClick={() => navigate(-1)}>
              <LuArrowLeft />
              {t('cancel')}
            </Button>
            <Button type="button" variant="primary" outline onClick={handleReset}>
              <LuRefreshCw />
              {t('reset')}
            </Button>
            <Button type="submit" disabled={saving}>
              <LuSave />
              {saving ? t('saving') : isEditMode ? t('updateProduction') : t('createProduction')}
            </Button>
          </div>
        </form>
      </div>

      {rawMaterialModalVisible ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('addRawMaterial')}</h3>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <LuX />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('selectRawMaterial')}
                </label>
                <RichSearch
                  data={availableRawMaterials}
                  keyFields={{
                    id: 'id',
                    title: 'material_name',
                    subtitle: 'material_code',
                    image: 'material_image',
                    quantity: 'stock'
                  }}
                  value={modalForm.raw_material_id}
                  onSelected={handleRawMaterialSelect}
                  onSearch={setRawSearch}
                  placeholder={t('selectRawMaterial')}
                />
              </div>

              {selectedRawMaterialForModal ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/20">
                  <div className="flex items-center gap-3">
                    {selectedRawMaterialForModal.material_image ? (
                      <img
                        src={selectedRawMaterialForModal.material_image}
                        alt={selectedRawMaterialForModal.material_name}
                        className="h-10 w-10 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        <FaBox />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{selectedRawMaterialForModal.material_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedRawMaterialForModal.material_code} | {Number(selectedRawMaterialForModal.in_stock || 0).toFixed(2)} {selectedRawMaterialForModal.primary_unit}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('quantity')}
                  </label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={modalForm.quantity}
                    onChange={(value) => setModalForm((prev) => ({ ...prev, quantity: value }))}
                    onBlur={() => handleModalQuantityCostRefresh()}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('unit')}
                  </label>
                  <select
                    value={modalForm.unit}
                    disabled={!selectedRawMaterialForModal}
                    onChange={async (event) => {
                      const nextState = { ...modalForm, unit: event.target.value };
                      setModalForm(nextState);
                      await handleModalQuantityCostRefresh(nextState);
                    }}
                    className="w-full rounded-sm border border-gray-300 bg-transparent px-4 py-2 text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-400 dark:text-white"
                  >
                    <option value="">{t('selectUnit')}</option>
                    {[selectedRawMaterialForModal?.primary_unit, selectedRawMaterialForModal?.secondary_unit]
                      .filter(Boolean)
                      .filter((value, index, array) => array.indexOf(value) === index)
                      .map((unit) => (
                        <option key={unit} value={unit} className="text-gray-900">
                          {unit}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('costPerUnit')}
                </label>
                <div className="rounded-sm border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 dark:border-gray-400 dark:bg-gray-900/30 dark:text-white">
                  {costLoading ? t('loading') : Number(modalForm.cost_per_unit || 0).toFixed(2)}
                </div>
              </div>

              {modalError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                  {modalError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="danger" outline onClick={resetModal}>
                  {t('cancel')}
                </Button>
                <Button type="button" onClick={handleAddRawMaterial}>
                  {t('addMaterial')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};

export default ProductionForm;
