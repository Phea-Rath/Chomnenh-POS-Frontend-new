import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaClipboardList, FaBoxOpen, FaCubes, FaShoppingCart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useOutletsContext } from '../../layouts/Management';
import { useGetAllStockRawQuery } from '../../../app/Features/stocksSlice';
import { useGetAllSaleQuery } from '../../../app/Features/salesSlice';
import api from '../../services/api';
import RefreshButton from '../../utils/RefreshButton';
import ExportExcel from '../../services/ExportExcel';
import Button from '../../utils/Button';
import StockList from './StockList';

const getStockItems = (stock) => (Array.isArray(stock?.items) ? stock.items : []);

const getTotalQuantity = (stock) =>
    getStockItems(stock).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

const StockRaws = () => {
    const { t } = useTranslation();
    const { setLoading } = useOutletsContext();
    const token = localStorage.getItem('token');

    const [stocks, setStocks] = useState([]);
    const [id, setId] = useState(0);
    const [alertBox, setAlertBox] = useState(false);
    const [viewMode, setViewMode] = useState(localStorage.getItem('stockViewMode') || 'grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const { data, isLoading, refetch } = useGetAllStockRawQuery({ limit, page, search: searchTerm, token });
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
            const res = await api.delete(`stock_masters_raw/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.status === 200) {
                refetch();
                saleRefetch();
                toast.success(t('rawStockDeletedSuccess'));
            }
        } catch (error) {
            toast.error(error.message || t('rawStockDeleteFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <StockList
            title={t('rawStock')}
            highlightedTitle={t('inventory')}
            subtitle={t('trackManageRawMovements')}
            stocks={stocks}
            isRaw={true}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onSearchChange={(value) => {
                setSearchTerm(value);
                setPage(1);
            }}
            searchPlaceholder={t('searchRawStockPlaceholder')}
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
            paginationSummary={`${t('showing')} ${(page - 1) * limit + 1} ${t('to')} ${Math.min(page * limit, data?.pagination?.total || 0)} ${t('of')} ${data?.pagination?.total || 0} ${t('results')}`}
            statCards={[
                {
                    title: t('totalRawStockRecords'),
                    value: data?.pagination?.total || 0,
                    icon: <FaClipboardList className="text-blue-500" />,
                    color: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
                },
                {
                    title: t('currentPage'),
                    value: data?.pagination?.current_page || 0,
                    icon: <FaBoxOpen className="text-green-500" />,
                    color: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
                },
                {
                    title: t('itemsOnPage'),
                    value: stocks.length,
                    icon: <FaCubes className="text-orange-500" />,
                    color: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
                },
                {
                    title: t('lastPage'),
                    value: data?.pagination?.last_page || 0,
                    icon: <FaShoppingCart className="text-purple-500" />,
                    color: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
                },
            ]}
            toolbarActions={
                <>
                    <RefreshButton onRefresh={refetch} />
                    <ExportExcel data={stocks} title="Raw Stock" />
                    <Link to="add">
                        <Button variant="success">
                            <FaPlus />
                            {t('new')}
                        </Button>
                    </Link>
                </>
            }
            getStockItems={getStockItems}
            getTotalQuantity={getTotalQuantity}
            emptyTitle={t('noRawStockRecordsFound')}
            emptyDescription={stocks.length === 0 ? t('startTrackingRawStock') : t('noStockMatchSearch')}
            emptyActionText={t('createFirstRawStockRecord')}
            loadingTitle={t('loadingRawStockData')}
            loadingDescription={t('fetchingInventoryRecords')}
            stockDetailsLabel={t('stockDetails')}
            createdByLabel={t('createdBy')}
            transferLabel={t('transfer')}
            itemsLabel={t('items')}
            dateLabel={t('date')}
            actionsLabel={t('actions')}
            itemsCountLabel={t('itemsCount')}
            quantityLabel={t('totalQty')}
            showLabel={t('show')}
            deleteDialog={{
                isOpen: alertBox,
                title: t('deleteRawStockRecord'),
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

export default StockRaws;
