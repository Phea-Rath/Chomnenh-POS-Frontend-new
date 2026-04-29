// pages/ProductDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    FaCheck,
    FaHeart,
    FaMinus,
    FaPlus,
    FaShare,
    FaShieldAlt,
    FaShoppingCart,
    FaTruck,
    FaUndo,
} from 'react-icons/fa';
import {
    useGetAllItemsForMarketPlaceQuery,
    useGetItemMarketPlaceByIdQuery,
} from '../../../app/Features/itemsSlice';

const ProductDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const {
        data: productResponse,
        isLoading: isProductLoading,
        isError: isProductError,
    } = useGetItemMarketPlaceByIdQuery(
        { id },
        { skip: !id }
    );

    const product = productResponse?.data ?? null;
    const productId = Number(product?.id ?? id ?? 0);
    const sellerProfileId = product?.profile_id ?? '';

    const {
        data: recommendedResponse,
        isLoading: isRecommendedLoading,
    } = useGetAllItemsForMarketPlaceQuery(
        {
            limit: 12,
            page: 1,
            search: '',
            category_id: '',
            brand_id: '',
            profile_id: sellerProfileId,
            price_range: '',
        },
        { skip: !sellerProfileId }
    );


    const galleryImages = useMemo(() => {
        if (Array.isArray(product?.images) && product.images.length > 0) {
            return product.images.map(image => image?.image).filter(Boolean);
        }

        return product?.image ? [product.image] : [];
    }, [product]);

    const sizeAttribute = useMemo(
        () => product?.attributes?.find(attribute => attribute.name === 'size'),
        [product]
    );

    const colorAttribute = useMemo(
        () => product?.attributes?.find(attribute => attribute.name === 'colors'),
        [product]
    );

    const colorOptions = Array.isArray(colorAttribute?.value) ? colorAttribute.value : [];

    const stockSummary = {
        inStock: product?.stock?.in_stock ?? product?.in_stock ?? 0,
        stockIn: product?.stock?.stock_in ?? product?.stock_in ?? 0,
        stockOut: product?.stock?.stock_out ?? product?.stock_out ?? 0,
        stockReturn: product?.stock?.stock_return ?? product?.stock_return ?? 0,
        stockWasted: product?.stock?.stock_wasted ?? product?.stock_wasted ?? 0,
        sold: product?.stock?.sold ?? product?.sold ?? 0,
    };

    const activePrice = product?.price_discount ?? product?.price ?? 0;
    const originalPrice = product?.price_discount ? product.price : null;

    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(null);
    const [activeTab, setActiveTab] = useState('description');

    useEffect(() => {
        setSelectedImage(0);
        setQuantity(1);
        setSelectedColor(colorOptions[0]?.value ?? null);
    }, [id, colorOptions]);

    const recommendationProducts = useMemo(() => {
        const items = recommendedResponse?.data ?? [];

        return items.filter((item, index) =>
            Number(item.id) !== productId &&
            item.profile_id === sellerProfileId &&
            index < 9
        );
    }, [productId, recommendedResponse, sellerProfileId]);

    const specificationRows = [
        { label: 'Barcode', value: product?.barcode || 'N/A' },
        { label: 'Code', value: product?.code || 'N/A' },
        { label: 'Category', value: product?.category_name || 'N/A' },
        { label: 'Brand', value: product?.brand_name || 'N/A' },
        { label: 'Scale', value: product?.scale_name || 'N/A' },
        { label: 'Size', value: sizeAttribute?.value || 'N/A' },
        { label: 'Profile ID', value: product?.profile_id || 'N/A' },
        { label: 'Created At', value: product?.created_at || 'N/A' },
        { label: 'Updated At', value: product?.updated_at || 'N/A' },
    ];

    const additionalAttributes = (product?.attributes || []).filter(
        attribute => attribute.name !== 'size' && attribute.name !== 'colors'
    );

    const handleQuantityChange = (change) => {
        setQuantity(prev => Math.max(1, prev + change));
    };

    const handleOpenRecommendation = (productId) => {
        navigate(`/market/product_detail/${productId}`);
    };

    const addToCart = () => {
        if (!product) return;

        const currentCart = JSON.parse(localStorage.getItem('productOrder') || '[]');
        const existingProductIndex = currentCart.findIndex(item =>
            item.id === product.id && item.selectedColor === selectedColor
        );

        if (existingProductIndex > -1) {
            currentCart[existingProductIndex].quantity += quantity;
        } else {
            currentCart.push({
                ...product,
                quantity: quantity,
                selectedColor: selectedColor,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem('productOrder', JSON.stringify(currentCart));
        window.dispatchEvent(new Event('cartUpdated'));
        navigate('/market/shopping-cart');
    };

    const buyNow = () => {
        if (!product) return;
        addToCart();
        // Here you would typically navigate to a checkout page
        // navigate('/checkout');
    };

    if (isProductLoading) {
        return <div className="max-w-7xl mx-auto py-12 text-center text-gray-500">Loading product...</div>;
    }

    if (isProductError || !product) {
        return <div className="max-w-7xl mx-auto py-12 text-center text-red-500">Unable to load this product.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 mb-6 lg:mb-8">
                <span className="cursor-pointer hover:underline" onClick={() => navigate('/market')}>Home</span>
                <span>/</span>
                <span className="cursor-pointer hover:underline">{product.category_name || 'Products'}</span>
                <span>/</span>
                <span className="text-gray-900 line-clamp-1">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Images */}
                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <img
                            src={galleryImages[selectedImage] || product.image}
                            alt={product.name}
                            className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-contain p-4"
                        />
                    </div>

                    {galleryImages.length > 1 ? (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {galleryImages.map((image, index) => (
                                <button
                                    key={`${image}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedImage(index)}
                                    className={`flex-shrink-0 w-20 h-20 border-2 rounded-md overflow-hidden transition-all ${selectedImage === index ? 'border-[#e77600]' : 'border-gray-200 hover:border-gray-400'}`}
                                >
                                    <img
                                        src={image}
                                        alt={`${product.name} view ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {product.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-sm">
                            <span className={`${stockSummary.inStock > 10 ? 'text-green-700' : 'text-red-700'} font-bold`}>
                                {stockSummary.inStock > 10 ? 'In Stock' : `Only ${stockSummary.inStock} left`}
                            </span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-600 font-medium">{stockSummary.sold} sold</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-blue-700 hover:text-orange-700 cursor-pointer font-medium">{product.brand_name || 'Generic'}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-100">
                        <span className="text-3xl font-bold text-gray-900">
                            ${activePrice}
                        </span>
                        {originalPrice ? (
                            <span className="text-xl text-gray-400 line-through">
                                ${originalPrice}
                            </span>
                        ) : null}
                        {product.discount ? (
                            <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-sm font-bold border border-red-100">
                                Save {product.discount}%
                            </span>
                        ) : null}
                    </div>

                    <p className="text-gray-700 text-base leading-relaxed">
                        {product.description || `${product.name} is available in the marketplace with live stock and pricing information.`}
                    </p>

                    {/* Attributes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-lg bg-gray-50 p-4 border border-gray-100">
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Code</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.code || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Barcode</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.barcode || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Category</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.category_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Scale</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{product.scale_name || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Color & Size Selection */}
                    <div className="space-y-4">
                        {colorOptions.length > 0 ? (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">
                                    Color: <span className="font-medium text-gray-600">{selectedColor}</span>
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.id}
                                            type="button"
                                            onClick={() => setSelectedColor(color.value)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color.value ? 'border-[#e77600] scale-110 shadow-md' : 'border-white hover:border-gray-200'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.value}
                                        >
                                            {selectedColor === color.value ? <FaCheck className={`${color.value.toLowerCase() === '#ffffff' ? 'text-black' : 'text-white'} text-sm m-auto`} /> : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {sizeAttribute ? (
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">Size</h3>
                                <div className="inline-flex rounded border border-[#e77600] bg-orange-50 px-4 py-2 text-sm font-bold text-[#e77600]">
                                    {sizeAttribute.value}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                        <div className="flex items-center justify-between sm:justify-start bg-gray-100 rounded-md border border-gray-200">
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(-1)}
                                className="p-3 hover:bg-gray-200 transition-colors"
                            >
                                <FaMinus className="text-gray-600 text-xs" />
                            </button>
                            <span className="px-6 py-2 text-lg font-bold min-w-[3rem] text-center">
                                {quantity}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleQuantityChange(1)}
                                className="p-3 hover:bg-gray-200 transition-colors"
                            >
                                <FaPlus className="text-gray-600 text-xs" />
                            </button>
                        </div>

                        <div className="flex gap-2 flex-1">
                            <button
                                type="button"
                                onClick={addToCart}
                                className="flex-1 bg-[#ffd814] hover:bg-[#f7ca00] text-black py-3 px-4 rounded-md font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 border border-[#fcd200]"
                            >
                                <FaShoppingCart />
                                <span>Add to Cart</span>
                            </button>
                            <button
                                type="button"
                                onClick={buyNow}
                                className="flex-1 bg-[#ffa41c] hover:bg-[#fa8914] text-black py-3 px-4 rounded-md font-bold text-sm shadow-sm transition-colors border border-[#ee9a1c]"
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                        <button type="button" className="flex items-center gap-2 text-sm text-blue-700 hover:text-orange-700 font-medium">
                            <FaHeart className="text-gray-400" />
                            <span>Add to List</span>
                        </button>
                        <button type="button" className="flex items-center gap-2 text-sm text-blue-700 hover:text-orange-700 font-medium">
                            <FaShare className="text-gray-400" />
                            <span>Share</span>
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-t border-gray-100">
                        <div className="flex items-start gap-3">
                            <FaTruck className="text-gray-500 text-xl mt-1" />
                            <div>
                                <p className="text-xs font-bold text-gray-900">FREE delivery</p>
                                <p className="text-[11px] text-gray-600">Ships from e-market</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FaUndo className="text-gray-500 text-xl mt-1" />
                            <div>
                                <p className="text-xs font-bold text-gray-900">Easy Returns</p>
                                <p className="text-[11px] text-gray-600">30-day return policy</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <FaShieldAlt className="text-gray-500 text-xl mt-1" />
                            <div>
                                <p className="text-xs font-bold text-gray-900">Secure transaction</p>
                                <p className="text-[11px] text-gray-600">SSL encrypted payment</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-12 lg:mt-16">
                <div className="border-b border-gray-200 overflow-x-auto no-scrollbar">
                    <nav className="flex whitespace-nowrap">
                        {['description', 'specifications', 'stock', 'shipping'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-6 border-b-2 font-bold text-sm capitalize transition-all ${activeTab === tab ? 'border-[#e77600] text-[#e77600]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="py-8 bg-white px-6 rounded-b-lg border-x border-b border-gray-100 shadow-sm">

                    <div className="flex space-x-4">
                        <button type="button" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2">
                            <FaHeart />
                            <span>Add to Wishlist</span>
                        </button>
                        <button type="button" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 p-2">
                            <FaShare />
                            <span>Share</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                            <FaTruck className="text-green-600 text-xl" />
                            <div>
                                <p className="font-semibold">Marketplace Delivery</p>
                                <p className="text-sm text-gray-600">Shipping options depend on seller</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaUndo className="text-blue-600 text-xl" />
                            <div>
                                <p className="font-semibold">Return Support</p>
                                <p className="text-sm text-gray-600">Check seller return conditions</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <FaShieldAlt className="text-purple-600 text-xl" />
                            <div>
                                <p className="font-semibold">Verified Listing</p>
                                <p className="text-sm text-gray-600">Live inventory from your backend</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {['description', 'specifications', 'stock', 'shipping'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="py-8">
                    {activeTab === 'description' ? (
                        <div className="prose max-w-none">
                            <h3>Product Description</h3>
                            <p>{product.description || 'No description has been provided for this product yet.'}</p>
                            <ul>
                                <li>Brand: {product.brand_name || 'N/A'}</li>
                                <li>Category: {product.category_name || 'N/A'}</li>
                                <li>Scale: {product.scale_name || 'N/A'}</li>
                                <li>Discount: {product.discount ? `${product.discount}%` : 'No discount'}</li>
                            </ul>
                        </div>
                    ) : null}

                    {activeTab === 'specifications' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-semibold mb-4">Product Information</h4>
                                <dl className="space-y-3">
                                    {specificationRows.map((row) => (
                                        <div key={row.label} className="flex justify-between border-b pb-2 gap-4">
                                            <dt className="text-gray-600">{row.label}</dt>
                                            <dd className="font-semibold text-right">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4">Attributes</h4>
                                <ul className="space-y-2">
                                    {(product.attributes || []).map((attribute) => (
                                        <li key={attribute.id} className="flex items-start space-x-2">
                                            <FaCheck className="text-green-500 mt-1" />
                                            <span>
                                                <span className="font-semibold">{attribute.name}:</span>{' '}
                                                {Array.isArray(attribute.value)
                                                    ? attribute.value.map(value => value.value || value).join(', ')
                                                    : attribute.value}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'stock' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">In Stock</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.inStock}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">Stock In</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.stockIn}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">Stock Out</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.stockOut}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">Returned</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.stockReturn}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">Wasted</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.stockWasted}</p>
                            </div>
                            <div className="rounded-lg border border-gray-200 p-4">
                                <p className="text-sm text-gray-500">Sold</p>
                                <p className="text-2xl font-bold text-gray-900">{stockSummary.sold}</p>
                            </div>
                        </div>
                    ) : null}

                    {activeTab === 'shipping' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-900 mb-2">Shipping Information</h4>
                                <ul className="text-blue-800 space-y-2">
                                    <li>Seller-specific delivery options apply at checkout.</li>
                                    <li>Large orders may require separate shipping confirmation.</li>
                                    <li>Delivery timing depends on stock availability and destination.</li>
                                    <li>Contact the seller for urgent or bulk orders.</li>
                                </ul>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Return Policy</h4>
                                <ul className="text-green-800 space-y-2">
                                    <li>Returns depend on seller approval and product condition.</li>
                                    <li>Damaged or incorrect items should be reported promptly.</li>
                                    <li>Keep packaging and proof of purchase for support requests.</li>
                                    <li>Refund timing depends on the seller and payment method.</li>
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {product.profile_id ? (
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Recommended From This Seller</h2>
                    </div>

                    {isRecommendedLoading ? (
                        <div className="py-8 text-center text-gray-500">Loading recommendations...</div>
                    ) : recommendationProducts.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No other products available from this seller.</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendationProducts.map((item) => {
                                const recommendationPrice = item.price_discount ?? item.price ?? 0;
                                const recommendationStock = item.stock?.in_stock ?? item.in_stock ?? 0;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleOpenRecommendation(item.id)}
                                        className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-left"
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full sm:h-40 h-20 object-cover rounded mb-4"
                                        />
                                        <p className="text-xs text-gray-500 mb-1">{item.category_name || 'Uncategorized'}</p>
                                        <h3 className="font-semibold mb-2 line-clamp-2">{item.name}</h3>
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="text-lg font-bold text-gray-900">${recommendationPrice}</span>
                                            <span className={`text-xs ${recommendationStock > 10 ? 'text-green-600' : 'text-red-600'}`}>
                                                {recommendationStock > 10 ? 'In Stock' : `${recommendationStock} left`}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default ProductDetail;
