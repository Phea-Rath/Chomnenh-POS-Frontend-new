// App.js
import React, { useState } from 'react';
import ProductListing from './pages/ProductListing';
import ProductDetail from './pages/ProductDetail';
import Footer from './Footer';
import Header from './Header';
import HeaderPanel from './HeaderPanel';
import NavBar from './NavBar';
import HomePage from './Home';

function Main() {
    const [currentPage, setCurrentPage] = useState('listing');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [scroll, setScroll] = useState(0);

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setCurrentPage('detail');
    };

    const handleBackToListing = () => {
        setCurrentPage('listing');
        setSelectedProduct(null);
    };

    const onScroll = (e) => {
        setScroll(e.target.scrollTop);

    }

    return (
        <div onScroll={onScroll} className="min-h-screen bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100 h-[100vh] overflow-auto">
            <div className={`bg-white shadow-lg w-full fixed ${scroll > 180 ? ' top-0' : ' -top-20'} -top-20 transition-all duration-500 z-50`}>
                <Header onBack={currentPage === 'detail' ? handleBackToListing : null} />
            </div>
            <section className="">
                <HeaderPanel />
                <NavBar />

            </section>
            <main className="container mx-auto px-4 py-8">
                {currentPage === 'listing' && (
                    <ProductListing onProductClick={handleProductClick} />
                )}
                {currentPage === 'detail' && selectedProduct && (
                    <ProductDetail product={selectedProduct} />
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Main;