// components/ProductGrid.jsx
import React from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ products, onProductClick }) => {
    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found.</p>
                <p className="text-gray-400">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                />
            ))}
        </div>
    );
};

export default ProductGrid;