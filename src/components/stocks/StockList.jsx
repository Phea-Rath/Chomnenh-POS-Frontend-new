import React from 'react';
import { IoIosSearch, IoIosGrid, IoIosList } from 'react-icons/io';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import {
    FaWarehouse,
    FaExchangeAlt,
    FaCalendarAlt,
    FaUser,
    FaEdit,
    FaTrash,
    FaEye,
    FaPlus,
    FaBox,
    FaBoxOpen,
    FaCubes,
    FaShoppingCart,
    FaArrowRight,
    FaChevronLeft,
    FaChevronRight,
} from 'react-icons/fa';
import AlertBox from '../../services/AlertBox';
import RichSearch from '../../utils/RichSearch';
import { FiFileText } from 'react-icons/fi';

const getStockTypeColor = (type) => {
    const colors = {
        'stock in': 'green',
        'stock out': 'red',
        'stock sale': 'orange',
        transfer: 'blue',
        adjustment: 'purple',
        return: 'yellow',
    };
    return colors[type?.toLowerCase()] || 'gray';
};

const getStockTypeIcon = (type) => {
    const icons = {
        'stock in': <FaBoxOpen className="text-green-500" />,
        'stock out': <FaBox className="text-red-500" />,
        'stock sale': <FaShoppingCart className="text-orange-500" />,
        transfer: <FaExchangeAlt className="text-blue-500" />,
        adjustment: <FaEdit className="text-purple-500" />,
        return: <FaExchangeAlt className="text-yellow-500" />,
    };
    return icons[type?.toLowerCase()] || <FaBox className="text-gray-500" />;
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateTime = (date) =>
    new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit',
    });

