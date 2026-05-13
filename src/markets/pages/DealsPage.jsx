// pages/ProductListing.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductGrid from './ProductGrid';
import ProductFilter from './ProductFilter';
import { useGetAllItemsForMarketPlaceQuery } from '../../../app/Features/itemsSlice';

const DealsPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const currentPage = Number(searchParams.get('page') || 1);
    const [filters, setFilters] = useState({
        categories: [],
        priceRange: null,
        minRating: 0,
        sortBy: 'name',
    });
    const [viewMode, setViewMode] = useState('grid');

    const { data, isLoading, isError } = useGetAllItemsForMarketPlaceQuery({
        limit: 20,
        page: currentPage,
        search: '',
        category_id: '',
        brand_id: '',
        profile_id: '',
        price_range: '',
    });

    const products = data?.data ?? [];
    const pagination = data?.pagination;

    const availableCategories = useMemo(() => {
        return [...new Set(products.map(product => product.category_name).filter(Boolean))];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (filters.categories.length > 0) {
            filtered = filtered.filter(product =>
                filters.categories.includes(product.category_name)
            );
        }

        if (filters.priceRange) {
            filtered = filtered.filter(product => {
                const productPrice = product.price_discount ?? product.price ?? 0;
                if (filters.priceRange.max === null) {
                    return productPrice >= filters.priceRange.min;
                }
                return productPrice >= filters.priceRange.min && productPrice <= filters.priceRange.max;
            });
        }

        filtered.sort((a, b) => {
            const aPrice = a.price_discount ?? a.price ?? 0;
            const bPrice = b.price_discount ?? b.price ?? 0;
            switch (filters.sortBy) {
                case 'price-low': return aPrice - bPrice;
                case 'price-high': return bPrice - aPrice;
                default: return (a.name || '').localeCompare(b.name || '');
            }
        });

        return filtered;
    }, [filters, products]);

    const handleFilterChange = (filterType, value, checked = null) => {
        setFilters(prev => {
            if (filterType === 'categories') {
                const newCategories = checked
                    ? [...prev.categories, value]
                    : prev.categories.filter(category => category !== value);
                return { ...prev, categories: newCategories };
            }
            return { ...prev, [filterType]: value };
        });
    };

    const handleClearFilters = () => {
        setFilters({
            categories: [],
            priceRange: null,
            minRating: 0,
            sortBy: 'name',
        });
    };

    const handlePageChange = (page) => {
        navigate({
            pathname: '',
            search: page > 1 ? `?page=${page}` : '',
        });
    };

    const onProductClick = (product) => {
        navigate(`/market/product_detail/${product.id}`);
    };

    return (
        <div className="min-h-screen text-gray-800">
            {/* Deals Header */}
            <div className="border-b border-gray-200 py-4 px-6">
                <h1 className="text-2xl font-bold text-gray-900">Today's Deals</h1>
                {/* <div className="flex items-center gap-6 mt-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {['Featured', 'Coupons', 'Renewed Deals', 'Warehouse Deals', 'Outlet', 'Digital Deals'].map(tab => (
                        <span key={tab} className="text-sm text-blue-700 hover:text-orange-700 hover:underline cursor-pointer">
                            {tab}
                        </span>
                    ))}
                </div> */}
            </div>

            <div className="flex flex-col lg:flex-row gap-0">
                {/* Sidebar Filter - Amazon Style */}
                <aside className="w-full lg:w-64 flex-shrink-0 p-6 border-r border-gray-100 hidden lg:block">
                    <ProductFilter
                        categories={availableCategories}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                        <p className="text-sm text-gray-700">
                            Showing {filteredProducts.length} results
                        </p>

                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Sort by</span>
                            <select
                                value={filters.sortBy}
                                onChange={(event) => handleFilterChange('sortBy', event.target.value)}
                                className="bg-gray-100 border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#e77600] shadow-sm"
                            >
                                <option value="name">Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="stock-high">Newest Arrivals</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e77600]"></div>
                        </div>
                    ) : isError ? (
                        <div className="text-center py-12 text-red-500 bg-red-50 rounded">
                            <p className="font-bold">Error loading deals</p>
                            <p className="text-sm">Please try refreshing the page</p>
                        </div>
                    ) : (
                        <div className="max-h-[calc(100vh-0px)]">
                            <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
                                <ProductGrid
                                    products={filteredProducts}
                                    onProductClick={onProductClick}
                                    viewMode={viewMode}
                                />
                            </div>

                            {pagination && pagination.last_page > 1 ? (
                                <div className="mt-12 flex items-center justify-center gap-4 py-8 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 shadow-sm"
                                    >
                                        <FaChevronLeft className="text-[10px]" />
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {[...Array(pagination.last_page)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`px-3 py-1 rounded text-sm ${currentPage === i + 1 ? 'border border-[#e77600] font-bold' : 'hover:bg-gray-100'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage >= pagination.last_page}
                                        className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-30 shadow-sm"
                                    >
                                        Next
                                        <FaChevronRight className="text-[10px]" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealsPage;
