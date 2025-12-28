// pages/ProductListing.jsx
import React, { useState, useMemo } from 'react';
import { FaFilter, FaList, FaSort } from 'react-icons/fa';
import { products } from '../data/products';
import ProductGrid from './ProductGrid';
import ProductFilter from './ProductFilter';
import { IoGrid } from 'react-icons/io5';
import HomePage from '../Home';

const ProductListing = ({ onProductClick }) => {
    const [filters, setFilters] = useState({
        categories: [],
        priceRange: null,
        minRating: 0,
        sortBy: 'name',
    });
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Category filter
        if (filters.categories.length > 0) {
            filtered = filtered.filter(product =>
                filters.categories.includes(product.category)
            );
        }

        // Price range filter
        if (filters.priceRange) {
            filtered = filtered.filter(product => {
                if (filters.priceRange.max === null) {
                    return product.price >= filters.priceRange.min;
                }
                return product.price >= filters.priceRange.min && product.price <= filters.priceRange.max;
            });
        }

        // Rating filter
        if (filters.minRating > 0) {
            filtered = filtered.filter(product => product.rating >= filters.minRating);
        }

        // Sorting
        filtered = [...filtered].sort((a, b) => {
            switch (filters.sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'rating':
                    return b.rating - a.rating;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [filters]);

    const handleFilterChange = (filterType, value, checked = null) => {
        setFilters(prev => {
            if (filterType === 'categories') {
                const newCategories = checked
                    ? [...prev.categories, value]
                    : prev.categories.filter(cat => cat !== value);
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

    return (
        <div className="max-w-7xl mx-auto">
            <main>
                <HomePage />
            </main>
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className=" border-1 border-gray-400 text-gray-700 px-4 py-2 rounded-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
                    >

                        <FaFilter className="text-gray-600" />{showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                    <p className="text-gray-600">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
                        >
                            <IoGrid />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
                        >
                            <FaList />
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center space-x-2">
                        <FaSort className="text-gray-600" />
                        <select
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Filters Sidebar */}
                {showFilters && (
                    <div className="lg:w-64 flex-shrink-0">
                        <ProductFilter
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                        />
                    </div>
                )}

                {/* Products Grid */}
                <div className="flex-1">
                    <ProductGrid
                        products={filteredProducts}
                        onProductClick={onProductClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductListing;