import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from 'framer-motion';
import {
    LuArrowLeft,
    LuCalendar,
    LuFileText,
    LuPlus,
    LuRefreshCw,
    LuSave,
    LuTrash2,
    LuUser,
    LuBox,
    LuFileJson,
    LuSettings2,
    LuPackage,
    LuX
} from 'react-icons/lu';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Checkbox, DatePicker } from "antd";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";

import api from "../../services/api";
import { useOutletsContext } from "../../layouts/Management";
import { useGetAllSaleQuery } from "@/features/sales/salesSlice";
import { useGetAllCustomerQuery } from "@/features/customers/customersSlice";
import { useGetAllQuoteQuery, useGetQuoteByIdQuery, useCreateQuoteMutation, useUpdateQuoteMutation } from "@/features/sales/quoteSlice";
import { totalPirceQuanDiscount } from "../../services/serviceFunction";

import RichSearch from "../../utils/RichSearch";
import Input from "../../utils/Input";
import Button from "../../utils/Button";
import AlertBox from "../../services/AlertBox";

import OldTemplateModal from "../../utils/OldTemplateModal";
import ItemTable from "../../utils/ItemTable";
import { getToken } from '@/utils/tokenStore';
const MENU_ID = 18;
const QuotationForm = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const token = getToken();
    const { setLoading } = useOutletsContext();
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebounce(search, 500);
    const [alertBox, setAlertBox] = useState(false);

    const [items, setItems] = useState([]);
    const [selectItems, setSelectItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');
    const [debouncedTemplateSearch] = useDebounce(templateSearchTerm, 500);
    const [templateFilters, setTemplateFilters] = useState({
        start_date: '',
        end_date: '',
        customer_id: '',
    });
    const [templatePagination, setTemplatePagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);

    const itemsRes = useGetAllSaleQuery({ token, limit, page: currentPage, search: debouncedSearch });
    const { data: customers } = useGetAllCustomerQuery(token);
    const { refetch } = useGetAllQuoteQuery({ token, search: '' });

    const {
        data: quoteHistoryData,
        isLoading: historyLoading,
    } = useGetAllQuoteQuery({
        limit: templatePagination.pageSize,
        page: templatePagination.current,
        search: debouncedTemplateSearch,
        start_date: templateFilters.start_date,
        end_date: templateFilters.end_date,
        customer_id: templateFilters.customer_id,
        token
    }, { skip: !token || !showTemplateModal });

    useEffect(() => {
        if (quoteHistoryData?.pagination) {
            setTemplatePagination((prev) => ({
                ...prev,
                total: quoteHistoryData.pagination.total,
            }));
        }
    }, [quoteHistoryData]);

    const { data: quoteData, isFetching: quoteLoading, refetch: refetchQuote } = useGetQuoteByIdQuery(
        { id: id , token },
        { skip: !isEditMode }
    );

    const [createQuote] = useCreateQuoteMutation();
    const [updateQuote] = useUpdateQuoteMutation();

    const [form, setForm] = useState({
        customer_id: 0,
        date: dayjs().format('YYYY-MM-DD'),
        credit_term: 0,
        date_term: "",
        delivery_fee: 0,
        tax: 0,
        status: "draft",
        notes: "",
    });

    useEffect(() => {
        if (itemsRes.data?.data) {
            setItems(itemsRes.data.data);
        }
    }, [itemsRes.data]);

    useEffect(() => {
        setCurrentPage(1);
        setLimit(10);
    }, [debouncedSearch]);

    // Derived totals using useMemo
    const totals = useMemo(() => {
        const order_total = selectItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
        const total_discount = selectItems.reduce((sum, item) => {
            const subtotal = Number(item.price) * Number(item.quantity);
            return sum + (subtotal * (Number(item.discount) / 100));
        }, 0);

        const discounted_total = order_total - total_discount;
        const tax_rate = Number(form.tax) || 0;
        const tax_amount = discounted_total * (tax_rate / 100);
        const delivery_fee = Number(form.delivery_fee) || 0;
        const grand_total = discounted_total + delivery_fee + tax_amount;

        return {
            order_total,
            total_discount,
            tax_amount,
            grand_total
        };
    }, [selectItems, form.tax, form.delivery_fee]);

    useEffect(() => {
        if (isEditMode && quoteData?.data) {
            const data = quoteData.data;
            setForm({
                customer_id: data.customer_id || 0,
                date: data.date || dayjs().format('YYYY-MM-DD'),
                credit_term: data.credit_term || 0,
                date_term: data.date_term || "",
                delivery_fee: Number(data.delivery_fee) || 0,
                tax: Number(data.tax) || 0,
                status: data.status || "draft",
                notes: data.notes || "",
            });

            if (data.details && Array.isArray(data.details)) {
                const mappedItems = data.details.map((item, index) => ({
                    key: Date.now() + index,
                    id: item.item_id,
                    item_id: item.item_id,
                    code: item.item_code || item.code,
                    name: item.item_name || item.name,
                    image: item.images?.[0]?.image || item.image,
                    price: Number(item.item_price || item.price || 0),
                    quantity: Number(item.quantity || 1),
                    discount: Number(item.discount) || 0,
                    scale: item.scale_name || "",
                }));
                setSelectItems(mappedItems);
            }
        }
    }, [isEditMode, quoteData]);

    const calculateItemTotal = (item) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        const discount = Number(item.discount) || 0;
        const subtotal = quantity * price;
        const discountAmount = subtotal * (discount / 100);
        return subtotal - discountAmount;
    };

    const onSelectItem = (value) => {
        const item = items.find((exp) => String(exp.id) === String(value));
        if (!item) return;

        const existingIndex = selectItems.findIndex((si) => String(si.id) === String(value));
        if (existingIndex !== -1) {
            const updated = [...selectItems];
            updated[existingIndex].quantity += 1;
            setSelectItems(updated);
            return;
        }

        const newItem = {
            key: Date.now(),
            id: item.id,
            item_id: item.id,
            code: item.code,
            name: item.name,
            image: item.image,
            price: Number(item.price || 0),
            quantity: 1,
            discount: 0,
            scale: item.scale_name || "",
        };

        setSelectItems([...selectItems, newItem]);
    };

    const handleChange = (key, field, value) => {
        const updated = selectItems.map(item => {
            if (item.key === key) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setSelectItems(updated);
    };

    const handleRemove = (key) => {
        const filtered = selectItems.filter(item => item.key !== key);
        setSelectItems(filtered);
    };

    const onScrollFetch = (e) => {
        const target = e.target;
        const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
        if (nearBottom && itemsRes?.data?.pagination?.total > selectItems.length) {
            setLimit(prev => prev + 10);
        }
    };

    const handleConfirm = async () => {
        setAlertBox(false);
        setSaving(true);

        try {
            const payload = {
                ...form,
                ...totals,
                items: selectItems.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    quantity: item.quantity,
                    discount: item.discount,
                    price: item.price
                }))
            };

            const response = isEditMode
                ? await updateQuote({ id, itemData: payload, token }).unwrap()
                : await createQuote({ itemData: payload, token }).unwrap();

            if (response?.status == 200 || response?.data?.status == 200 || response) {
                toast.success(isEditMode ? t('quotationRecordUpdated') : t('quotationRecordCreated'));
                refetch();
                if (isEditMode && refetchQuote) refetchQuote();
                const targetId = response?.id || response?.data?.id || id;
                navigate(`/home/quotations/receipt/${targetId}`);
            }
        } catch (error) {
            toast.error(error?.data?.message || error?.response?.data?.message || t('failedToSaveQuotation'));
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (selectItems.length === 0) {
            toast.error(t('pleaseAddAtLeastOneItem'));
            return;
        }
        if (!form.customer_id) {
            toast.error(t('pleaseSelectACustomer'));
            return;
        }
        setAlertBox(true);
    };

    const handleReset = () => {
        setSelectItems([]);
        setForm({
            customer_id: 0,
            date: dayjs().format('YYYY-MM-DD'),
            credit_term: 0,
            date_term: "",
            delivery_fee: 0,
            tax: 0,
            status: "draft",
            notes: "",
        });
    };

    const toggleSelectTemplate = (id) => {
        setSelectedTemplateIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAllTemplatesOnPage = () => {
        const quotes = quoteHistoryData?.data || [];
        const pageIds = quotes.map((q) => q.quotation_id);
        const allSelected = pageIds.every((id) => selectedTemplateIds.includes(id));

        if (allSelected) {
            setSelectedTemplateIds((prev) => prev.filter((id) => !pageIds.includes(id)));
        } else {
            setSelectedTemplateIds((prev) => [...new Set([...prev, ...pageIds])]);
        }
    };

    const handleSelectTemplate = async (selectedQuote) => {
        setLoading(true);

        try {
            const response = await api.get(`/quotations/${selectedQuote.quotation_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const quote = response.data.data;
            const today = dayjs().format('YYYY-MM-DD');

            setForm({
                customer_id: quote.customer_id || 0,
                date: today,
                credit_term: quote.credit_term || 0,
                date_term: quote.credit_term ? dayjs(today).add(quote.credit_term, 'day').format('YYYY-MM-DD') : "",
                delivery_fee: Number(quote.delivery_fee) || 0,
                tax: Number(quote.tax) || 0,
                status: "draft",
                notes: quote.notes || "",
            });

            if (Array.isArray(quote.details)) {
                const mappedItems = quote.details.map((item, index) => ({
                    key: Date.now() + index + Math.random(),
                    id: item.item_id,
                    item_id: item.item_id,
                    code: item.item_code || item.code,
                    name: item.item_name || item.name,
                    image: item.images?.[0]?.image || item.image,
                    price: Number(item.item_price || item.price || 0),
                    quantity: Number(item.quantity || 1),
                    discount: Number(item.discount) || 0,
                    scale: item.scale_name || "",
                }));
                setSelectItems(mappedItems);
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
            const allItemsFromTemplates = [];
            let lastCustomerId = 0;
            let lastDeliveryFee = 0;
            let lastTax = 0;

            for (const templateId of selectedTemplateIds) {
                const response = await api.get(`/quotations/${templateId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const quote = response.data.data;
                lastCustomerId = quote.customer_id;
                lastDeliveryFee = Number(quote.delivery_fee) || 0;
                lastTax = Number(quote.tax) || 0;

                const templateItems = (quote.details || []).map((item) => ({
                    id: item.item_id,
                    item_id: item.item_id,
                    code: item.item_code || item.code,
                    name: item.item_name || item.name,
                    image: item.images?.[0]?.image || item.image,
                    price: Number(item.item_price || item.price || 0),
                    quantity: Number(item.quantity || 1),
                    discount: Number(item.discount) || 0,
                    scale: item.scale_name || "",
                }));
                allItemsFromTemplates.push(...templateItems);
            }

            const mergedList = [...selectItems];
            allItemsFromTemplates.forEach((newItem) => {
                const existingIndex = mergedList.findIndex(
                    (item) => String(item.id) === String(newItem.id)
                );
                if (existingIndex >= 0) {
                    mergedList[existingIndex] = {
                        ...mergedList[existingIndex],
                        quantity: mergedList[existingIndex].quantity + newItem.quantity,
                    };
                } else {
                    mergedList.push({ ...newItem, key: Date.now() + Math.random() });
                }
            });

            setSelectItems(mergedList);
            setForm(prev => ({
                ...prev,
                customer_id: prev.customer_id || lastCustomerId,
                delivery_fee: prev.delivery_fee || lastDeliveryFee,
                tax: prev.tax || lastTax
            }));
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

    if (quoteLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-[#13b5ea]" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="view-page px-4 md:px-6 font-sans antialiased text-slate-900 dark:text-slate-100"
        >

            <div>
                {/* Header Section */}
                <div className="border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate('/home/quotations')}
                                className="mb-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#13b5ea] hover:underline"
                            >
                                <LuArrowLeft size={14} />
                                {t('backToQuotations')}
                            </button>

                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {isEditMode ? t('editQuotationRecord') : t('createNewQuotation')}
                                </h1>
                                {isEditMode && id && (
                                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-[2px] text-xs border border-slate-200 dark:border-slate-700">
                                        #{id}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {!isEditMode && (
                                <Button
                                    type="button"
                                    variant="siliver"
                                    onClick={() => setShowTemplateModal(true)}
                                    disabled={saving}
                                    className="rounded-[2px] border-slate-300 text-slate-700 hover:bg-slate-50"
                                >
                                    <LuRefreshCw className={saving ? 'animate-spin' : ''} />
                                    {t('reuse')}
                                </Button>
                            )}

                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                {t('reset')}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[2px] text-[13px] font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <Button
                                type="button"
                                onClick={() => handleSubmit()}
                                variant="save"
                                disabled={saving}
                                actionType="is_modify"
                                menuId={MENU_ID}
                            >
                                {saving ? <LuRefreshCw className="animate-spin" /> : <LuSave />}
                                {saving ? t('saving') : isEditMode ? t('updateQuotation') : t('saveQuotation')}
                            </Button>

                            {isEditMode && (
                                <span className={`px-3 py-1 text-xs font-bold uppercase rounded-[2px] ${form.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                                        form.status === 'draft' ? 'bg-slate-50 text-slate-700 border border-slate-200' :
                                            'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                    }`}>
                                    {t(form.status)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-8">
                    {/* Information Section */}
                    <div>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
                            <LuUser size={14} />
                            {t('quotationInformation')}
                        </h2>

                        <div className="grid gap-6 md:grid-cols-12">
                            <div className="md:col-span-4 flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                    {t('customer')}
                                </label>
                                <RichSearch
                                    data={customers?.data || []}
                                    value={form.customer_id}
                                    placeholder={t('selectCustomer')}
                                    keyFields={{
                                        id: "customer_id",
                                        title: "customer_name",
                                        image: "image",
                                        subtitle: "customer_tel",
                                    }}
                                    onSelected={(val) => setForm(prev => ({ ...prev, customer_id: val }))}
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                    {t('date')}
                                </label>
                                <DatePicker
                                    value={form.date ? dayjs(form.date) : null}
                                    onChange={(_, s) => {
                                        const dateStr = s;
                                        setForm(prev => ({
                                            ...prev,
                                            date: dateStr,
                                            date_term: prev.credit_term ? dayjs(dateStr).add(Number(prev.credit_term), 'day').format('YYYY-MM-DD') : ""
                                        }));
                                    }}
                                    className="date-picker"
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                    {t('creditTerm')}
                                </label>
                                <Input
                                    type="number"
                                    value={form.credit_term}
                                    onChange={(val) => {
                                        const term = Number(val) || 0;
                                        setForm(prev => ({
                                            ...prev,
                                            credit_term: term,
                                            date_term: prev.date ? dayjs(prev.date).add(term, 'day').format('YYYY-MM-DD') : ""
                                        }));
                                    }}
                                    addonAfter={t('days')}
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                                    {t('expiryDate')}
                                </label>
                                <DatePicker
                                    value={form.date_term ? dayjs(form.date_term) : null}
                                    readOnly
                                    className="date-picker"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Line Items Section */}
                    <div>
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 flex-1 flex items-center gap-2">
                                <LuPackage size={14} />
                                {t('orderItems')}
                            </h2>
                            <div className="w-full sm:w-80">
                                <RichSearch
                                    data={items}
                                    placeholder={t('addItem')}
                                    keyFields={{
                                        id: "id",
                                        title: "name",
                                        image: "image",
                                        subtitle: "code",
                                        price: "price",
                                        quantity: "in_stock",
                                    }}
                                    onSelected={onSelectItem}
                                    onSearch={setSearch}
                                    onScrollReader={onScrollFetch}
                                />
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-[2px] overflow-hidden">
                            <ItemTable
                                data={selectItems}
                                onDelete={(index) => handleRemove(selectItems[index].key)}
                                onCellChange={(index, key, value) => handleChange(selectItems[index].key, key, value)}
                                columns={[
                                    { title: t('item'), key: 'name', type: 'item', subKey: 'code' },
                                    { title: t('quantity'), key: 'quantity', type: 'number' },
                                    { title: t('price'), key: 'price', type: 'number' },
                                    { title: t('discount'), key: 'discount', type: 'discount' },
                                    {
                                        title: t('total'),
                                        type: 'showonly',
                                        render: (item) => `$${calculateItemTotal(item).toFixed(2)}`
                                    }
                                ]}
                            />

                            {/* Table Footer / Totals */}
                            <div className="flex justify-between bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                                <div className="grow p-4">
                                    <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <LuFileText className="text-slate-400" size={14} />
                                        {t('notes')}
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={form.notes}
                                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder={t('enterNotesPlaceholder')}
                                        className="textarea-input"
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2 p-6 ">
                                    <div className="flex justify-between w-full max-w-[350px] text-slate-500">
                                        <span className="text-[13px] font-semibold uppercase">{t('subTotal')}</span>
                                        <span className="text-[13px] ">${totals.order_total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-[350px] text-slate-500">
                                        <span className="text-[13px] font-semibold uppercase">{t('totalDiscount')}</span>
                                        <span className="text-[13px] ">-${totals.total_discount.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 items-center gap-4 w-full max-w-[350px] mt-2">
                                        <Checkbox
                                            checked={form.tax == 10}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setForm(prev => ({ ...prev, tax: 10 }))
                                                } else {
                                                    setForm(prev => ({ ...prev, tax: 0 }))
                                                }
                                            }}
                                        >
                                            <span className="text-[11px] font-bold uppercase text-slate-400">Tax Include</span>
                                        </Checkbox>

                                        <div className="flex flex-col gap-1">
                                            <label className="text-[11px] font-bold uppercase text-slate-400">{t('deliveryFee')}</label>
                                            <Input
                                                type="number"
                                                value={form.delivery_fee}
                                                onChange={(val) => setForm(prev => ({ ...prev, delivery_fee: val }))}
                                                className="h-8 text-xs"
                                                addonBefore="$"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between w-full max-w-[350px] text-slate-800 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700 mt-2">
                                        <span className="text-sm font-bold uppercase">{t('grandTotal')}</span>
                                        <span className="text-xl font-bold text-[#13b5ea]">${totals.grand_total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid md:grid-cols-2 gap-8">


                        {isEditMode && (
                            <div className="space-y-2">
                                <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <LuSettings2 className="text-slate-400" size={14} />
                                    {t('status')}
                                </label>
                                <RichSearch
                                    data={[
                                        { id: "draft", title: t('draft') },
                                        { id: "submitted", title: t('submitted') },
                                        { id: "approved", title: t('approved') },
                                        { id: "rejected", title: t('rejected') },
                                        { id: "converted", title: t('converted') },
                                    ]}
                                    value={form.status}
                                    onSelected={(value) => setForm(prev => ({ ...prev, status: value }))}
                                    keyFields={{ id: "id", title: "title" }}
                                />
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Template Modal */}
            <OldTemplateModal
                open={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                title={t('selectQuotationTemplate')}
                searchTerm={templateSearchTerm}
                onSearchChange={setTemplateSearchTerm}
                filters={
                    <div className="flex gap-2">
                        <div className="w-64">
                            <RichSearch
                                data={customers?.data || []}
                                value={templateFilters.customer_id}
                                placeholder={t('selectCustomer')}
                                keyFields={{
                                    id: "customer_id",
                                    title: "customer_name",
                                    image: "image",
                                    subtitle: "customer_tel",
                                }}
                                onSelected={(val) => setTemplateFilters(prev => ({ ...prev, customer_id: val }))}
                            />
                        </div>
                        <div className="col-span-6 lg:col-span-3">
                            <DatePicker
                                value={templateFilters.start_date ? dayjs(templateFilters.start_date) : null}
                                onChange={(_, s) => setTemplateFilters(p => ({ ...p, start_date: s || '' }))}
                                className="date-picker"
                                placeholder={t('startDate')}
                            />
                        </div>
                        <div className="col-span-6 lg:col-span-3">
                            <DatePicker
                                value={templateFilters.end_date ? dayjs(templateFilters.end_date) : null}
                                onChange={(_, s) => setTemplateFilters(p => ({ ...p, end_date: s || '' }))}
                                className="date-picker"
                                placeholder={t('endDate')}
                            />
                        </div>
                    </div>
                }
                selectedIds={selectedTemplateIds}
                onToggleSelect={toggleSelectTemplate}
                onSelectAll={toggleSelectAllTemplatesOnPage}
                onClearSelection={() => setSelectedTemplateIds([])}
                onImport={handleImportTemplates}
                data={quoteHistoryData?.data}
                isLoading={historyLoading}
                columns={[
                    { title: t('id'), render: (quote) => <span className="font-bold">#{quote.quotation_id}</span> },
                    {
                        title: t('customer'),
                        render: (quote) => (
                            <>
                                <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200">{quote.customer_name}</div>
                                <div className="text-[10px] text-slate-400">{quote.customer_tel}</div>
                            </>
                        )
                    },
                    {
                        title: t('total'),
                        render: (quote) => `$${Number(quote.grand_total).toFixed(2)}`,
                        dataClassName: 'font-bold text-[#13b5ea]'
                    },
                    { title: t('date'), render: (quote) => dayjs(quote.date).format('YYYY-MM-DD'), dataClassName: 'text-slate-500 dark:text-slate-200' }
                ]}
                pagination={templatePagination}
                onPaginationChange={(page) => setTemplatePagination(p => ({ ...p, current: page }))}
                onUseTemplate={handleSelectTemplate}
                t={t}
            />

            <AlertBox
                isOpen={alertBox}
                title={t('confirmation')}
                message={t('confirmCreateQuoteMsg', { action: isEditMode ? t('update') : t('create') })}
                onConfirm={handleConfirm}
                onCancel={() => setAlertBox(false)}
                confirmText={isEditMode ? t('update') : t('create')}
                cancelText={t('cancel')}
            />
        </motion.div>
    );
};

export default QuotationForm;
