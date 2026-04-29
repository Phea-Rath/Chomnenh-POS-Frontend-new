// components/ProductCard.jsx
import React from 'react';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';

const ProductCard = ({ product, onProductClick }) => {
    const displayPrice = product.price_discount ?? product.price;
    const originalPrice = product.discount ? product.price_discount : null;
    const stockCount = product.stock?.in_stock ?? 0;
    const soldCount = product.stock?.sold ?? 0;
    const sizeAttribute = product.attributes?.find(attribute => attribute.name === 'size');
    const colorAttribute = product.attributes?.find(attribute => attribute.name === 'colors');
    const productColors = Array.isArray(colorAttribute?.value) ? colorAttribute.value : [];

    const handleProductClick = () => onProductClick?.(product);

    const handleAddToCart = (e) => {
        e.stopPropagation();
        const currentCart = JSON.parse(localStorage.getItem('productOrder') || '[]');
        const existingProductIndex = currentCart.findIndex(item => item.id === product.id);

        if (existingProductIndex > -1) {
            currentCart[existingProductIndex].quantity += 1;
        } else {
            currentCart.push({
                ...product,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem('productOrder', JSON.stringify(currentCart));
        window.dispatchEvent(new Event('cartUpdated'));
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
            <div
                className="relative overflow-hidden cursor-pointer"
                onClick={handleProductClick}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full sm:h-48 h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2">
                    <button
                        type="button"
                        className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                        <FaHeart className="text-gray-400 hover:text-red-500" />
                    </button>
                </div>
                {product.discount ? (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        -{product.discount}%
                    </div>
                ) : null}
            </div>

            <div className="p-4">
                <h3
                    className="font-semibold sm:text-lg text-sm mb-2 cursor-pointer hover:text-blue-600 line-clamp-2"
                    onClick={handleProductClick}
                >
                    {product.name}
                    <div className="text-xs text-gray-500">{product.code}</div>
                </h3>

                <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                    {product.description || `${product.brand_name || 'Unknown brand'} - ${product.category_name || 'Uncategorized'}`}
                </p>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-3">
                    <span>{product.scale_name || 'Unit not set'}</span>
                    <span>{sizeAttribute?.value || '--:--'}</span>
                </div>

                {productColors.length > 0 ? (
                    <div className="flex items-center gap-2 mb-3">
                        {productColors.map((color) => (
                            <span
                                key={color.id}
                                className="h-4 w-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.value }}
                                title={color.value}
                            />
                        ))}
                    </div>
                ) : null}


                <hr className='text-gray-300 my-1' />
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">
                            ${displayPrice}
                        </span>
                        {originalPrice ? (
                            <span className="text-sm text-gray-500 line-through">
                                ${originalPrice}
                            </span>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="bg-slate-600 text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <FaShoppingCart />
                    </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{soldCount} sold</span>
                    <span className={`flex items-center space-x-1 ${stockCount > 10 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>*</span>
                        <span>{stockCount > 10 ? 'In Stock' : `Only ${stockCount} left`}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
