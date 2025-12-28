// pages/ProductDetail.jsx
import React, { useState } from 'react';
import {
    FaStar,
    FaHeart,
    FaShoppingCart,
    FaShare,
    FaTruck,
    FaShieldAlt,
    FaUndo,
    FaCheck,
    FaMinus,
    FaPlus
} from 'react-icons/fa';

const ProductDetail = ({ product }) => {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);
    const [activeTab, setActiveTab] = useState('description');

    // Mock product images and variations
    // const productImages = [
    //     product.image,
    //     "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    //     "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600",
    //     "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600"
    // ];

    // In ProductDetail.jsx, replace the mock data with:
    const productImages = product.images || [product.image];
    const productColors = product.colors || ['Black', 'White', 'Blue'];
    const productSizes = product.sizes || ['S', 'M', 'L', 'XL'];

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <FaStar
                key={index}
                className={`${index < rating ? 'text-yellow-400' : 'text-gray-300'
                    } text-lg`}
            />
        ));
    };

    const handleQuantityChange = (change) => {
        setQuantity(prev => Math.max(1, prev + change));
    };

    const addToCart = () => {
        alert(`Added ${quantity} ${product.name} to cart!`);
    };

    const buyNow = () => {
        alert(`Proceeding to checkout with ${quantity} ${product.name}`);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
                <span>Home</span>
                <span>/</span>
                <span>{product.category}</span>
                <span>/</span>
                <span className="text-gray-900">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Images */}
                <div className="space-y-4">
                    {/* Main Image */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <img
                            src={productImages[selectedImage]}
                            alt={product.name}
                            className="w-full h-96 object-cover"
                        />
                    </div>

                    {/* Thumbnail Images */}
                    <div className="grid grid-cols-4 gap-4">
                        {productImages.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`border-2 rounded-lg overflow-hidden ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`${product.name} view ${index + 1}`}
                                    className="w-full h-20 object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {product.name}
                        </h1>
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="flex items-center space-x-1">
                                {renderStars(product.rating)}
                                <span className="ml-2 text-sm text-gray-600">
                                    ({product.reviews} reviews)
                                </span>
                            </div>
                            <span className="text-green-600 text-sm font-semibold">
                                ● {product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`}
                            </span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-4">
                        <span className="text-3xl font-bold text-gray-900">
                            ${product.price}
                        </span>
                        {product.originalPrice && (
                            <span className="text-xl text-gray-500 line-through">
                                ${product.originalPrice}
                            </span>
                        )}
                        {product.discount && (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-semibold">
                                Save {product.discount}%
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-lg leading-relaxed">
                        {product.description}
                    </p>

                    {/* Color Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Color: <span className="font-normal">{selectedColor}</span>
                        </h3>
                        <div className="flex space-x-3">
                            {productColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-10 h-10 rounded-full border-2 ${selectedColor === color ? 'border-blue-500' : 'border-gray-300'
                                        } flex items-center justify-center`}
                                    style={{
                                        backgroundColor: color.toLowerCase(),
                                        borderColor: selectedColor === color ? '#3B82F6' : '#D1D5DB'
                                    }}
                                >
                                    {selectedColor === color && (
                                        <FaCheck className="text-white text-sm" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Size Selection */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            Size: <span className="font-normal">{selectedSize}</span>
                        </h3>
                        <div className="flex space-x-3">
                            {productSizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`p-3 rounded-lg border-2 flex items-center justify-center text-sm font-semibold ${selectedSize === size
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex items-center space-x-6">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                className="p-3 hover:bg-gray-100 transition-colors"
                            >
                                <FaMinus className="text-gray-600" />
                            </button>
                            <span className="px-6 py-3 text-lg font-semibold">
                                {quantity}
                            </span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="p-3 hover:bg-gray-100 transition-colors"
                            >
                                <FaPlus className="text-gray-600" />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 flex-1">
                            <button
                                onClick={addToCart}
                                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                            >
                                <FaShoppingCart />
                                <span>Add to Cart</span>
                            </button>
                            <button
                                onClick={buyNow}
                                className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex space-x-4">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2">
                            <FaHeart />
                            <span>Add to Wishlist</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2">
                            <FaShare />
                            <span>Share</span>
                        </button>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                            <FaTruck className="text-green-600 text-xl" />
                            <div>
                                <p className="font-semibold">Free Shipping</p>
                                <p className="text-sm text-gray-600">Orders over $50</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaUndo className="text-blue-600 text-xl" />
                            <div>
                                <p className="font-semibold">Easy Returns</p>
                                <p className="text-sm text-gray-600">30 days return policy</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaShieldAlt className="text-purple-600 text-xl" />
                            <div>
                                <p className="font-semibold">2-Year Warranty</p>
                                <p className="text-sm text-gray-600">Manufacturer warranty</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Tabs */}
            <div className="mt-16">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {['description', 'specifications', 'reviews', 'shipping'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="py-8">
                    {activeTab === 'description' && (
                        <div className="prose max-w-none">
                            <h3>Product Description</h3>
                            <p>
                                {product.description} This premium product is designed with the latest technology
                                and highest quality materials to ensure exceptional performance and durability.
                                Perfect for everyday use and professional applications alike.
                            </p>
                            <ul>
                                {product.features?.map((feature, index) => (
                                    <li key={index}>✓ {feature}</li>
                                ))}
                                <li>✓ Premium quality materials</li>
                                <li>✓ Eco-friendly packaging</li>
                                <li>✓ 24/7 customer support</li>
                            </ul>
                        </div>
                    )}

                    {activeTab === 'specifications' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-4">Technical Specifications</h4>
                                <dl className="space-y-3">
                                    <div className="flex justify-between border-b pb-2">
                                        <dt className="text-gray-600">Material</dt>
                                        <dd className="font-semibold">Premium Quality</dd>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <dt className="text-gray-600">Weight</dt>
                                        <dd className="font-semibold">450g</dd>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <dt className="text-gray-600">Dimensions</dt>
                                        <dd className="font-semibold">15 x 10 x 5 cm</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Features</h4>
                                <ul className="space-y-2">
                                    {product.features?.map((feature, index) => (
                                        <li key={index} className="flex items-center space-x-2">
                                            <FaCheck className="text-green-500" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600">{product.rating}</div>
                                    <div className="flex items-center space-x-1">
                                        {renderStars(product.rating)}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {product.reviews} reviews
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-600">
                                        Customers love this product for its quality and performance.
                                        Join {product.sold}+ satisfied customers who have made this their favorite choice.
                                    </p>
                                </div>
                            </div>

                            {/* Sample Reviews */}
                            <div className="space-y-4">
                                {[1, 2, 3].map((review) => (
                                    <div key={review} className="border-b pb-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="flex items-center space-x-1">
                                                {renderStars(5)}
                                            </div>
                                            <span className="font-semibold">John D.</span>
                                            <span className="text-gray-500 text-sm">2 days ago</span>
                                        </div>
                                        <p className="text-gray-600">
                                            Excellent product! The quality exceeded my expectations and it arrived faster than promised.
                                            Will definitely purchase again.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'shipping' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Shipping Information</h4>
                                <ul className="text-blue-800 space-y-2">
                                    <li>• Free standard shipping on orders over $50</li>
                                    <li>• Express shipping available for $9.99</li>
                                    <li>• International shipping to 50+ countries</li>
                                    <li>• Usually ships within 24 hours</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Return Policy</h4>
                                <ul className="text-green-800 space-y-2">
                                    <li>• 30-day money-back guarantee</li>
                                    <li>• Free returns for defective items</li>
                                    <li>• Easy online return process</li>
                                    <li>• Full refund upon return inspection</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Related Products Section */}
            <div className="mt-16">
                <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* This would typically map through related products */}
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                            <img
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300"
                                alt="Related product"
                                className="w-full h-40 object-cover rounded mb-4"
                            />
                            <h3 className="font-semibold mb-2">Related Product {item}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">$49.99</span>
                                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;