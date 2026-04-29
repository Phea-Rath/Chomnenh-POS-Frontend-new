import React, { useState, useEffect } from 'react';
import { BiCheck } from 'react-icons/bi';
import { FaTrash, FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router';

const ShoppingCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadCart();
        window.addEventListener('cartUpdated', loadCart);
        return () => window.removeEventListener('cartUpdated', loadCart);
    }, []);

    const loadCart = () => {
        const items = JSON.parse(localStorage.getItem('productOrder') || '[]');
        setCartItems(items);
    };

    const updateLocalStorage = (newItems) => {
        localStorage.setItem('productOrder', JSON.stringify(newItems));
        setCartItems(newItems);
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const handleQuantityChange = (id, selectedColor, change) => {
        const newItems = cartItems.map(item => {
            if (item.id === id && item.selectedColor === selectedColor) {
                const newQty = Math.max(1, item.quantity + change);
                return { ...item, quantity: newQty };
            }
            return item;
        });
        updateLocalStorage(newItems);
    };

    const removeItem = (id, selectedColor) => {
        const newItems = cartItems.filter(item => !(item.id === id && item.selectedColor === selectedColor));
        updateLocalStorage(newItems);
    };

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            updateLocalStorage([]);
        }
    };

    const subtotal = cartItems.reduce((acc, item) => {
        const price = item.price_discount ?? item.price ?? 0;
        return acc + (price * item.quantity);
    }, 0);

    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen py-12 px-4">
                <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm rounded-sm text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-6 rounded-full">
                            <FaShoppingCart className="text-6xl text-gray-300" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-4">Your e-market Cart is empty</h1>
                    <p className="text-gray-600 mb-8">Check your Saved for later items or continue shopping.</p>
                    <button
                        onClick={() => navigate('/market')}
                        className="bg-[#febd69] hover:bg-[#f3a847] px-8 py-2 rounded-md font-bold shadow-sm transition-colors"
                    >
                        Shop Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 -mt-8 -mx-4">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Cart Items List */}
                <div className="flex-1 bg-white p-6 shadow-sm rounded-sm">
                    <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-4">
                        <h1 className="text-2xl font-bold">Shopping Cart</h1>
                        <button
                            onClick={clearCart}
                            className="text-sm text-blue-700 hover:text-orange-700 hover:underline"
                        >
                            Deselect all items
                        </button>
                    </div>

                    <div className="space-y-6">
                        {cartItems.map((item, index) => {
                            const price = item.price_discount ?? item.price ?? 0;
                            return (
                                <div key={`${item.id}-${index}`} className="flex flex-col sm:flex-row gap-6 border-b border-gray-100 pb-6 last:border-0">
                                    {/* Product Image */}
                                    <div className="w-48 h-48 flex-shrink-0 bg-gray-50 flex items-center justify-center cursor-pointer" onClick={() => navigate(`/market/product_detail/${item.id}`)}>
                                        <img src={item.image} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between gap-4">
                                            <h3
                                                className="text-lg font-bold text-gray-900 hover:text-blue-700 cursor-pointer line-clamp-2"
                                                onClick={() => navigate(`/market/product_detail/${item.id}`)}
                                            >
                                                {item.name}
                                            </h3>
                                            <p className="text-lg font-bold">${(price * item.quantity).toFixed(2)}</p>
                                        </div>

                                        <p className="text-xs text-green-600 font-bold mt-1">In Stock</p>
                                        <p className="text-xs text-gray-500 mt-1">Eligible for FREE Shipping</p>

                                        {item.selectedColor && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700">Color:</span>
                                                <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: item.selectedColor }} />
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="mt-4 flex flex-wrap items-center gap-4">
                                            <div className="flex items-center bg-[#f0f2f2] border border-[#d5d9d9] rounded-lg shadow-sm">
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.selectedColor, -1)}
                                                    className="p-1.5 hover:bg-[#e3e6e6] transition-colors"
                                                >
                                                    <FaMinus className="text-[10px]" />
                                                </button>
                                                <span className="px-3 py-1 text-sm font-medium border-x border-[#d5d9d9]">
                                                    Qty: {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleQuantityChange(item.id, item.selectedColor, 1)}
                                                    className="p-1.5 hover:bg-[#e3e6e6] transition-colors"
                                                >
                                                    <FaPlus className="text-[10px]" />
                                                </button>
                                            </div>

                                            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block" />

                                            <button
                                                onClick={() => removeItem(item.id, item.selectedColor)}
                                                className="text-xs text-blue-700 hover:text-orange-700 hover:underline"
                                            >
                                                Delete
                                            </button>

                                            <div className="h-4 w-[1px] bg-gray-300 hidden sm:block" />

                                            <button className="text-xs text-blue-700 hover:text-orange-700 hover:underline">
                                                Save for later
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 text-right">
                        <p className="text-lg">
                            Subtotal ({totalItems} items): <span className="font-bold font-lg">${subtotal.toFixed(2)}</span>
                        </p>
                    </div>
                </div>

                {/* Checkout Sidebar */}
                <div className="w-full lg:w-72 space-y-4">
                    <div className="bg-white p-5 shadow-sm rounded-sm">
                        <div className="flex items-start gap-2 mb-4">
                            <div className="bg-green-600 rounded-full p-1 mt-0.5">
                                <FaPlus className="text-[8px] text-white rotate-45" />
                            </div>
                            <p className="text-xs text-green-700">
                                Your order qualifies for <span className="font-bold">FREE Shipping</span>. Choose this option at checkout.
                            </p>
                        </div>

                        <p className="text-lg mb-4">
                            Subtotal ({totalItems} items): <span className="font-bold font-lg">${subtotal.toFixed(2)}</span>
                        </p>
                        <form action="" className="flex flex-col gap-4">
                            <label htmlFor="" className="text-xs text-gray-500">Telephone</label>
                            <input type="text" name='telephone' placeholder='eg. 0123456789' className="bg-gray-100 rounded-md text-sm p-2" />
                            <label htmlFor="" className="text-xs text-gray-500">Address</label>
                            <textarea name="address" id="" placeholder='eg. village, district, commnue, province' className="bg-gray-100 rounded-md p-2 text-sm"></textarea>
                            <div className="flex items-center gap-2 mb-6">
                                <input type="checkbox" id="gift" className="rounded-sm" />
                                <label htmlFor="gift" className="text-sm text-gray-700">If you are really ready, please check the box.</label>
                            </div>

                            <button className="w-full bg-[#ffd814] hover:bg-[#f7ca00] py-2 rounded-lg text-sm font-medium shadow-sm transition-colors border border-[#fcd200]">
                                Proceed to Checkout
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-5 shadow-sm rounded-sm">
                        <h2 className="font-bold text-sm mb-4">Recently Viewed</h2>
                        {/* Placeholder for recently viewed */}
                        <div className="flex justify-center py-4">
                            <p className="text-xs text-gray-500 italic">No items recently viewed</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingCart;
