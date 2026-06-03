const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "aba", label: "ABA" },
  { value: "aclida", label: "Aclida" },
  { value: "bakong", label: "Bakong" },
];

const PAYMENT_STATUS = [
  { value: "paid", label: "Paid" },
  { value: "credit", label: "Credit" },
  { value: "cod", label: "COD" },
  { value: "consignment", label: "Consignment" },
];

const TAX_OPTIONS = [
  { value: 10, label: "Tax Include" },
  { value: 0, label: "Tax Exclusive" },
];

const SHIPPING_METHODS = [
  { value: "dhl", label: "DHL" },
  { value: "fedex", label: "FedEx" },
  { value: "j&t", label: "J&T Express" },
  { value: "kerry", label: "Kerry Express" },
  { value: "local", label: "Local Delivery" },
];

export {PAYMENT_METHODS, PAYMENT_STATUS, TAX_OPTIONS, SHIPPING_METHODS}