const Badge = ({ children, color }) => {
    const colorMap = {
        green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };

    return (
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${colorMap[color] || colorMap.gray}`}>
            {children}
        </span>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-gradient-to-r ${color} p-4 rounded-lg border border-gray-100 dark:border-gray-700`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className="p-2 bg-primary rounded-full">{icon}</div>
        </div>
    </div>
);

const StockList = ({
    title,
    isRaw = false,
    highlightedTitle,
    subtitle,
    stocks,
    isLoading,
    searchTerm,
    onSearchChange,
    searchPlaceholder,
    viewMode,
    onViewModeChange,
    limit,
    onLimitChange,
    limitOptions = [10, 25, 50, 100],
    pagination,
    page,
    setPage,
    paginationSummary,
    statCards = [],
    toolbarActions,
    getTypeLabel = (type) => type,
    getStockItems = (stock) => (Array.isArray(stock?.items) ? stock.items : []),
    getTotalQuantity = (stock) =>
        getStockItems(stock).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    emptyTitle,
    emptyDescription,
    emptyActionText,
    emptyActionLink = 'add',
    loadingTitle,
    loadingDescription,
    stockDetailsLabel,
    createdByLabel,
    transferLabel,
    itemsLabel,
    dateLabel,
    actionsLabel,
    itemsCountLabel,
    quantityLabel,
    showLabel = 'Show',
    deleteDialog,
    onDeleteRequest,
    onDeleteConfirm,
    onDeleteCancel,
}) => {
    const totalItems = (stock) => getStockItems(stock).length;

    const GridItem = ({ stock }) => (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-primary hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <Badge color={getStockTypeColor(stock.stock_type_name)}>
                            {getTypeLabel(stock.stock_type_name)}
                        </Badge>
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white mt-2">{stock.stock_no}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <FaCalendarAlt className="text-gray-400" />
                            <span>{formatDate(stock.stock_date)}</span>
                        </div>
                    </div>
                    <div className="text-2xl">{getStockTypeIcon(stock.stock_type_name)}</div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <FaWarehouse className="text-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{stock.from_warehouse_name}</span>
                    </div>
                    <FaArrowRight className="text-gray-400 shrink-0 mx-1" size={12} />
                    <div className="flex items-center gap-1.5 min-w-0">
                        <FaWarehouse className="text-green-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{stock.to_warehouse_name}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm dark:text-gray-300">
                    <div className="flex items-center gap-1">
                        <FaCubes className="text-purple-500" />
                        <span>{totalItems(stock)} {itemsCountLabel}</span>
                    </div>
                    <div className="font-semibold">{quantityLabel}: {getTotalQuantity(stock)}</div>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                        <FaEye />
                    </Link>
                    <Link target='_blank' to={`/stock${isRaw?'-raw':''}-invoice/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                        <FiFileText />
                    </Link>
                    <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50">
                        <FaEdit />
                    </Link>
                    <button
                        onClick={() => onDeleteRequest(stock.stock_id)}
                        className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>
        </div>
    );

    const ListItemRow = ({ stock }) => (
        <tr className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="text-xl shrink-0">{getStockTypeIcon(stock.stock_type_name)}</div>
                    <div>
                        <div className="font-bold text-xs text-gray-900 dark:text-white">{stock.stock_no}</div>
                        <Badge color={getStockTypeColor(stock.stock_type_name)}>
                            {getTypeLabel(stock.stock_type_name)}
                        </Badge>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FaUser className="text-gray-400" />
                    <span>{stock.created_by_name}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-xs">
                <div className="flex items-center gap-2 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                        <FaWarehouse className="text-blue-500" />
                        <span className="font-medium">{stock.from_warehouse_name}</span>
                    </div>
                    <FaArrowRight className="text-gray-400 mx-2" />
                    <div className="flex items-center gap-1.5">
                        <FaWarehouse className="text-green-500" />
                        <span className="font-medium">{stock.to_warehouse_name}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-xs">
                <div className="space-y-1.5 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                        <FaCubes className="text-purple-500" />
                        <span className="font-semibold">{totalItems(stock)} {itemsCountLabel}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {quantityLabel}: <span className="font-semibold dark:text-gray-200">{getTotalQuantity(stock)}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <FaCalendarAlt size={12} />
                        {formatDateTime(stock.stock_date)}
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-2">
                    <Link to={`detail/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                        <FaEye />
                    </Link>
                    <Link target='_blank' to={`/stock${isRaw?'-raw':''}-invoice/${stock.stock_id}`} className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                        <FiFileText />
                    </Link>
                    <Link to={`update/${stock.stock_id}`} className="p-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50">
                        <FaEdit />
                    </Link>
                    <button
                        onClick={() => onDeleteRequest(stock.stock_id)}
                        className="p-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                        <FaTrash />
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="component-page min-h-screen bg-transparent p-4 lg:p-6">
            <AlertBox
                isOpen={deleteDialog.isOpen}
                title={deleteDialog.title}
                message={deleteDialog.message}
                onConfirm={onDeleteConfirm}
                onCancel={onDeleteCancel}
                confirmText={deleteDialog.confirmText}
                cancelText={deleteDialog.cancelText}
                confirmColor="error"
            />

            <div className="mx-auto">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {title} <span className="text-blue-600 dark:text-blue-400">{highlightedTitle}</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">{subtitle}</p>
                    </div>

                    <div className="flex flex-col flex-wrap text-xs sm:flex-row gap-3 w-full lg:w-auto">
                        {toolbarActions}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div className="relative w-full md:max-w-xl">
                        <IoIosSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 !bg-transparent border border-gray-300 dark:border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                        />
                    </div>
                    <div className="flex rounded-sm border border-gray-200 dark:border-gray-400 p-1">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <IoIosGrid size={20} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <IoIosList size={20} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 px-4 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{showLabel}:</span>
                        {/* <select
                            value={limit}
                            onChange={(e) => onLimitChange(Number(e.target.value))}
                            className="!bg-transparent text-sm font-bold text-blue-600 dark:text-blue-400 focus:outline-none cursor-pointer"
                        >
                            {limitOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select> */}
                        <RichSearch
                         data={limitOptions.map((option) => ({
                            id: option,
                            title: option.toString()
                        }))}
                        keyFields={{
                            id: "id",
                            title: "title"
                        }}
                        onSelected={(value) => onLimitChange(value)}
                        value={limit}
                        />
                    </div>
                </div>

                {pagination && statCards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {statCards.map((card) => (
                            <StatCard key={card.title} {...card} />
                        ))}
                    </div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                    {isLoading ? (
                        <div className="bg-primary rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-6"></div>
                                <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">{loadingTitle}</p>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">{loadingDescription}</p>
                            </div>
                        </div>
                    ) : stocks.length === 0 ? (
                        <div className="bg-primary rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                                    <FaBoxOpen className="text-4xl text-blue-500 dark:text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{emptyTitle}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto">{emptyDescription}</p>
                            {emptyActionText && (
                                <Link to={emptyActionLink}>
                                    <button className="mt-6 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto shadow-lg shadow-blue-500/20">
                                        <FaPlus /> {emptyActionText}
                                    </button>
                                </Link>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {stocks.map((stock) => (
                                <GridItem key={stock.stock_id} stock={stock} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-primary rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stockDetailsLabel}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{createdByLabel}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{transferLabel}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{itemsLabel}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{dateLabel}</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{actionsLabel}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {stocks.map((stock) => (
                                            <ListItemRow key={stock.stock_id} stock={stock} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>

                {pagination && pagination.last_page > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 bg-primary p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{paginationSummary}</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
                            </button>
                            <div className="hidden sm:flex items-center gap-1.5">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === pagination.last_page || (p >= page - 1 && p <= page + 1))
                                    .map((p, i, arr) => (
                                        <React.Fragment key={p}>
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                                            <button
                                                onClick={() => setPage(p)}
                                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === p ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                            </div>
                            <button
                                onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))}
                                disabled={page === pagination.last_page}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <FaChevronRight className="text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockList;
