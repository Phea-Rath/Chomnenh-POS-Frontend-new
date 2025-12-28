// components/Header.jsx
import React from 'react';
import { FaShoppingCart, FaUser, FaHeart, FaSearch, FaArrowLeft } from 'react-icons/fa';

const Header = ({ onBack }) => {
    return (
        <header className="">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center space-x-4">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaArrowLeft className="text-gray-600" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-blue-600">MarketPlace</h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search for products..."
                                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-6">
                        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FaHeart className="text-gray-600 text-xl" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                3
                            </span>
                        </button>

                        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FaShoppingCart className="text-gray-600 text-xl" />
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                2
                            </span>
                        </button>

                        <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FaUser className="text-gray-600" />
                            <span className="hidden md:block">Account</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;