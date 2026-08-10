import { PiArrowRight } from "react-icons/pi";
import { useGetAllProfileQuery } from "@/features/auth/userProfileSlice";
import { useEffect, useReducer, useState } from "react";
import { useGetAllItemsForMarketPlaceQuery } from "@/features/products/itemsSlice";
import BlockProducts from "./components/BlockProducts";
import { Link } from "react-router";
import CommingSoon from "./components/CommingSoon";

export default function HomePage() {
  const { data: products } = useGetAllItemsForMarketPlaceQuery({ limit: 4, page: 1, category_id: 3 });
  const { data: products2 } = useGetAllItemsForMarketPlaceQuery({ limit: 4, page: 1, category_id: 4 });
  const { data: products3 } = useGetAllItemsForMarketPlaceQuery({ limit: 4, page: 1, category_id: 5 });
  const { data: products4 } = useGetAllItemsForMarketPlaceQuery({ limit: 4, page: 1, category_id: 7 });
  const { data: producutsDis } = useGetAllItemsForMarketPlaceQuery({ limit: 4, page: 1, is_discounted: true });
  const { data } = useGetAllProfileQuery();
  const [companies, setCompanies] = useState([]);


  useEffect(() => {
    setCompanies(data?.data);
  }, [data]);

  return (
    <section className="min-h-screen text-gray-800 container mx-auto -mt-8">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#eaeded] z-10" />
        <img
          src="https://m.media-amazon.com/images/I/61Z5DaOEVeL._SX3000_.jpg"
          alt="Banner"
          className="w-full h-full object-cover hidden sm:block"
        />
        <img
          src="https://m.media-amazon.com/images/I/61Yx5-N155L._SX3000_.jpg"
          alt="Banner"
          className="w-full h-full object-cover sm:hidden block"
        />
        <div className="absolute top-20 left-10 z-20 hidden md:block max-w-md bg-white p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Welcome to e-market</h1>
          <p className="text-sm text-gray-700 mb-4">
            Discover amazing deals on thousands of products. From electronics to fashion, we have everything you need.
          </p>
          <button className="bg-[#febd69] hover:bg-[#f3a847] px-6 py-2 rounded font-bold text-sm">
            Shop All Deals
          </button>
        </div>
      </div>

      {/* Content Section */}
      <article className=" px-4 -mt-40 relative z-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Featured Categories / Companies */}
          <div className="bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Top Companies</h2>
            <div className="grid grid-cols-2 gap-4">
              {companies?.slice(0, 4).map((company, index) => (
                <div key={index} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className="w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform" src={company?.image} alt={company.profile_name} />
                  </div>
                  <span className="text-xs font-bold text-center group-hover:text-blue-700">{company.profile_name}</span>
                </div>
              ))}
            </div>
            <Link to="companies">
              <p className="mt-4 text-sm text-blue-700 hover:text-orange-700 hover:underline cursor-pointer">See more</p>
            </Link>
          </div>

          <BlockProducts data={producutsDis} title="Deals & Promotions" />

          <div className="bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold mb-4">New Arrivals</h2>
            <div className="w-full aspect-square bg-gray-100 mb-4">
              <CommingSoon />
            </div>
            <p className="text-sm text-blue-700 hover:text-orange-700 hover:underline cursor-pointer">Explore more</p>
          </div>

          <div className="bg-white p-5 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold mb-4">Sign in for best experience</h2>
            <button className="bg-[#febd69] hover:bg-[#f3a847] w-full py-2 rounded text-sm font-bold shadow-sm mb-4">
              Sign in securely
            </button>
            <div className="mt-auto bg-gray-100 p-4 rounded">
              <p className="text-xs font-bold">Try Prime for free</p>
              <p className="text-xs text-gray-600">Fast, free delivery on millions of items</p>
            </div>
          </div>
        </div>

        {/* Product List Placeholder Area */}
        <div className="mt-8 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recommended for you</h2>
            <Link to="companies"><span className="text-xs text-blue-700 hover:text-orange-700 cursor-pointer">View all</span></Link>
          </div>
          <div className="flex justify-between gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {companies?.map((company, index) => (
              <div key={index} className="flex-shrink-0 w-15 group cursor-pointer">
                <div className="w-full aspect-square bg-gray-50 mb-2 p-4 rounded-full overflow-hidden">
                  <img className="w-full h-full object-contain mix-blend-multiply" src={company?.image} alt="" />
                </div>
                <h3 className="text-xs font-medium line-clamp-2 text-center group-hover:text-blue-700">{company.profile_name}</h3>
                {/* <p className="text-xs text-gray-500 mt-1">{company.address}</p> */}
              </div>
            ))}
          </div>
        </div>
      </article>
      <article className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5  px-4">
        <BlockProducts data={products} />
        <BlockProducts data={products2} />
        <BlockProducts data={products3} />
        <BlockProducts data={products4} />
      </article>
    </section>
  );
}
