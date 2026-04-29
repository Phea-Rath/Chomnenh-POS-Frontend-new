// components/Header.jsx
import React, { useEffect, useState } from 'react';
import { FaShoppingCart, FaUser, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router';

const Header = () => {
    const navigate = useNavigate();
    function onBack() {
        navigate('/market');
    }
    function cart() {
        navigate('shopping-cart');
    }
    const [countCart, setCountCart] = useState(0);

    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('productOrder') || '[]');
        const total = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        setCountCart(total);
    };

    useEffect(() => {
        updateCartCount();
        window.addEventListener('cartUpdated', updateCartCount);
        return () => window.removeEventListener('cartUpdated', updateCartCount);
    }, []);
    return (
        <header className="bg-chomnenh-dark text-white shadow-md">
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center justify-between gap-2 md:gap-4">
                    {/* Left Section */}
                    <div onClick={onBack} className="flex items-center space-x-2 md:space-x-4 cursor-pointer">
                        <h1 className="text-lg md:text-xl font-bold whitespace-nowrap">
                            CHOMNENH<span className="text-[#febd69]">.<span className='text-xs'>STORE</span></span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl">
                        <div className="flex items-center h-8 md:h-9">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full h-full px-3 md:px-4 rounded-l-md border-none text-black bg-slate-100 focus:outline-none text-xs md:text-sm"
                            />
                            <button className="bg-[#febd69] hover:bg-[#f3a847] h-full px-3 md:px-4 rounded-r flex items-center justify-center">
                                <FaSearch className="text-black text-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center space-x-1 md:space-x-4">
                        <button className="flex items-center space-x-1 p-1 md:p-2 border border-transparent hover:border-white transition-colors">
                            <FaUser className="text-sm md:text-base" />
                            <span className="hidden lg:block text-xs md:text-sm font-bold">Account</span>
                        </button>

                        <button onClick={cart} className="flex items-center space-x-1 p-1 md:p-2 border border-transparent hover:border-white transition-colors relative">
                            <div className="relative">
                                <FaShoppingCart className="text-lg md:text-xl" />
                                <span className="absolute -top-1 -right-2 bg-[#131921] text-[#febd69] text-[10px] md:text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center border border-[#131921]">
                                    {countCart}
                                </span>
                            </div>
                            <span className="hidden lg:block text-xs md:text-sm font-bold ml-1">Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;