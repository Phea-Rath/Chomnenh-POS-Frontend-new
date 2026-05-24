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
  LuSearch,
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
import { DatePicker, Checkbox } from 'antd';
import api from '../../services/api';
import Input from '../../utils/Input';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import Modal from '../../utils/Modal';
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

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [debouncedTemplateSearch] = useDebounce(templateSearchTerm, 500);
  const [templateFilters, setTemplateFilters] = useState({
    start_date: '',
    end_date: '',
  });
  const [templatePagination, setTemplatePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);

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

  const {
    data: productionHistoryData,
    isLoading: historyLoading,
  } = useGetAllProductionQuery({
    limit: templatePagination.pageSize,
    page: templatePagination.current,
    search: debouncedTemplateSearch,
    start_date: templateFilters.start_date,
    end_date: templateFilters.end_date,
    token
  }, { skip: !token || !showTemplateModal });

  useEffect(() => {
    if (productionHistoryData?.pagination) {
      setTemplatePagination((prev) => ({
        ...prev,
        total: productionHistoryData.pagination.total,
      }));
    }
  }, [productionHistoryData]);

  const toggleSelectTemplate = (id) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllTemplatesOnPage = () => {
    const productions = productionHistoryData?.data || [];
    const pageIds = productions.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedTemplateIds.includes(id));

    if (allSelected) {
      setSelectedTemplateIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedTemplateIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleSelectTemplate = async (selectedProduction) => {
    setLoading(true);
    try {
      const response = await api.get(`/production/${selectedProduction.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const production = response.data.data;

      setForm({
        item_id: production.item_id || '',
        quantity: production.quantity || '',
        production_date: dayjs().format('YYYY-MM-DD'),
        notes: production.notes || '',
      });

      if (Array.isArray(production.details)) {
        const detailsWithCost = await Promise.all(
          production.details.map(async (detail, index) => {
            const currentMat = materialLookup.get(String(detail.raw_material_id));
            let cost = 0;
            try {
              const costRes = await api.get(`total-cost/${Number(detail.quantity)}/${detail.raw_material_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              cost = Number(costRes.data?.data?.totalCost) || 0;
            } catch (err) {
              console.error('Error fetching cost for material:', detail.raw_material_id, err);
            }
            return {
              key: Date.now() + index,
              raw_material_id: detail.raw_material_id,
              material_name: detail.material_name || 'Unknown Material',
              material_code: detail.material_code || 'N/A',
              primary_unit: detail.primary_unit || 'unit',
              secondary_unit: detail.secondary_unit || '',
              selected_unit: detail.primary_unit || 'unit',
              quantity: Number(detail.quantity) || 0,
              cost_per_unit: cost,
              in_stock: currentMat ? currentMat.in_stock : Number(detail.in_stock || 0),
            };
          })
        );
        setSelectedRawMaterials(detailsWithCost);
      }
      setShowTemplateModal(false);
      toast.success(t('templateAppliedSuccess'));
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error(t('failedToLoadTemplate'));
    } finally {
      setLoading(false);
    }
  };

  const handleImportTemplates = async () => {
    if (selectedTemplateIds.length === 0) return;
    setLoading(true);
    try {
      const allMaterials = [];
      let lastItemId = '';

      for (const templateId of selectedTemplateIds) {
        const response = await api.get(`/production/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const production = response.data.data;
        lastItemId = production.item_id;

        const materials = (production.details || []).map((detail) => {
          const currentMat = materialLookup.get(String(detail.raw_material_id));
          return {
            raw_material_id: detail.raw_material_id,
            material_name: detail.material_name || 'Unknown Material',
            material_code: detail.material_code || 'N/A',
            primary_unit: detail.primary_unit || 'unit',
            secondary_unit: detail.secondary_unit || '',
            selected_unit: detail.primary_unit || 'unit',
            quantity: Number(detail.quantity) || 0,
            in_stock: currentMat ? currentMat.in_stock : Number(detail.in_stock || 0),
          };
        });
        allMaterials.push(...materials);
      }

      // Merge collected materials with current form state
      const mergedList = [...selectedRawMaterials];
      allMaterials.forEach((newMat) => {
        const existingIndex = mergedList.findIndex(
          (mat) => mat.raw_material_id === newMat.raw_material_id
        );
        if (existingIndex >= 0) {
          mergedList[existingIndex] = {
            ...mergedList[existingIndex],
            quantity: mergedList[existingIndex].quantity + newMat.quantity,
          };
        } else {
          mergedList.push({ ...newMat, key: Date.now() + Math.random() });
        }
      });

      // Update costs for all merged materials using the API
      const finalMaterials = await Promise.all(
        mergedList.map(async (mat) => {
          let cost = 0;
          try {
            const costRes = await api.get(`total-cost/${mat.quantity}/${mat.raw_material_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            cost = Number(costRes.data?.data?.totalCost) || 0;
          } catch (error) {
            console.error('Error fetching current cost for material:', mat.raw_material_id, error);
            cost = mat.cost_per_unit || 0;
          }
          return { ...mat, cost_per_unit: cost };
        })
      );

      setSelectedRawMaterials(finalMaterials);
      setForm(prev => ({ ...prev, item_id: prev.item_id || lastItemId }));
      setSelectedTemplateIds([]);
      setShowTemplateModal(false);
      toast.success(t('templatesImportedSuccess'));
    } catch (error) {
      console.error('Error importing templates:', error);
      toast.error(t('failedToImportTemplates'));
    } finally {
      setLoading(false);
    }
  };

  const items = itemData?.data || [];
  const rawMaterials = rawData?.data || [];

  const materialLookup = useMemo(() => {
    const map = new Map();
    rawMaterials.forEach((rm) => {
      const inStock = Array.isArray(rm.stock)
        ? rm.stock.reduce((sum, s) => sum + (Number(s.in_stock) || 0), 0)
        : Number(rm.stock?.in_stock || 0);
      map.set(String(rm.id), { ...rm, in_stock: inStock });
    });
    return map;
  }, [rawMaterials]);

  const availableRawMaterials = useMemo(() => {
    const selectedIds = selectedRawMaterials.map((rm) => rm.raw_material_id);
    return Array.from(materialLookup.values()).filter((rm) => !selectedIds.includes(rm.id));
  }, [materialLookup, selectedRawMaterials]);

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
            production.details.map((detail, index) => {
              const currentMat = materialLookup.get(String(detail.raw_material_id));
              return {
                key: detail.id || `${detail.raw_material_id}-${index}`,
                raw_material_id: detail.raw_material_id,
                material_name: detail.material_name || 'Unknown Material',
                material_code: detail.material_code || 'N/A',
                primary_unit: detail.primary_unit || 'unit',
                secondary_unit: detail.secondary_unit || '',
                selected_unit: detail.primary_unit || 'unit',
                quantity: Number(detail.quantity) || 0,
                cost_per_unit: Number(detail.cost_per_unit) || 0,
                in_stock: currentMat ? currentMat.in_stock : Number(detail.in_stock || 0),
              };
            })
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
    const selectedMaterial = materialLookup.get(String(modalForm.raw_material_id));

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
      in_stock: Number(selectedMaterial.in_stock || 0),
    };

    setSelectedRawMaterials((prev) => [...prev, newMaterial]);
    setFormErrors((prev) => ({ ...prev, raw_materials: '' }));
    toast.success(t('rawMaterialAddedSuccess'));
    resetModal();
  };

  const handleRemoveRawMaterial = (key) => {
    setSelectedRawMaterials((prev) => prev.filter((material) => material.key !== key));
  };

  const handleUpdateRawMaterial = async (key, field, value) => {
    const numValue = Number(value) || 0;
    
    setSelectedRawMaterials((prev) => {
      const next = prev.map((material) => {
        if (material.key === key) {
          let updatedQty = field === 'quantity' ? numValue : material.quantity;
          
          if (field === 'quantity') {
            if (updatedQty > material.in_stock) {
              toast.warning(`${t('insufficientStock') || 'Insufficient stock'}: ${material.in_stock}`);
              updatedQty = material.in_stock;
            }
          }

          return {
            ...material,
            [field]: field === 'quantity' ? updatedQty : numValue,
          };
        }
        return material;
      });
      return next;
    });

    // If quantity changed, fetch new cost
    if (field === 'quantity') {
      const material = selectedRawMaterials.find(m => m.key === key);
      if (!material) return;

      let targetQty = numValue;
      if (targetQty > material.in_stock) targetQty = material.in_stock;

      if (targetQty > 0) {
        try {
          const response = await api.get(`total-cost/${targetQty}/${material.raw_material_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.status === 200) {
            const cost = Number(response.data?.data?.totalCost) || 0;
            setSelectedRawMaterials(prev => prev.map(m => 
              m.key === key ? { ...m, cost_per_unit: cost } : m
            ));
          }
        } catch (error) {
          console.error('Error updating cost:', error);
        }
      }
    }
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

          <div className="flex items-center gap-3">
            {!isEditMode && (
              <Button
                type="button"
                variant="success"
                onClick={() => setShowTemplateModal(true)}
                disabled={loading}
                outline={false}
              >
                <LuRefreshCw className={loading ? 'animate-spin' : ''} />
                {t('useTemplate')}
              </Button>
            )}
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
                  addonAfter={<span className="text-sm dark:text-gray-300">{selectedItem?.primary_unit || selectedItem?.unit || t('unitsCount')}</span>}
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
                              <div className="flex flex-col gap-1">
                                <Input
                                  type="number"
                                  min={0.01}
                                  step={0.01}
                                  max={material.in_stock}
                                  value={material.quantity}
                                  onChange={(value) => handleUpdateRawMaterial(material.key, 'quantity', value)}
                                  addonAfter={<span className="text-sm dark:text-gray-300">{t(String(material.primary_unit).toUpperCase())}</span>}
                                />
                                <span className="text-[10px] text-gray-400">
                                  {t('stock') || 'Stock'}: {material.in_stock}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 min-w-40">
                              <Input
                                type="number"
                                readOnly
                                min={0.01}
                                step={0.01}
                                value={material.cost_per_unit}
                                onChange={(value) => handleUpdateRawMaterial(material.key, 'cost_per_unit', value)}
                                className="bg-gray-50 dark:bg-gray-900/30 cursor-not-allowed"
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
                    quantity: 'in_stock'
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
                    max={selectedRawMaterialForModal?.in_stock}
                    value={modalForm.quantity}
                    onChange={(value) => setModalForm((prev) => ({ ...prev, quantity: value }))}
                    onBlur={() => handleModalQuantityCostRefresh()}
                  />
                  {selectedRawMaterialForModal && (
                    <span className="text-[10px] text-gray-400 mt-1">
                      {t('stock') || 'Stock'}: {selectedRawMaterialForModal.in_stock}
                    </span>
                  )}
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

      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        width={1000}
      >
        <div className="flex flex-col max-h-[85vh]">
          {/* Modal Header */}
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:!text-gray-100">
              {t('selectProductionTemplate')}
            </h3>
          </div>

          {/* Filters Area */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-b dark:border-gray-700">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchProductions')}
                    value={templateSearchTerm}
                    onChange={(e) => setTemplateSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 bg-white py-1.5 pl-10 pr-4 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white rounded-md"
                  />
                </div>
              </div>
              <div className="lg:col-span-3">
                <DatePicker
                  value={templateFilters.start_date ? dayjs(templateFilters.start_date) : null}
                  onChange={(_, dateString) =>
                    setTemplateFilters((prev) => ({ ...prev, start_date: dateString || '' }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t('startDate')}
                />
              </div>
              <div className="lg:col-span-3">
                <DatePicker
                  value={templateFilters.end_date ? dayjs(templateFilters.end_date) : null}
                  onChange={(_, dateString) =>
                    setTemplateFilters((prev) => ({ ...prev, end_date: dateString || '' }))
                  }
                  format="YYYY-MM-DD"
                  className="date-picker w-full"
                  placeholder={t('endDate')}
                />
              </div>
            </div>
          </div>

          {/* Selected Summary */}
          {selectedTemplateIds.length > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {selectedTemplateIds.length}
                </span>
                <span>{t('productionsSelected')}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSelectedTemplateIds([])} 
                  variant="danger" 
                  outline={true}
                  size="small"
                >
                  {t('clearAll')}
                </Button>
                <Button 
                  onClick={handleImportTemplates} 
                  variant="primary"
                  size="small"
                >
                  <LuPlus />
                  {t('importMaterials')}
                </Button>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 border-collapse">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 w-12 text-center">
                    <Checkbox 
                      onChange={toggleSelectAllTemplatesOnPage}
                      checked={productionHistoryData?.data?.length > 0 && productionHistoryData.data.every(p => selectedTemplateIds.includes(p.id))}
                    />
                  </th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t('id')}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t('item')}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t('quantity')}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800">{t('date')}</th>
                  <th className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {historyLoading ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>{t('loading')}...</span>
                      </div>
                    </td>
                  </tr>
                ) : productionHistoryData?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center italic text-gray-400">
                      {t('noProductionsFound')}
                    </td>
                  </tr>
                ) : (
                  productionHistoryData?.data?.map((prod) => {
                    const isSelected = selectedTemplateIds.includes(prod.id);
                    return (
                      <tr 
                        key={prod.id} 
                        className={`transition-colors group cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50 dark:bg-blue-900/20' 
                            : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => toggleSelectTemplate(prod.id)}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => toggleSelectTemplate(prod.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          #{prod.id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">{prod.item_name}</div>
                          <div className="text-xs text-gray-500">{prod.item_code}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{prod.quantity}</td>
                        <td className="px-4 py-3">{dayjs(prod.production_date).format('YYYY-MM-DD')}</td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            onClick={() => handleSelectTemplate(prod)}
                            variant="primary"
                            outline={true}
                            size="small"
                          >
                            {t('useAsBase')}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer / Pagination */}
          <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-medium">
              <div className="text-gray-600 dark:text-gray-400">
                {t('totalRecords')}: <span className="text-gray-900 dark:text-white">{templatePagination.total}</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  disabled={templatePagination.current === 1 || historyLoading}
                  onClick={() => setTemplatePagination(p => ({ ...p, current: p.current - 1 }))}
                  variant="primary"
                  outline={true}
                  size="small"
                >
                  {t('previous')}
                </Button>
                <div className="px-3 py-1 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded shadow-sm text-gray-700 dark:text-gray-200">
                  {templatePagination.current} / {Math.ceil(templatePagination.total / templatePagination.pageSize) || 1}
                </div>
                <Button
                  disabled={templatePagination.current * templatePagination.pageSize >= templatePagination.total || historyLoading}
                  onClick={() => setTemplatePagination(p => ({ ...p, current: p.current + 1 }))}
                  variant="primary"
                  outline={true}
                  size="small"
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ProductionForm;
