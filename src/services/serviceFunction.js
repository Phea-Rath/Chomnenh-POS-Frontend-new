import api from "./api";

function currencyFormat(num) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";

  return Number(num)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


const totalSum = (data, key) => {
  return data?.reduce((init, curr) => init + parseFloat(curr[key]), 0);
};
const totalPirceQuanDiscount = (data, keyOne, keyTwo) => {
  return parseFloat(data?.reduce((init, curr) => init + (parseFloat(curr[keyOne] || 0) * parseFloat(curr[keyTwo] || 0)) - ((parseFloat(curr[keyOne] || 0) * parseFloat(curr.quantity)) * (parseFloat(curr.discount) / 100)), 0).toFixed(2));
};

const convertToBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};


const convertImageToBase64 = async (image) => {
  const filename = image.split('/').pop();
  const res = await api.get(`/image-base64/${filename}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  // console.log(res?.data);
  return res?.data;
}
export { currencyFormat, totalSum, convertToBase64, totalPirceQuanDiscount, convertImageToBase64 };