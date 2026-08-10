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
import { DatePicker, Spin } from 'antd';
import api from '../../services/api';
import Input from '../../utils/Input';
import RichSearch from '../../utils/RichSearch';
import Button from '../../utils/Button';
import { useGetAllItemsQuery } from "@/features/products/itemsSlice";
import { useGetAllRawMaterialQuery } from "@/features/stocks/RawMaterialSlice";
import { useGetAllProductionQuery, useCreateProductionMutation, useUpdateProductionMutation } from "@/features/products/productSlice";
import { MdWarning } from 'react-icons/md';
import { BiCheckCircle } from 'react-icons/bi';
import { LoadingOutlined } from '@ant-design/icons';

import OldTemplateModal from '../../utils/OldTemplateModal';
import ItemTable from '../../utils/ItemTable';
import { getToken } from '@/utils/tokenStore';

const defaultForm = {
  item_id: '',
  quantity: '',
  waste_quantity: 0,
  production_date: dayjs().format('YYYY-MM-DD'),
  notes: '',
};

const defaultModalState = {
  raw_material_id: '',
  quantity: '',
  unit: '',
  total_cost: '',
};
const MENU_ID = 21;
const ProductionForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const token = getToken();
  const [createProduction] = useCreateProductionMutation();
  const [updateProduction] = useUpdateProductionMutation();

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
        waste_quantity: production.waste_quantity || 0,
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
    const selectedIds = selectedRawMaterials.map((rm) => String(rm.raw_material_id));
    return Array.from(materialLookup.values()).filter((rm) => !selectedIds.includes(String(rm.id)));
  }, [materialLookup, selectedRawMaterials]);

  // Sync selected material details with full raw materials data when available
  useEffect(() => {
    if (materialLookup.size > 0 && selectedRawMaterials.length > 0) {
      setSelectedRawMaterials(prev => {
        let hasChanged = false;
        const updated = prev.map(mat => {
          const lookup = materialLookup.get(String(mat.raw_material_id));
          if (lookup) {
            const nameChanged = lookup.material_name && lookup.material_name !== mat.material_name;
            const codeChanged = lookup.material_code && lookup.material_code !== mat.material_code;
            const stockChanged = lookup.in_stock !== undefined && lookup.in_stock !== mat.in_stock;
            const unitChanged = lookup.primary_unit && lookup.primary_unit !== mat.primary_unit;

            if (nameChanged || codeChanged || stockChanged || unitChanged) {
              hasChanged = true;
              return {
                ...mat,
                material_name: lookup.material_name || mat.material_name,
                material_code: lookup.material_code || mat.material_code,
                primary_unit: lookup.primary_unit || mat.primary_unit,
                secondary_unit: lookup.secondary_unit || mat.secondary_unit,
                in_stock: lookup.in_stock ?? mat.in_stock,
              };
            }
          }
          return mat;
        });
        return hasChanged ? updated : prev;
      });
    }
  }, [materialLookup]);

  // Sync selected item details
  useEffect(() => {
    if (items.length > 0 && form.item_id) {
      const found = items.find(i => String(i.item_id) === String(form.item_id));
      if (found) {
        setSelectedItem(prev => {
          if (!prev || String(prev.item_id) !== String(found.item_id) || prev.name !== found.name) {
            return found;
          }
          return prev;
        });
      }
    }
  }, [items, form.item_id]);

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
          waste_quantity: production?.waste_quantity || '',
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
      total_cost: '',
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
        setModalForm((prev) => ({ ...prev, total_cost: cost }));
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
      setModalForm((prev) => ({ ...prev, total_cost: '' }));
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
    console.log(selectedMaterial);
    

    if (!selectedMaterial) {
      setModalError(t('selectRawMaterial'));
      return;
    }

    if (!modalForm.quantity || Number(modalForm.quantity) <= 0) {
      setModalError(t('enterQuantity'));
      return;
    }

    if (!modalForm.total_cost || Number(modalForm.total_cost) <= 0) {
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
      cost_per_unit: Number(modalForm.total_cost / quantityInPrimaryUnit), 
      in_stock: Number(selectedMaterial.in_stock || 0),
    };

    setSelectedRawMaterials((prev) => [...prev, newMaterial]);
    setFormErrors((prev) => ({ ...prev, raw_materials: '' }));
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
              m.key === key ? { ...m, cost_per_unit: cost / m.quantity } : m
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
    if (event) event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        item_id: form.item_id,
        quantity: Number(form.quantity),
        waste_quantity: Number(form.waste_quantity),
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
        ? await updateProduction({ id, itemData: payload, token }).unwrap()
        : await createProduction({ itemData: payload, token }).unwrap();

      if (response?.status === 200 || response?.data?.status === 200 || response) {
        toast.success(isEditMode ? t('productionRecordUpdated') : t('productionRecordCreated'));
        if (refetch) refetch();
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
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="view-page  px-4 md:px-6 font-sans antialiased text-slate-900 dark:text-slate-100"
    >
      <div className="">
        {/* Header Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#13b5ea] hover:underline"
              >
                <LuArrowLeft size={14} />
                {t('backToProduction')}
              </button>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isEditMode ? t('editProductionRecord') : t('createNewProduction')}
                </h1>
                {isEditMode && currentProduction && (
                   <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs  border border-slate-200 dark:border-slate-700">
                    #{currentProduction.id}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTemplateModal(true)}
                  disabled={loading}
                  className="rounded-[2px] border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <LuRefreshCw className={loading ? 'animate-spin' : ''} />
                  {t('useTemplate')}
                </Button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
              >
                {t('reset')}
              </button>
              <Button
                type="button"
                variant='cancel'
                onClick={() => navigate(-1)}
                
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                actionType='is_modify'
                menuId={MENU_ID}
                onClick={() => handleSubmit()}
                disabled={saving}
              >
                {saving ? <LuRefreshCw className="animate-spin" /> : <LuSave />}
                {saving ? t('saving') : isEditMode ? t('updateProduction') : t('saveProduction')}
              </Button>

              {isEditMode && currentProduction && (
                <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-xs font-bold uppercase rounded-[2px]">
                  {dayjs(currentProduction.production_date).format('MMM D, YYYY')}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-8">
          {/* Information Section */}
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
              {t('productionInformation')}
            </h2>

            <div className="grid gap-6 md:grid-cols-12">
              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label htmlFor="production_date" className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('productionDate')}
                </label>
                <DatePicker
                  id="production_date"
                  showTime
                  value={form.production_date ? dayjs(form.production_date) : null}
                  onChange={(date, dateString) => {
                    setForm((prev) => ({ ...prev, production_date: dateString }));
                    setFormErrors((prev) => ({ ...prev, production_date: '' }));
                  }}
                  className="w-full rounded-[2px] border-slate-300 h-[38px]"
                />
                {formErrors.production_date && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.production_date}</p>
                )}
              </div>

              <div className="md:col-span-6 flex flex-col gap-1.5">
                <label htmlFor="item" className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
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
                  placeholder={t('selectAnItem')}
                />
                {formErrors.item_id && <p className="text-xs text-red-500 mt-1">{formErrors.item_id}</p>}
              </div>

              <div className="md:col-span-3 flex flex-col gap-1.5">
                <label htmlFor="quantity" className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('quantityToProduce')}
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
                  addonAfter={selectedItem?.primary_unit || selectedItem?.unit || t('units')}
                />
                {formErrors.quantity && <p className="text-xs text-red-500 mt-1">{formErrors.quantity}</p>}
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex-1">
                {t('rawMaterialsConsumption')}
              </h2>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden">
              <ItemTable
                data={selectedRawMaterials}
                onDelete={(index) => handleRemoveRawMaterial(selectedRawMaterials[index].key)}
                onCellChange={(index, key, value) => handleUpdateRawMaterial(selectedRawMaterials[index].key, key, value)}
                columns={[
                  { title: t('material'), key: 'material_name', type: 'item', subKey: 'material_code' },
                  { 
                    title: t('quantity'), 
                    key: 'quantity', 
                    type: 'number',
                    render: (item) => (
                      <span className="text-[10px] text-slate-400">
                        {t('available')}: {item.in_stock} {item.primary_unit}
                      </span>
                    )
                  },
                  // { 
                  //   title: t('unitCost'), 
                  //   type: 'showonly', 
                  //   render: (item) => `$${(Number(item.cost_per_unit) || 0).toFixed(4)}` 
                  // },
                  { 
                    title: t('total'), 
                    type: 'showonly', 
                    render: (item) => `$${((Number(item.quantity) || 0) * (Number(item.cost_per_unit) || 0)).toFixed(2)}` 
                  }
                ]}
              />
              <div className="bg-slate-50 dark:bg-slate-800/20 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRawMaterialModalVisible(true)}
                  className="flex items-center gap-2 text-[13px] font-bold text-[#13b5ea] hover:text-[#0f92bd] transition-colors uppercase tracking-tight"
                >
                  <LuPlus size={16} />
                  {t('addNewLine')}
                </button>
              </div>
              
              {/* Table Footer / Totals */}
              <div className="flex flex-col items-end gap-2 p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between w-full max-w-[300px] text-slate-500">
                  <span className="text-[13px] font-semibold uppercase">{t('subTotal')}</span>
                  <span className="text-[13px] ">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between w-full max-w-[300px] text-slate-800 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold uppercase">{t('totalProductionCost')}</span>
                  <span className="text-xl font-bold  text-[#13b5ea]">${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {formErrors.raw_materials && (
              <p className="text-xs text-red-500 mt-2">{formErrors.raw_materials}</p>
            )}
          </div>

          {/* Notes Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="notes" className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <LuFileText className="text-slate-400" size={14} />
                {t('notes')}
              </label>
              <textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder={t('enterNotesPlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-[2px] outline-none focus:border-[#13b5ea] transition-all resize-none text-[13px]"
              />
            </div>
            
            <div className="flex flex-col gap-4">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  {t('wasteQuantity')}
                </label>
                <Input
                  id="waste_quantity"
                  type="number"
                  min={0}
                  step={1}
                  value={form.waste_quantity}
                  onChange={(value) => {
                    setForm((prev) => ({ ...prev, waste_quantity: value }));
                  }}
                  addonAfter={selectedItem?.primary_unit || selectedItem?.unit || t('units')}
                />
                <p className="text-[11px] text-slate-400 italic">
                  {t('wasteQuantityDescription') || 'Record any material lost or damaged during this production batch.'}
                </p>
            </div>
          </div>
        </form>
      </div>

      {/* Raw Material Modal */}
      {rawMaterialModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">{t('addRawMaterial')}</h3>
              <button onClick={resetModal} className="text-slate-400 hover:text-slate-600 transition-colors"><LuX size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('selectMaterial')}</label>
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
                  placeholder={t('searchMaterial')}
                />
              </div>

              {selectedRawMaterialForModal && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                  <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-[1px] text-slate-400">
                    <FaBox size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{selectedRawMaterialForModal.material_name}</div>
                    <div className="text-[11px] text-slate-500 uppercase ">{selectedRawMaterialForModal.material_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">{t('stock')}</div>
                    <div className="text-[13px]  font-bold text-slate-700 dark:text-slate-300">{selectedRawMaterialForModal.in_stock} {selectedRawMaterialForModal.primary_unit}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('quantity')}</label>
                  <Input
                    type="number"
                    min={0.01}
                    disabled={!selectedRawMaterialForModal}
                    value={modalForm.quantity}
                    onChange={(value) => setModalForm((prev) => ({ ...prev, quantity: value }))}
                    onBlur={() => handleModalQuantityCostRefresh()}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">{t('unit')}</label>
                  <select
                    value={modalForm.unit}
                    disabled={!selectedRawMaterialForModal}
                    onChange={async (e) => {
                      const next = { ...modalForm, unit: e.target.value };
                      setModalForm(next);
                      await handleModalQuantityCostRefresh(next);
                    }}
                    className="w-full h-[38px] px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-[2px] outline-none focus:border-[#13b5ea]"
                  >
                    <option value="">{t('selectUnit')}</option>
                    {[selectedRawMaterialForModal?.primary_unit, selectedRawMaterialForModal?.secondary_unit]
                      .filter(Boolean)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                 {costLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                      <Spin size="small" /> {t('checkingAvailability')}...
                    </div>
                  ) : modalForm.total_cost > 0 ? (
                    <div className="flex items-center gap-1.5 text-green-600 text-[11px] font-bold uppercase tracking-tight">
                      <BiCheckCircle size={16} /> {t('stockAvailable')}
                    </div>
                  ) : selectedRawMaterialForModal ? (
                    <div className="flex items-center gap-1.5 text-orange-500 text-[11px] font-bold uppercase tracking-tight">
                      <MdWarning size={16} /> {t('insufficientStock')}
                    </div>
                  ) : null}
              </div>

              {modalError && <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-[12px] font-medium">{modalError}</div>}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-[13px] font-bold uppercase text-slate-500 hover:text-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddRawMaterial}
                  className="px-6 py-2 bg-[#13b5ea] hover:bg-[#0f92bd] text-white text-[13px] font-bold uppercase rounded-[2px] transition-all"
                >
                  {t('addMaterial')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      <OldTemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={t('selectProductionTemplate')}
        searchTerm={templateSearchTerm}
        onSearchChange={setTemplateSearchTerm}
        filters={
          <>
            <div className="col-span-6 lg:col-span-3">
              <DatePicker
                value={templateFilters.start_date ? dayjs(templateFilters.start_date) : null}
                onChange={(_, s) => setTemplateFilters(p => ({ ...p, start_date: s || '' }))}
                className="w-full h-10 rounded-[2px]"
                placeholder={t('startDate')}
              />
            </div>
            <div className="col-span-6 lg:col-span-3">
              <DatePicker
                value={templateFilters.end_date ? dayjs(templateFilters.end_date) : null}
                onChange={(_, s) => setTemplateFilters(p => ({ ...p, end_date: s || '' }))}
                className="w-full h-10 rounded-[2px]"
                placeholder={t('endDate')}
              />
            </div>
          </>
        }
        selectedIds={selectedTemplateIds}
        onToggleSelect={toggleSelectTemplate}
        onSelectAll={toggleSelectAllTemplatesOnPage}
        onClearSelection={() => setSelectedTemplateIds([])}
        onImport={handleImportTemplates}
        data={productionHistoryData?.data}
        isLoading={historyLoading}
        columns={[
          { title: t('id'), render: (prod) => <span className="font-bold">#{prod.id}</span> },
          { 
            title: t('item'), 
            render: (prod) => (
              <>
                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{prod.item_name}</div>
                <div className="text-[10px] text-slate-400">{prod.item_code}</div>
              </>
            )
          },
          { title: t('quantity'), key: 'quantity', dataClassName: 'font-bold text-[#13b5ea]' },
          { title: t('date'), render: (prod) => dayjs(prod.production_date).format('YYYY-MM-DD'), dataClassName: 'text-slate-500' }
        ]}
        pagination={templatePagination}
        onPaginationChange={(page) => setTemplatePagination(p => ({ ...p, current: page }))}
        onUseTemplate={handleSelectTemplate}
        t={t}
      />
    </motion.div>
  );
};

export default ProductionForm;
