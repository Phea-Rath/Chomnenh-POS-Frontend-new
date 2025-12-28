import { PiTruck } from "react-icons/pi";

export default function HomePage() {
  return (
    <section className="">
      <article className="bg-gray-100 dark:bg-gray-800 flex items-center justify-between p-5 rounded-lg">
        <div className="flex flex-col gap-3 pl-10">
          <h1 className="text-3xl font-bold">Interesting Title</h1>
          <p className="text-gray-500 text-xs">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quam,
            similique.
          </p>
          <div>
            <button className="btn btn-primary">Shop Now</button>
          </div>
        </div>
        <div className=" object-fill">
          <img
            src="https://png.pngtree.com/png-vector/20241213/ourmid/pngtree-young-woman-with-shopping-bags-for-retail-and-fashion-promotions-png-image_14736919.png"
            alt=""
          />
        </div>
      </article>
      <article className="py-10 flex justify-between">
        <div className="flex items-center text-xs gap-3">
          <PiTruck className="text-3xl" />
          <div>
            <h1 className="font-bold">Delivery</h1>
            <p className="text-gray-500">Free,Fast, and reliable worldwide</p>
          </div>
        </div>
        <div className="flex items-center text-xs gap-3">
          <PiTruck className="text-3xl" />
          <div>
            <h1 className="font-bold">Delivery</h1>
            <p className="text-gray-500">Free,Fast, and reliable worldwide</p>
          </div>
        </div>
        <div className="flex items-center text-xs gap-3">
          <PiTruck className="text-3xl" />
          <div>
            <h1 className="font-bold">Delivery</h1>
            <p className="text-gray-500">Free,Fast, and reliable worldwide</p>
          </div>
        </div>
        <div className="flex items-center text-xs gap-3">
          <PiTruck className="text-3xl" />
          <div>
            <h1 className="font-bold">Delivery</h1>
            <p className="text-gray-500">Free,Fast, and reliable worldwide</p>
          </div>
        </div>
      </article>
    </section>
  );
}
