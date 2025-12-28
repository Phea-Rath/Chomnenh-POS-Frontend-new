const SelectField = () => {
  const data = {
    img: "https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/99486859-0ff3-46b4-949b-2d16af2ad421/custom-nike-dunk-high-by-you-shoes.png",
    name: "Jorden",
    price: 79.99,
    brand: "Nike",
  };
  const { img, name, price, brand } = data;
  return (
    <div className="relative flex w-full gap-2 text-xs bg-white p-1 justify-between">
      <img className="w-10" src={img} alt={name} />
      <div>
        <h1 className="text-sm">{name}</h1>
        <p>{brand}</p>
      </div>
      <p className="flex-1 text-end">${price}</p>
    </div>
  );
};

export default SelectField;
