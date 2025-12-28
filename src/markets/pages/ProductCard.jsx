// components/ProductCard.jsx
import React from 'react';
import { FaStar, FaHeart, FaShoppingCart } from 'react-icons/fa';

const ProductCard = ({ product, onProductClick }) => {
    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <FaStar
                key={index}
                className={`${index < rating ? 'text-yellow-400' : 'text-gray-300'
                    } text-sm`}
            />
        ));
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            {/* Product Image */}
            <div
                className="relative overflow-hidden cursor-pointer"
                onClick={() => onProductClick(product)}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors">
                        <FaHeart className="text-gray-400 hover:text-red-500" />
                    </button>
                </div>
                {product.discount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{product.discount}%
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-4">
                <h3
                    className="font-semibold text-lg mb-2 cursor-pointer hover:text-blue-600 line-clamp-2"
                    onClick={() => onProductClick(product)}
                >
                    {product.name}
                </h3>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.description}
                </p>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center space-x-1">
                        {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-gray-600">({product.reviews})</span>
                </div>

                {/* Price and Action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">
                            ${product.price}
                        </span>
                        {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                                ${product.originalPrice}
                            </span>
                        )}
                    </div>

                    <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <FaShoppingCart />
                    </button>
                </div>

                {/* Additional Info */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>🛒 {product.sold} sold</span>
                    <span className={`flex items-center space-x-1 ${product.stock > 10 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        ● {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;