import { Link } from "react-router";
import { useState, useEffect } from "react";

const BlockProducts = ({ data, title = '' }) => {
    const [products, setProducts] = useState([]);


    useEffect(() => {
        setProducts(data?.data);
    }, [data])
    console.log("products", products);

    return (
        products?.length > 0 && <section className="bg-white p-4">
            <h1 className="text-xl font-bold mb-4">{title || products?.length > 0 && products[0]?.category_name}</h1>
            <div className="grid grid-cols-2 gap-3">
                {products?.map((product) => (
                    <ProductCard key={product?.id} img={product?.image} name={product?.name} />
                ))}
            </div>
            <Link to="deals" className="text-xs text-blue-700 hover:text-orange-700 hover:underline cursor-pointer">Expore more</Link>
        </section>
    );
};

export default BlockProducts;

const ProductCard = ({ img, name }) => <div className="">
    <img className="w-30 h-30 object-contain bg-gray-50" src={img} alt={name} />
    <h3>{name}</h3>
</div>