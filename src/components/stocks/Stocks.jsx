import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaFileExport, FaClipboardList, FaBoxOpen, FaCubes, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllStockQuery } from '../../../app/Features/stocksSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import api from '../../services/api';
import RefreshButton from '../../utils/RefreshButton';
import StockList from '../../utils/StockList';
import Button from '../../utils/Button';
const MENU_ID = 22;
const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateTime = (date) =>
    new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const getStockItems = (stock) => (Array.isArray(stock?.items) ? stock.items : []);

const getTotalQuantity = (stock) =>
    getStockItems(stock).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

const getStockTypeLabel = (type, t) => {
    const labels = {
        'stock in': t('stockIn'),
        'stock out': t('stockOut'),
        'stock sale': t('stockSale'),
        transfer: t('transfer'),
        adjustment: t('adjustment'),
        return: t('return'),
    };
    return labels[type?.toLowerCase()] || type;
};

const Stocks = () => {
    const { t } = useTranslation();
    const { setLoading } = useOutletsContext();
    const token = localStorage.getItem('token');

    const [stocks, setStocks] = useState([]);
    const [id, setId] = useState(0);
    const [alertBox, setAlertBox] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('stockViewMode') || 'grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading, refetch } = useGetAllStockQuery({ limit, page, search: searchTerm, token });
    const { refetch: saleRefetch } = useGetAllSaleQuery(token);

    useEffect(() => {
        setStocks(data?.data || []);
    }, [data?.data]);

    const handleDelete = (stockId) => {
        setId(stockId);
        setAlertBox(true);
    };

    const handleConfirm = async () => {
        setAlertBox(false);
        setLoading(true);
        try {
            const res = await api.delete(`stock_masters/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                refetch();
                saleRefetch();
                toast.success(t('orderDeletedSuccessfully'));
            }
        } catch (error) {
            toast.error(error.message || t('orderDeleteFailed'));
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        try {
            setExportLoading(true);
            if (stocks.length === 0) {
                toast.warning(t('noProductsFound'));
                return;
            }

            const workbook = XLSX.utils.book_new();
            const summaryData = stocks.map((stock, idx) => ({
                'S.No': idx + 1,
                'Stock ID': stock.stock_id,
                'Stock Number': stock.stock_no || 'N/A',
                'Stock Type': stock.stock_type_name || 'N/A',
                'From Warehouse': stock.from_warehouse_name || 'N/A',
                'To Warehouse': stock.to_warehouse_name || 'N/A',
                'Stock Date': stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
                'Created Date': stock.created_at ? formatDateTime(stock.created_at) : 'N/A',
                'Created By': stock.created_by_name || 'N/A',
                Remark: stock.stock_remark || 'N/A',
                'Total Items': getStockItems(stock).length,
                'Total Quantity': getTotalQuantity(stock),
                'Status': stock.status || 'Active',
            }));
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), 'Stock Summary');

            const itemsData = [];
            stocks.forEach((stock) => {
                getStockItems(stock).forEach((item) => {
                    itemsData.push({
                        'Stock Number': stock.stock_no,
                        'Stock Type': stock.stock_type_name,
                        'Item Name': item.item_name,
                        'Item Code': item.item_code,
                        Quantity: item.quantity,
                        'Unit Price': item.item_price,
                        'Total Value': (item.quantity || 0) * (item.item_price || 0),
                        'Batch No': item.batch_no || 'N/A',
                        'Expiry Date': item.expiry_date || 'N/A',
                        'From Warehouse': stock.from_warehouse_name,
                        'To Warehouse': stock.to_warehouse_name,
                        'Stock Date': stock.stock_date ? formatDate(stock.stock_date) : 'N/A',
                    });
                });
            });
            if (itemsData.length > 0) {
                XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(itemsData), 'Items Details');
            }

            XLSX.writeFile(workbook, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success(t('successfully'));
        } catch (error) {
            console.error(error);
            toast.error(t('processFailed'));
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <StockList
            menuId={MENU_ID}
            title={t('stockManagement')}
            highlightedTitle={t('inventory')}
            subtitle={t('trackInventoryMovements')}
            stocks={stocks}
            isRaw={false}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={(value) => {
                setSearchTerm(value);
                setPage(1);
            }}
            searchPlaceholder={t('searchStockPlaceholder')}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
                setViewMode(mode);
                localStorage.setItem('stockViewMode', mode);
            }}
            limit={limit}
            onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
            }}
            pagination={data?.pagination}
            page={page}
            setPage={setPage}
            paginationSummary={t('showingPageOf', {
                page: `${(page - 1) * limit + 1} - ${Math.min(page * limit, data?.pagination?.total || 0)}`,
                total: data?.pagination?.total || 0,
            })}
            statCards={[
                {
                    title: t('totalStockRecords'),
                    value: data?.pagination?.total || 0,
                    icon: <FaClipboardList className="text-blue-500" />,
                    color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-xs',
                },
                {
                    title: t('page'),
                    value: data?.pagination ? `${data.pagination.current_page} / ${data.pagination.last_page}` : '0 / 0',
                    icon: <FaBoxOpen className="text-green-500" />,
                    color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-xs',
                },
                {
                    title: t('itemsOnPage'),
                    value: stocks.length,
                    icon: <FaCubes className="text-orange-500" />,
                    color: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-xs',
                },
                {
                    title: t('totalOrders'),
                    value: data?.pagination?.total || 0,
                    icon: <FaShoppingCart className="text-purple-500" />,
                    color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-xs',
                },
            ]}
            toolbarActions={
                <>
                    <RefreshButton onRefresh={refetch} />
                    <button
                        onClick={exportToExcel}
                        disabled={exportLoading}
                        className="px-4 py-2 bg-primary border border-blue-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        title={t('exportExcel')}
                    >
                        <FaFileExport />
                        {exportLoading ? t('exporting') : t('exportExcel')}
                    </button>
                    <Link to="add" className="w-full sm:w-auto">
                        <Button variant='save' actionType='is_modify' menuId={MENU_ID}>
                            <FaPlus />
                            {t('addNewStock')}
                        </Button>
                    </Link>
                </>
            }
            getTypeLabel={(type) => getStockTypeLabel(type, t)}
            getStockItems={getStockItems}
            getTotalQuantity={getTotalQuantity}
            emptyTitle={t('noStockRecordsFound')}
            emptyDescription={stocks.length === 0 ? t('startTrackingInventory') : t('noStockMatchSearch')}
            emptyActionText={t('createFirstStockRecord')}
            loadingTitle={t('loadingStockData')}
            loadingDescription={t('fetchingInventoryRecords')}
            stockDetailsLabel={t('stockDetails')}
            createdByLabel={t('createdBy')}
            transferLabel={t('transfer')}
            itemsLabel={t('items')}
            dateLabel={t('date')}
            actionsLabel={t('actions')}
            itemsCountLabel={t('itemsCount')}
            quantityLabel={t('totalQuantity')}
            showLabel={t('show')}
            deleteDialog={{
                isOpen: alertBox,
                title: t('deleteStockRecord'),
                message: t('deleteStockConfirm'),
                confirmText: t('delete'),
                cancelText: t('cancel'),
            }}
            onDeleteRequest={handleDelete}
            onDeleteConfirm={handleConfirm}
            onDeleteCancel={() => setAlertBox(false)}
        />
    );
};

export default Stocks;
