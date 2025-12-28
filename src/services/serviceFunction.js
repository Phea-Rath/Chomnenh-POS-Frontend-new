function currencyFormat(num) {
  return parseFloat(num)?.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

const totalSum = (data, key) => {
  return data?.reduce((init, curr) => init + parseFloat(curr[key]), 0);
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
export { currencyFormat, totalSum, convertToBase64 };