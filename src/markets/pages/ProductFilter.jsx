// components/ProductFilter.jsx
import React from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';

const ProductFilter = ({ categories = [], filters, onFilterChange, onClearFilters }) => {
    const priceRanges = [
        { label: 'Under $25', min: 0, max: 25 },
        { label: '$25 - $50', min: 25, max: 50 },
        { label: '$50 - $100', min: 50, max: 100 },
        { label: 'Over $100', min: 100, max: null },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <FaFilter className="text-gray-600" />
                    <span>Filters</span>
                </h3>
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                    <FaTimes />
                    <span>Clear All</span>
                </button>
            </div>

            <div className="mb-6">
                <h4 className="font-semibold mb-3">Categories</h4>
                <div className="space-y-2">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <label key={category} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.categories?.includes(category) || false}
                                    onChange={(event) => onFilterChange('categories', category, event.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm">{category}</span>
                            </label>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">No categories available.</p>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-semibold mb-3">Price Range</h4>
                <div className="space-y-2">
                    {priceRanges.map((range) => (
                        <label key={range.label} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="radio"
                                name="priceRange"
                                checked={filters.priceRange?.min === range.min && filters.priceRange?.max === range.max}
                                onChange={() => onFilterChange('priceRange', range)}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductFilter;
