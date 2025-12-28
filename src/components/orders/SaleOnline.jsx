import React, { useEffect, useState } from "react";
import { AiTwotoneDelete } from "react-icons/ai";
import { LuListChecks } from "react-icons/lu";
import { Link, useNavigate } from "react-router";
import { useOutletsContext } from "../../layouts/Management";
import service from "../../services/api";
import AlertBox from "../../services/AlertBox";
import { TiShoppingCart } from "react-icons/ti";
import { GoHeartFill } from "react-icons/go";
import { GoHeart } from "react-icons/go";
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Empty,
  Image,
  message,
  Skeleton,
  Space,
  Typography,
} from "antd";
import { PiShoppingCartBold } from "react-icons/pi";
import { motion } from "framer-motion";
import { useGetAllSaleQuery } from "../../../app/Features/salesSlice";
import { useGetAllStockDetailQuery } from "../../../app/Features/stockDetailsSlice";
import { useGetAllCategoriesQuery } from "../../../app/Features/categoriesSlice";
import {
  useCreateOrderMutation,
  useGetAllOrderQuery,
  useGetMaxOrderIdQuery,
} from "../../../app/Features/ordersSlice";
import { useCreateStockMutation } from "../../../app/Features/stocksSlice";
import api from "../../services/api";
import { IoMdAddCircle } from "react-icons/io";
import { IoMdRemoveCircle } from "react-icons/io";
import {
  useGetAllItemInStockQuery,
  useGetAllItemsQuery,
} from "../../../app/Features/itemsSlice";
import { toast } from "react-toastify";
import { useGetAllCustomerQuery } from "../../../app/Features/customersSlice";
import { useGetExchangeRateByIdQuery } from "../../../app/Features/exchangeRatesSlice";
import { currencyFormat } from "../../services/serviceFunction";
import { PoweroffOutlined, SyncOutlined } from "@ant-design/icons";
import { MdLocationPin } from "react-icons/md";

const initialOrder = {
  order_subtotal: 0,
  order_subtotal_discount: 0,
  order_address: null,
  order_total: 0,
  order_customer_id: 1,
  status: 1,
  sale_type: "sale",
  order_payment_status: "paid",
  order_payment_method: "cash",
  delivery_fee: 0,
  order_discount: 0,
  order_tax: 0,
  balance: 0,
  payment: 0,
  items: [],
};

const Sales = () => {
  const proId = localStorage.getItem("profileId");
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [items, setItems] = useState([]);
  const localOrderItems = JSON.parse(localStorage.getItem("orderItems"));
  const { data: exchangeRate } = useGetExchangeRateByIdQuery({
    id: proId,
    token,
  });

  const [orderCount, setOrderCount] = useState();
  const [open, setOpen] = useState(false);
  var navigate = useNavigate();
  const [saleType, setSaleType] = useState("sale");
  const [itemId, setItemId] = useState(null);
  const [colorId, setColorId] = useState(null);
  const [itemCode, setItemCode] = useState(null);
  const [sizeId, setSizeId] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [payment, setPayment] = useState("paid");
  const [alertBox, setAlertBox] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [itemsSech, setItemsSech] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [Category, setCategory] = useState([]);
  const [orders, setOrders] = useState(localOrderItems);
  const [count, setCount] = useState(5);
  const [createOrder] = useCreateOrderMutation();
  const [createStock] = useCreateStockMutation();
  const allItemInStock = useGetAllItemInStockQuery(token);
  const itemData = useGetAllItemsQuery(token);
  const saleItemContext = useGetAllSaleQuery(token);
  const categoryContext = useGetAllCategoriesQuery(token);
  const orderContext = useGetAllOrderQuery(token);
  const orderId = useGetMaxOrderIdQuery(token);
  const { data: customers } = useGetAllCustomerQuery(token);
  const favoriteData = JSON.parse(localStorage.getItem("Favorite"));
  console.log(favoriteData);

  useEffect(() => {
    setCategory(categoryContext.data?.data || []);
    const newItems = saleItemContext?.data?.data?.map((item) => {
      // Extract sizes and make them unique
      // const images = item.item_image.map(i => i.image);
      const sizes = item.size_name.map((i) => i.size);
      const colors = item.color_pick.map((i) => i.color);
      const colorId = item.color_pick.map((i) => i.id);
      const sizeId = item.size_name.map((i) => i.id);
      const uniqueSizeId = [...new Set(sizeId)];
      const uniqueColorId = [...new Set(colorId)];
      const uniqueColors = [...new Set(colors)];
      const uniqueSizes = [...new Set(sizes)];
      // const uniqueImages = [...new Set(images)];
      const newSizes = uniqueSizes.map((s, index) => {
        return {
          id: uniqueSizeId[index],
          size: s,
        };
      });
      const newColors = uniqueColors.map((c, index) => {
        return {
          id: uniqueColorId[index],
          color: c,
        };
      });
      const uniqueData = [
        ...(uniqueColors.length > uniqueSizes.length
          ? uniqueColors
          : uniqueSizes),
      ];
      const uniqueDataId = [
        ...(uniqueColorId.length > uniqueSizeId.length
          ? uniqueColorId
          : uniqueSizeId),
      ];
      console.log("uniqueData", uniqueData);

      const favorite = uniqueDataId?.map((unique, index) => {
        const exist = favoriteData?.find((i) => i.item_id === unique);
        if (exist) {
          console.log("exist", exist);
          console.log("unique", unique);
          return {
            id: unique,
            isFavorite: true,
          };
        }
        return {
          id: unique,
          isFavorite: false,
        };
      });

      return {
        ...item,
        size_name: [...newSizes],
        color_pick: [...newColors],
        favorite,
        quantity: 1,
      };
    });
    console.log("newItems", newItems);
    setAllItems(newItems);
    setItemsSech(newItems || []);
  }, [saleItemContext?.data, categoryContext?.data]);

  //handle order
  function handleOrder(quantity, inStock, item_code, color_id, size_id) {
    let order = null;
    order = itemData.data?.data?.find(
      (item) =>
        item.item_code == item_code &&
        item.color_id == colorId &&
        item.size_id == sizeId
    );
    if (!order) {
      order = itemData.data?.data?.find(
        (item) =>
          item.item_code == item_code &&
          item.color_id == color_id &&
          item.size_id == size_id
      );
    }

    console.log("orderItem", order);
    if (inStock <= 0) {
      messageApi.open({
        type: "error",
        content: "Not found item in stock",
      });
      return;
    }

    messageApi.open({
      type: "info",
      content: `You order product ${order.item_name.toUpperCase()}`,
    });
    const sameOrder = orders?.items?.find(
      (item) => item.item_id == order.item_id
    );

    if (sameOrder) {
      // Item already exists, increment qty
      setOrders((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (item.item_id === order.item_id) {
            const newQuantity = Number(item.quantity) + Number(quantity);
            return {
              ...item,
              quantity: newQuantity,
              price_after_discount: parseFloat(
                prev.sale_type == "sale"
                  ? item.price_discount * newQuantity
                  : item.wholesale_price_discount * newQuantity
              ),
              price: parseFloat(
                prev.sale_type == "sale"
                  ? item.item_price * newQuantity
                  : item.item_wholesale_price * newQuantity
              ),
            };
          }
          return item;
        });

        const newSubTotal = updatedItems.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );
        const newSubTotal_after_discount = updatedItems.reduce(
          (sum, item) => sum + Number(item.price_after_discount),
          0
        );

        const discount = newSubTotal - newSubTotal_after_discount;
        const newTotal = newSubTotal_after_discount + prev.delivery_fee || 0;
        const results = {
          ...prev,
          items: updatedItems,
          discount,
          order_subtotal: Number(newSubTotal.toFixed(2)),
          order_subtotal_discount: Number(
            newSubTotal_after_discount.toFixed(2)
          ),
          order_total: Number(newTotal.toFixed(2)),
          payment: Number(
            (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
          ),
          balance: Number(
            (newTotal - prev.order_payment_status == "paid"
              ? newTotal
              : 0
            ).toFixed(2)
          ),
        };
        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });

      setOrderCount(
        JSON.parse(localStorage.getItem("orderItems")).items.reduce(
          (init, curr) => init + curr.quantity,
          0
        )
      );
    } else {
      setOrders((prev) => {
        const updatedItems = [
          ...prev.items,
          {
            item_id: order.item_id,
            item_image: order.item_image,
            item_name: order.item_name,
            quantity: quantity,
            discount: order.discount,
            item_cost: order.item_cost,
            item_price: order.item_price,
            item_wholesale_price: order.wholesale_price,
            price_discount: order.price_discount,
            wholesale_price_discount: order.wholesale_price_discount,
            price: Number(
              prev.sale_type == "sale"
                ? order.item_price * Number(quantity)
                : order.wholesale_price * Number(quantity)
            ),
            price_after_discount: Number(
              prev.sale_type == "sale"
                ? order.price_discount * Number(quantity)
                : order.wholesale_price_discount * Number(quantity)
            ),
          },
        ];

        const newSubTotal = updatedItems.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );
        const newSubTotal_after_discount = updatedItems.reduce(
          (sum, item) => sum + Number(item.price_after_discount),
          0
        );

        const discount = newSubTotal - newSubTotal_after_discount;
        const newTotal = newSubTotal_after_discount + prev.delivery_fee || 0;
        const results = {
          ...prev,
          items: updatedItems,
          discount,
          order_subtotal: Number(newSubTotal.toFixed(2)),
          order_subtotal_discount: Number(
            newSubTotal_after_discount.toFixed(2)
          ),
          order_total: Number(newTotal.toFixed(2)),
          payment: Number(
            (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
          ),
          balance: Number(
            (newTotal - prev.order_payment_status == "paid"
              ? newTotal
              : 0
            ).toFixed(2)
          ),
        };

        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
      setOrderCount(
        JSON.parse(localStorage.getItem("orderItems")).items.reduce(
          (init, curr) => init + curr.quantity,
          0
        )
      );
    }
  }

  function handleQtyPlus(id) {
    console.log(orders);
    //find current item in stock
    const findItem = allItemInStock.data?.data?.find(
      (item) => item.item_id == id
    );
    if (findItem.in_stock <= 0) {
      messageApi.open({
        type: "error",
        content: "Not found item in stock",
      });
      return;
    }

    setOrders((prev) => {
      console.log("updat:", prev.items);
      const updatedItems = prev.items.map((item) => {
        if (item.item_id === id) {
          setOrderCount(
            JSON.parse(localStorage.getItem("orderItems")).items.reduce(
              (init, curr) => init + curr.quantity,
              0
            )
          );
          return {
            ...item,
            quantity: item.quantity + 1,

            price: Number(
              prev.sale_type == "sale"
                ? item.item_price * (item.quantity + 1)
                : item.item_wholesale_price * (item.quantity + 1)
            ),
            price_after_discount: Number(
              prev.sale_type == "sale"
                ? item.price_discount * (item.quantity + 1)
                : item.wholesale_price_discount * (item.quantity + 1)
            ),
          };
        }
        return item;
      });

      const newSubTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      );
      const newSubTotal_after_discount = updatedItems.reduce(
        (sum, item) => sum + Number(item.price_after_discount),
        0
      );
      const tax = newSubTotal - newSubTotal * (Number(prev.order_tax) / 100);
      const discount = newSubTotal - newSubTotal_after_discount;
      const newTotal =
        newSubTotal_after_discount + prev.delivery_fee || 0 + tax || 0;

      console.log("discount", prev.order_discount);

      console.log(
        "newtotal",
        newSubTotal - (newSubTotal * Number(prev.order_discount || 0)) / 100
      );

      const results = {
        ...prev,
        items: updatedItems,
        discount,
        order_subtotal: Number(newSubTotal.toFixed(2)),
        order_subtotal_discount: Number(newSubTotal_after_discount.toFixed(2)),
        order_total: Number((newTotal ?? newSubTotal).toFixed(2)),
        payment: Number(
          (prev.order_payment_method == "paid"
            ? newTotal ?? newSubTotal
            : 0
          ).toFixed(2)
        ),
        balance: Number(
          ((newTotal || newSubTotal) - prev.order_payment_method == "paid"
            ? newTotal
            : 0
          ).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  }
  function handleQty(id) {
    const findOrder = orders.items.find((item) => item.item_id == id);
    if (findOrder.quantity == 1) {
      return;
    }
    setOrders((prev) => {
      const updatedItems = prev.items.map((item) => {
        if (item.item_id === id) {
          setOrderCount(
            JSON.parse(localStorage.getItem("orderItems")).items.reduce(
              (init, curr) => init + curr.quantity,
              0
            )
          );
          if (item.quantity === 1) {
            // Return unchanged
            return { ...item };
          }
          return {
            ...item,
            quantity: item.quantity - 1,
            price: Number(
              prev.sale_type == "sale"
                ? item.item_price * (item.quantity - 1)
                : item.item_wholesale_price * (item.quantity - 1)
            ),
            price_after_discount:
              Number(
                prev.sale_type == "sale"
                  ? item.price_discount
                  : item.wholesale_price_discount
              ) *
              (item.quantity - 1),
          };
        }
        return item;
      });

      const newSubTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      );
      const newSubTotal_after_discount = updatedItems.reduce(
        (sum, item) => sum + Number(item.price_after_discount),
        0
      );

      const tax = newSubTotal - newSubTotal * (Number(prev.order_tax) / 100);
      const discount = newSubTotal - newSubTotal_after_discount;
      const newTotal =
        newSubTotal_after_discount + prev.delivery_fee || 0 + tax || 0;
      const results = {
        ...prev,
        items: updatedItems,
        discount,
        order_subtotal: Number(newSubTotal.toFixed(2)),
        order_subtotal_discount: Number(newSubTotal_after_discount.toFixed(2)),
        order_total: Number(newTotal.toFixed(2)),
        payment: Number(
          (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
        ),
        balance: Number(
          (newTotal - prev.order_payment_status == "paid"
            ? newTotal
            : 0
          ).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
  }

  function handleDelete(id) {
    const findOrder = orders.items.find((item) => item.item_id == id);
    setOrders((prev) => {
      // Filter out the removed item
      const updatedItems = prev.items.filter((item) => item.item_id != id);

      // Calculate new suborder_total
      const newSubTotal = updatedItems.reduce(
        (sum, item) => sum + Number(item.price),
        0
      );
      const newSubTotal_after_discount = updatedItems.reduce(
        (sum, item) => sum + Number(item.price_after_discount),
        0
      );

      // Calculate new order_total
      const tax = newSubTotal - newSubTotal * (Number(prev.order_tax) / 100);
      const discount = newSubTotal - newSubTotal_after_discount;
      const newTotal =
        newSubTotal_after_discount + prev.delivery_fee || 0 + tax || 0;

      const results = {
        ...prev,
        items: updatedItems,
        discount,
        order_subtotal: Number(newSubTotal.toFixed(2)),
        order_subtotal_discount: Number(newSubTotal_after_discount.toFixed(2)),
        order_total: Number(newTotal.toFixed(2)),
        payment: Number(
          (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
        ),
        balance: Number(
          (newTotal - prev.order_payment_status == "paid"
            ? newTotal
            : 0
          ).toFixed(2)
        ),
      };

      localStorage.setItem("orderItems", JSON.stringify(results));
      return results;
    });
    setItemsSech((prev) => {
      const updatedItems = prev.map((item) => {
        if (item.item_id === id) {
          return {
            ...item,
            in_stock: item.in_stock + findOrder.quantity,
          };
        }
        return item;
      });
      return updatedItems;
    });
    setOrderCount(
      JSON.parse(localStorage.getItem("orderItems")).items.reduce(
        (init, curr) => init + curr.quantity,
        0
      )
    );
    messageApi.open({
      type: "success",
      content: `You deleted product ${findOrder.item_name.toUpperCase()}`,
    });
  }

  function changeDiscount(e) { }

  function handleCancel() {
    setAlertBox(false);
  }

  async function handleConfirm() {
    const toDay = new Date();
    const payload = {
      ...orders,
      order_tel: orders.order_tel || "0",
      order_discount: orders.discount,
      order_address: orders.order_address || "unknown",
    };
    console.log(payload);

    try {
      setLoading(true);
      setAlertBox(false);
      const orderRes = await api.post("/order_masters", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(orderRes.data.message || "Order created successfully");
      await orderId.refetch();
      const order_id = orderId.data.max_id + 1;
      const inStocks = {
        stock_type_id: 5,
        from_warehouse: 1,
        warehouse_id: 3,
        order_id: order_id,
        stock_remark: orders.order_address || "sale",
        items: orders.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          item_cost: item.item_cost,
          item_price: item.item_price,
          item_wholesale_price: item.item_wholesale_price,
          expire_date: toDay.toISOString().split("T")[0], // Format date to YYYY-MM-DD
        })),
      };
      const stockRes = await api.post("/stock_masters", inStocks, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (orderRes.data.status === 200) {
        saleItemContext.refetch();
        orderContext.refetch();
        setAlertBox(false);
        setLoading(false);
        setOrderCount(0);
        onClose();
        localStorage.setItem("orderItems", JSON.stringify(initialOrder));
        setOrders(initialOrder);
      }
      payload?.sale_type === "sale"
        ? navigate(
          `/dashboard/order-list/receipt/${orderRes.data.data.order_id}`
        )
        : navigate(
          `/dashboard/order-list/invoice/${orderRes.data.data.order_id}`
        );
      if (!stockRes.data.status === 200) {
        setAlertBox(false);
        setLoading(false);
        toast.error(stockRes.data.message || "Fail order products");
      }
    } catch (error) {
      setAlertBox(false);
      setLoading(false);
      toast.error(
        error?.message || error || "An error occurred while creating the order"
      );
    }
  }

  async function handleSubmit() {
    setAlertBox(true);
    console.log(orders);
  }

  function onFilterCategory() {
    if (event.target.value == "all") {
      setItemsSech(allItems);
    } else if (event.target.value) {
      const filterItem = allItems?.filter(
        (item) => item.category_id == event.target.value
      );
      setItemsSech(filterItem);
    } else {
      setItemsSech(allItems);
    }
  }

  function onSearch() {
    if (event.target.value) {
      const filterItem = allItems?.filter((item) =>
        item.item_name.toLowerCase().includes(event.target.value.toLowerCase())
      );
      setItemsSech(filterItem);
    } else {
      setItemsSech(allItems);
    }
  }

  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };

  const handleSize = (item_code, size_id) => {
    console.log(item_code, size_id);
    setSizeId(size_id);
    setItemCode(item_code);
    const filterItems = itemData.data?.data?.filter(
      (item) => item.item_code === item_code && item.size_id == size_id
    );
    console.log("filterItems", filterItems);
    if (filterItems.length > 1) {
      setColorId(filterItems[filterItems.length - 1].color_id);
    } else {
      setItemId(filterItems[filterItems.length - 1].item_id);
      setColorId(filterItems[filterItems.length - 1].color_id);
    }
    const filterItem = itemData.data?.data?.filter(
      (item) =>
        item.item_code === item_code &&
        item.size_id == size_id &&
        item.item_id == filterItems[filterItems.length - 1].item_id &&
        item.color_id == filterItems[filterItems.length - 1].color_id
    );
    console.log(filterItem);
    setItemsSech((p) => {
      return p.map((i) => {
        if (i.item_code === item_code) {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        } else {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        }
      });
    });
  };
  const handleColor = (item_code, color_id) => {
    setColorId(color_id);
    setItemCode(item_code);
    const filterItems = itemData.data?.data?.filter(
      (item) => item.item_code === item_code && item.color_id == color_id
    );
    if (filterItems.length > 1) {
      setSizeId(filterItems[filterItems.length - 1].size_id);
    } else {
      setSizeId(filterItems[filterItems.length - 1].size_id);
    }
    const filterItem = itemData.data?.data?.filter(
      (item) =>
        item.item_code === item_code &&
        item.size_id == filterItems[filterItems.length - 1].size_id &&
        item.item_id == filterItems[filterItems.length - 1].item_id &&
        item.color_id == color_id
    );
    setItemId(filterItem[0].item_id);
    setItemsSech((p) => {
      return p.map((i) => {
        if (i.item_code === item_code) {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        } else {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        }
      });
    });
  };

  const hanldeIncrement = (item_code) => {
    setItemsSech((p) => {
      return p.map((i) => {
        if (i.item_code === item_code) {
          return {
            ...i,
            quantity: i.quantity + 1, // create new quantity, no mutation
          };
        } else {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        }
      });
    });
  };
  const hanldeDecrement = (item_code) => {
    setItemsSech((p) => {
      return p.map((i) => {
        if (i.item_code === item_code) {
          return {
            ...i,
            quantity: i.quantity - 1, // create new quantity, no mutation
          };
        } else {
          return {
            ...i,
            quantity: 1, // create new quantity, no mutation
          };
        }
        return i; // return unchanged item if not matching
      });
    });
  };

  const handleSaleType = (e) => {
    setSaleType(e.target.value);
    if (e.target.value == "wholesale") {
      setOrders((prev) => {
        const updatedItems = prev.items.map((item) => {
          const results = {
            ...item,
            price:
              Number(
                Number(item.item_wholesale_price) == 0
                  ? item.item_price
                  : item.item_wholesale_price
              ) * Number(item.quantity),
            price_after_discount:
              Number(
                Number(item.item_wholesale_price) == 0
                  ? item.item_price
                  : item.wholesale_price_discount
              ) * Number(item.quantity),
          };
          return results;
        });

        const newSubTotal = updatedItems.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );
        const newSubTotal_after_discount = updatedItems.reduce(
          (sum, item) => sum + Number(item.price_after_discount),
          0
        );

        const discount = newSubTotal - newSubTotal_after_discount;

        const newTotal = newSubTotal_after_discount + (prev.delivery_fee ?? 0);
        console.log("newTotal", newTotal);
        const results = {
          ...prev,
          items: updatedItems,
          discount: discount,
          sale_type: "wholesale",
          order_customer_id: 0,
          order_subtotal_discount: Number(
            newSubTotal_after_discount.toFixed(2)
          ),
          order_total: Number(newTotal.toFixed(2)),
          payment: Number(
            (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
          ),
          balance: Number(
            (newTotal - prev.order_payment_status == "paid"
              ? newTotal
              : 0
            ).toFixed(2)
          ),
        };
        localStorage.setItem("orderItems", JSON.stringify(results));
        console.log(results);
        return results;
      });
    } else {
      setOrders((prev) => {
        const updatedItems = prev.items.map((item) => {
          const results = {
            ...item,
            price: Number(item.item_price * item.quantity),
            price_after_discount: Number(item.price_discount * item.quantity),
          };
          return results;
        });

        const newSubTotal = updatedItems.reduce(
          (sum, item) => sum + Number(item.price),
          0
        );
        const newSubTotal_after_discount = updatedItems.reduce(
          (sum, item) => sum + Number(item.price_after_discount),
          0
        );

        console.log(newSubTotal, newSubTotal_after_discount);
        const discount = newSubTotal - newSubTotal_after_discount;
        const newTotal = newSubTotal_after_discount + (prev.delivery_fee ?? 0);
        const results = {
          ...prev,
          items: updatedItems,
          discount: discount,
          sale_type: "sale",
          order_customer_id: 1,
          order_tax: 0,
          order_subtotal: Number(newSubTotal.toFixed(2)),
          order_subtotal_discount: Number(newSubTotal.toFixed(2)),
          order_total: Number(newTotal.toFixed(2)),
          payment: Number(
            (prev.order_payment_status == "paid" ? newTotal : 0).toFixed(2)
          ),
          balance: Number(
            (newTotal - prev.order_payment_status == "paid"
              ? newTotal
              : 0
            ).toFixed(2)
          ),
        };
        localStorage.setItem("orderItems", JSON.stringify(results));
        return results;
      });
    }
  };

  const handleFavorite = (item_code, color_id, size_id) => {
    const localItem = JSON.parse(localStorage.getItem("Favorite"));

    let itemFind = null;
    itemFind = itemData.data?.data?.find(
      (item) =>
        item.item_code == item_code &&
        item.color_id == colorId &&
        item.size_id == sizeId
    );
    if (!itemFind) {
      itemFind = itemData.data?.data?.find(
        (item) =>
          item.item_code == item_code &&
          item.color_id == color_id &&
          item.size_id == size_id
      );
    }

    const exist = localItem?.find((i) => i.item_id === itemFind.item_id);

    if (exist) {
      setItemsSech((prev) => {
        // Make a shallow copy of the previous array
        const newUpdate = prev.map((item) => {
          if (item.item_code == item_code) {
            // Update favorite items safely
            const updatedFavorite = item.favorite?.map((f) => {
              console.log(f.id);

              return f.id == itemFind.item_id ? { ...f, isFavorite: false } : f;
            });

            console.log("item", itemFind.item_id);
            console.log("item", updatedFavorite);
            const result = {
              ...item,
              favorite: updatedFavorite,
            };

            console.log("result", result);
            return result;
          } else {
            return {
              ...item,
              favorite: item.favorite,
            };
          }
        });
        return newUpdate;
      });

      const newItem =
        localItem.filter((i) => i.item_id != itemFind.item_id) ?? [];
      localStorage.setItem("Favorite", JSON.stringify(newItem));
    } else {
      setItemsSech((prev) => {
        // Make a shallow copy of the previous array
        const newUpdate = prev.map((item) => {
          if (item.item_code === item_code) {
            // Update favorite items safely
            const updatedFavorite = item.favorite?.map((f) => {
              console.log(f.id);

              return f.id == itemFind.item_id ? { ...f, isFavorite: true } : f;
            });

            console.log("item_code", item_code);
            console.log("favorite", updatedFavorite);
            console.log("itemFind", itemFind.item_id);
            return {
              ...item,
              favorite: updatedFavorite,
            };
          } else {
            return {
              ...item,
              favorite: item.favorite,
            };
          }
        });
        return newUpdate;
      });
      localItem.push(itemFind);

      localStorage.setItem("Favorite", JSON.stringify(localItem));
    }
  };

  const getLocation = () => {
    event.preventDefault();
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(navigate.geolocation);
        setOrders((prev) => {
          const results = {
            ...prev,
            order_address: `${position.coords.latitude}, ${position.coords.longitude}`,
          };
          localStorage.setItem("orderItems", JSON.stringify(results));
          return results;
        });
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        // setError(null);
        setLoading(false);
      },
      (err) => {
        toast.error(err.message);
        setLoading(false);
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <section className="px-2 md:px-5 lg:px-10 py-5 bg-sky-50 h-[100vh] flex flex-col gap-5">
        {contextHolder}
        <AlertBox
          isOpen={alertBox}
          title="Question"
          message="Are you sure you want create expanse?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Ok"
          cancelText="Cancel"
        />
        <article className="grid grid-cols-2 gap-5">
          <nav className="oder-1 col-span-3 grid grid-cols-3">
            <div className="join flex col-span-3 md:col-span-3 flex-wrap md:flex-nowrap gap-5 justify-end">
              <div className="flex w-full min-w-50 drop-shadow-sm">
                <div className="flex-1">
                  <div>
                    <input
                      onChange={onSearch}
                      className="input join-item w-full bg-white text-gray-800 focus:outline-none"
                      placeholder="Search"
                    />
                  </div>
                </div>
                <select
                  onChange={onFilterCategory}
                  defaultValue={"Filter"}
                  className="select join-item bg-white w-20 sm:w-40 text-gray-800focus:outline-none"
                >
                  <option disabled>Filter</option>
                  <option value="all">All</option>
                  {Category.map((item, index) => (
                    <option key={index} value={item.category_id}>
                      {item.category_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* <Link to="/dashboard/order-list">
                <button className="btn bg-[#03C755] text-white ml-5 w-40 border-[#00b544]">
                  <LuListChecks className="text-xl" />
                  Daily Order
                </button>
              </Link> */}
              <div>
                <Space
                  direction="vertical"
                  onClick={showDrawer}
                  className="ml-3"
                >
                  <Space size="large">
                    <Badge count={orderCount}>
                      <Avatar shape="square" size="large">
                        <PiShoppingCartBold className="text-xl" />
                      </Avatar>
                    </Badge>
                  </Space>
                </Space>
              </div>
            </div>
          </nav>
          <nav className=" col-span-3 lg:col-span-2 justify-center  flex flex-wrap gap-3">
            {itemsSech?.length === 0 ? (
              saleItemContext?.isLoading ? (
                <article className="flex flex-wrap gap-5 justify-center">
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                  <div className="flex flex-col gap-2 w-[200px]">
                    <Space>
                      <Skeleton.Node
                        active={true}
                        style={{ width: 200, height: 200 }}
                      />
                    </Space>
                    <Skeleton.Button
                      active={true}
                      size={"small"}
                      shape={"default"}
                    />
                    <Skeleton.Input active={true} size={"small"} block={true} />
                    <Skeleton.Input active={true} size={"small"} />
                    <Space>
                      <Skeleton.Button
                        active={true}
                        size={"small"}
                        shape={"default"}
                      />
                      <Skeleton.Node
                        active={true}
                        style={{ width: 70, height: 24, marginLeft: 70 }}
                      />
                    </Space>
                  </div>
                </article>
              ) : (
                <div>
                  <Empty
                    className="w-full flex flex-col items-center justify-center"
                    image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                    styles={{ image: { height: 60 } }}
                    description={<Typography.Text>Not data</Typography.Text>}
                  >
                    <Button
                      type="primary"
                      onClick={() => navigate("/dashboard/add-to-stock")}
                    >
                      បញ្ចូលស្តុក
                    </Button>
                  </Empty>
                </div>
              )
            ) : (
              itemsSech?.map(
                (
                  {
                    item_name,
                    item_code,
                    item_price,
                    item_image,
                    in_stock,
                    category_name,
                    discount,
                    price_discount,
                    size_name,
                    color_pick,
                    quantity,
                    favorite,
                  },
                  index
                ) => (
                  <div
                    key={index}
                    className=" relative bg-white p-2 h-74 text-gray-800"
                  >
                    <div>
                      {/* <Image.PreviewGroup
                        items={item_image?.map((img) => img?.image)}
                      > */}
                      <img
                        className=" object-contain h-[160px] w-[160px]"
                        src={
                          item_image?.map((img) => {
                            if (img?.item_id == itemId) {
                              return img?.image;
                            } else if (
                              item_code == itemCode &&
                              img?.item_id == item_image[0]?.item_id
                            ) {
                              return img?.image;
                            } else {
                              return item_image[0]?.image;
                            }
                          })[item_image.length - 1]
                        }
                      />
                      {/* </Image.PreviewGroup> */}
                    </div>
                    {discount?.map((p) => {
                      if (p?.item_id == itemId) {
                        return p?.persent;
                      } else if (
                        item_code == itemCode &&
                        p?.item_id == discount[0]?.item_id
                      ) {
                        return p?.persent;
                      } else {
                        return discount[0]?.persent;
                      }
                    })[discount.length - 1] ? (
                      <p className="absolute top-3 left-0 text-white bg-red-500 text-[13px] h-6 w-15 p-[1px] rounded-br-4xl pl-3 text-start">
                        -
                        {discount?.map((p) => {
                          if (p?.item_id == itemId) {
                            return p?.persent;
                          } else if (
                            item_code == itemCode &&
                            p?.item_id == discount[0]?.item_id
                          ) {
                            return p?.persent;
                          } else {
                            return discount[0]?.persent;
                          }
                        })[discount.length - 1] + "%"}
                      </p>
                    ) : (
                      ""
                    )}
                    <div>
                      <h1>{item_name}</h1>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-400">
                          {category_name}
                        </p>
                        <p className="text-xs font-bold text-gray-400">
                          {
                            in_stock?.map((stock) => {
                              if (stock?.item_id == itemId) {
                                return stock?.stock;
                              } else if (
                                item_code == itemCode &&
                                stock?.item_id == in_stock[0]?.item_id
                              ) {
                                return stock?.stock;
                              } else {
                                return in_stock[0]?.stock;
                              }
                            })[in_stock.length - 1]
                          }{" "}
                          <span className="font-normal">in stock</span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex gap-1">
                        {size_name?.map((size) => {
                          return (
                            <button
                              key={size.id}
                              onClick={() => handleSize(item_code, size.id)}
                              className={`text-xs border rounded-sm cursor-pointer px-1 border-yellow-500 text-white  ${size.id == sizeId
                                ? "bg-yellow-500"
                                : item_code != itemCode
                                  ? size.id != size_name[0].id
                                    ? "text-yellow-400"
                                    : "bg-yellow-500"
                                  : "text-yellow-400"
                                }`}
                            >
                              {size.size}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex  gap-1 justify-end items-center">
                        {/* <div className='flex flex-col gap-2'> */}
                        {color_pick.map((color) => {
                          return (
                            <div
                              key={color.id}
                              onClick={() => handleColor(item_code, color.id)}
                              style={{ backgroundColor: color.color }}
                              className={`h-4 w-4 rounded-full box-content  ${color.id == colorId
                                ? "border-green-500 border-1"
                                : item_code != itemCode
                                  ? color.id != color_pick[0].id
                                    ? "border-none"
                                    : "border-green-500 border-1"
                                  : "border-none"
                                }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="font-bold text-red-500">
                        {discount?.map((p) => {
                          if (p?.item_id == itemId) {
                            return p?.persent;
                          } else if (
                            item_code == itemCode &&
                            p?.item_id == discount[0]?.item_id
                          ) {
                            return p?.persent;
                          } else {
                            return discount[0]?.persent;
                          }
                        })[discount.length - 1] ? (
                          <div className="flex items-start flex-col">
                            <p className="text-md">
                              $
                              {parseFloat(
                                price_discount?.map((p) => {
                                  if (p?.item_id == itemId) {
                                    return p?.price;
                                  } else if (
                                    item_code == itemCode &&
                                    p?.item_id == price_discount[0]?.item_id
                                  ) {
                                    return p?.price;
                                  } else {
                                    return price_discount[0]?.price;
                                  }
                                })[price_discount.length - 1]
                              ).toFixed(2)}
                            </p>
                            <del className="text-gray-400 text-xs">
                              $
                              {item_price
                                ?.map((p) => {
                                  if (p?.item_id == itemId) {
                                    return p?.price;
                                  } else if (
                                    item_code == itemCode &&
                                    p?.item_id == item_price[0]?.item_id
                                  ) {
                                    return p?.price;
                                  } else {
                                    return item_price[0]?.price;
                                  }
                                })
                              [item_price.length - 1].toFixed(2)}
                            </del>
                          </div>
                        ) : (
                          <p className="text-md">
                            $
                            {item_price
                              ?.map((p) => {
                                if (p?.item_id == itemId) {
                                  return p?.price;
                                } else if (
                                  item_code == itemCode &&
                                  p?.item_id == item_price[0]?.item_id
                                ) {
                                  return p?.price;
                                } else {
                                  return item_price[0]?.price;
                                }
                              })
                            [item_price.length - 1].toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3 text-xl">
                        <TiShoppingCart
                          onClick={() =>
                            handleOrder(
                              quantity,
                              1,
                              item_code,
                              color_pick[0].id,
                              size_name[0].id
                            )
                          }
                        />
                        {
                          favorite?.map((fav) => {
                            if (fav?.id == itemId) {
                              return fav?.isFavorite ? (
                                <GoHeartFill
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              ) : (
                                <GoHeart
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              );
                            } else if (
                              item_code == itemCode &&
                              fav.id == favorite[0].id
                            ) {
                              return fav?.isFavorite ? (
                                <GoHeartFill
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              ) : (
                                <GoHeart
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              );
                            } else {
                              return favorite[0]?.isFavorite ? (
                                <GoHeartFill
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              ) : (
                                <GoHeart
                                  onClick={() =>
                                    handleFavorite(
                                      item_code,
                                      color_pick[0].id,
                                      size_name[0].id
                                    )
                                  }
                                />
                              );
                            }
                          })[favorite.length - 1]
                        }
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </nav>

          <nav>
            <Drawer
              zIndex={1}
              title="Order Products"
              placement={"right"}
              width={360}
              closable={{ "aria-label": "Close Button" }}
              onClose={onClose}
              open={open}
              key={"right"}
            >
              <nav>
                <fieldset className="fieldset rounded-box w-full bg-transparent">
                  <div className="overflow-x-auto border-b border-gray-400 !text-gray-700">
                    {orders?.items?.map(
                      (
                        {
                          item_id,
                          item_name,
                          price,
                          quantity,
                          discount,
                          item_price,
                          item_wholesale_price,
                          price_discount,
                          wholesale_price_discount,
                          item_image,
                        },
                        index
                      ) => (
                        <div
                          key={index}
                          className="grid grid-cols-5 gap-2 mb-2"
                        >
                          <div className=" relative">
                            {discount != 0 ? (
                              <div className=" absolute bg-red-500 text-xs px-1 text-white">
                                -{discount}%
                              </div>
                            ) : (
                              ""
                            )}
                            <img
                              className="w-15 h-15 object-cover"
                              src={
                                item_image ||
                                `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQNN0zDsMdjTMSBn1_2ZiuPbb-zg-MHi6O8A&s`
                              }
                              alt=""
                            />
                          </div>
                          <div className="col-span-2">
                            <h1 className="text-[15px] font-bold">
                              {item_name}
                            </h1>
                            <h1 className="text-xs text-primary">
                              $
                              {orders?.sale_type != "wholesale" ? (
                                discount == 0 ? (
                                  item_price
                                ) : (
                                  <span>
                                    {price_discount}
                                    <del className="ml-2 text-gray-400">
                                      ${item_price}
                                    </del>
                                  </span>
                                )
                              ) : discount == 0 ? (
                                item_wholesale_price
                              ) : (
                                <span>
                                  {wholesale_price_discount}
                                  <del className="ml-2 text-gray-400">
                                    ${item_wholesale_price}
                                  </del>
                                </span>
                              )}
                            </h1>
                            <div>
                              <div className="join join-horizontal">
                                <button
                                  className="btn join-item bg-error border-error w-3 text-xs h-5"
                                  onClick={() => handleQty(item_id)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  name="quantity"
                                  readOnly
                                  value={quantity || ""}
                                  id="quantity"
                                  className="text-center text-xs border h-5 border-gray-400 w-10 focus:outline-none
                                [&::-webkit-inner-spin-button]:appearance-none
                                [&::-webkit-outer-spin-button]:appearance-none
                                [appearance:textfield]"
                                />
                                <button
                                  className="btn join-item w-3 border-success bg-success text-xs h-5"
                                  onClick={() => handleQtyPlus(item_id)}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end col-span-2">
                            <p className="text-[15px] font-bold">
                              $
                              {discount == 0 ? (
                                price
                              ) : orders?.sale_type === "wholesale" ? (
                                <span>
                                  {(
                                    wholesale_price_discount * quantity
                                  ).toFixed(2)}
                                  <del className="ml-1 text-xs text-gray-400">
                                    $
                                    {(item_wholesale_price * quantity).toFixed(
                                      2
                                    )}
                                  </del>
                                </span>
                              ) : (
                                <span>
                                  {(price_discount * quantity).toFixed(2)}
                                  <del className="ml-1 text-xs text-gray-400">
                                    ${(item_price * quantity).toFixed(2)}
                                  </del>
                                </span>
                              )}
                            </p>
                            <div>
                              <AiTwotoneDelete
                                className="text-error text-xl cursor-pointer"
                                title="delete"
                                onClick={() => handleDelete(item_id)}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {/* <legend className="fieldset-legend text-black text-xl">Order Item</legend> */}
                  <button
                    onClick={() => {
                      setOrders(initialOrder);
                      localStorage.setItem(
                        "orderItems",
                        JSON.stringify(initialOrder)
                      );
                      setOrderCount(0);
                    }}
                    className="btn btn-error ml-auto btn-xs w-20 text-white"
                  >
                    clear
                  </button>
                  <div className="text-black flex items-center justify-between">
                    <h1>តម្លៃទំនិញសរុប</h1>
                    <h1>${orders?.order_subtotal}</h1>
                  </div>
                  {/* <div className="flex gap-5 items-center">
                    <div className="flex items-center gap-2">
                      <input
                        onClick={handleSaleType}
                        type="radio"
                        defaultChecked
                        value={"sale"}
                        name="sale"
                        id="sale"
                      />
                      <label htmlFor="sale">លក់រាយ</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        onClick={handleSaleType}
                        type="radio"
                        value={"wholesale"}
                        name="sale"
                        id="wholesale"
                      />
                      <label htmlFor="wholesale">លក់ដុំ</label>
                    </div>
                  </div> */}
                  <div className="flex items-center justify-between gap-4 py-2">
                    <label className="label text-black">បញ្ចុះតម្លៃ</label>
                    <p>${Number(orders?.discount || 0).toFixed(2)}</p>
                  </div>
                  {/* <div className="flex items-center justify-between gap-4">
                    <label className="label text-black">ថ្លៃដឹក</label>
                    <input
                      onChange={(e) =>
                        setOrders((prev) => {
                          const deliveryFee = Number(e.target.value) || 0;

                          // base_total = order_total without delivery_fee
                          const baseTotal =
                            prev.order_total - (prev.delivery_fee || 0);

                          const newTotal = baseTotal + deliveryFee;

                          const results = {
                            ...prev,
                            delivery_fee: deliveryFee,
                            order_total: newTotal,
                            payment:
                              prev.order_payment_status === "paid"
                                ? newTotal
                                : 0,
                            balance:
                              prev.order_payment_status === "paid"
                                ? 0
                                : newTotal,
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        })
                      }
                      value={orders.delivery_fee || ""}
                      type="number"
                      className="input w-20 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="$0.00"
                    />
                  </div> */}
                  <div
                    className={`flex items-center justify-between gap-4 ${orders?.sale_type == "sale" ? "hidden" : ""
                      }`}
                  >
                    <label className="label text-black">ពន្ធ(Tax)</label>
                    <input
                      onChange={(e) =>
                        setOrders((prev) => {
                          const tax = Number(e.target.value) || 0;
                          const cash_tax = (prev.order_total * tax) / 100;
                          const cash_tax_prev =
                            (prev.order_total * prev?.order_tax) / 100;
                          // base_total = order_total without tax
                          const baseTotal =
                            prev.order_total - Number(cash_tax_prev);

                          const newTotal = baseTotal + cash_tax;

                          const results = {
                            ...prev,
                            order_tax: tax,
                            order_total: Number(newTotal.toFixed(2)),
                            payment:
                              prev.order_payment_status === "paid"
                                ? Number(newTotal.toFixed(2))
                                : 0,
                            balance:
                              prev.order_payment_status === "paid"
                                ? 0
                                : Number(newTotal.toFixed(2)),
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        })
                      }
                      type="number"
                      value={orders?.order_tax || ""}
                      className="input w-20 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="0.00 %"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="label text-black">
                      វិធីសាស្រ្តបង់ប្រាក់
                    </label>
                    <select
                      onChange={() =>
                        setOrders((prev) => {
                          const results = {
                            ...prev,
                            order_payment_method: event.target.value,
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        })
                      }
                      type="number"
                      defaultValue={orders?.order_payment_method || "cash"}
                      className="input w-25 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="method"
                    >
                      <option value={"cash"}>សាច់ប្រាក់</option>
                      <option value={"bank"}>ធនាគារ</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <label className="label text-black">ការបង់ប្រាក់</label>
                    <select
                      onChange={() => {
                        setOrders((prev) => {
                          const results = {
                            ...prev,
                            order_payment_status: event.target.value,
                            balance:
                              event.target.value == "paid"
                                ? 0
                                : (prev.order_total - prev.payment).toFixed(2),
                            payment: 0,
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        });
                        setPayment(event.target.value);
                      }}
                      defaultValue={orders?.order_payment_status || "paid"}
                      type="number"
                      className="input w-25 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="status"
                    >
                      <option value={"paid"}>បង់ទាំងអស់</option>
                      <option value={"cod"}>ជំពាក់</option>
                    </select>
                  </div>
                  <div
                    className={`flex items-center justify-between gap-4 ${orders?.sale_type == "sale" ? "hidden" : ""
                      }`}
                  >
                    <label className="label text-black">អតិថិជន</label>
                    <select
                      onChange={() => {
                        setOrders((prev) => {
                          const customerFind = customers?.data?.find(
                            (c) => c.customer_id == Number(event.target.value)
                          );
                          const results = {
                            ...prev,
                            order_customer_id: Number(event.target.value),
                            order_tel: customerFind?.customer_tel || "",
                            order_address: customerFind?.customer_address || "",
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        });
                      }}
                      value={orders?.order_customer_id || 0}
                      type="number"
                      className="input w-25 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="status"
                    >
                      <option value={0}>អតិថិជន...</option>
                      {customers?.data?.map((customer) => (
                        <option
                          key={customer.customer_id}
                          value={customer.customer_id}
                        >
                          {customer?.customer_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    className={`flex items-center justify-between gap-4 ${payment == "paid" ? "hidden" : ""
                      }`}
                  >
                    <label className="label text-black">បង់ប្រាក់</label>
                    <input
                      onChange={() =>
                        setOrders((prev) => {
                          const results = {
                            ...prev,
                            payment: Number(event.target.value),
                            balance:
                              prev.order_total - Number(event.target.value),
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        })
                      }
                      value={orders?.payment || ""}
                      type="number"
                      className="input w-20 bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="$0.00"
                    />
                  </div>
                  <div
                    className={`text-black flex items-center justify-between gap-4 ${payment == "paid" ? "hidden" : ""
                      }`}
                  >
                    <h1>ជំពាក់</h1>
                    <h1>${Number(orders?.balance)?.toFixed(2) || "0.00"}</h1>
                  </div>
                  <div
                    className={`flex items-center justify-between gap-4 ${orders?.sale_type != "sale" ? "hidden" : ""
                      }`}
                  >
                    <label className="label text-black">
                      លេខទូរស័ព្ទអតិថិជន
                    </label>
                    <input
                      onChange={() =>
                        setOrders((prev) => {
                          const results = {
                            ...prev,
                            order_tel: event.target.value,
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        })
                      }
                      type="tel"
                      value={orders?.order_tel || ""}
                      className="input bg-transparent text-gray-800 border-gray-400 focus:outline-none"
                      placeholder="000-0000-000"
                    />
                  </div>
                  <fieldset
                    className={`fieldset ${orders?.sale_type != "sale" ? "hidden" : ""
                      }`}
                  >
                    <legend className="fieldset-legend text-gray-800">
                      អាស័យដ្ឋានអតិថិជន
                    </legend>
                    <button
                      disabled={loading}
                      onClick={getLocation}
                      className="bg-blue-500 text-white px-2 cursor-pointer py-1 mb-2 rounded-md flex items-center gap-2"
                    >
                      <MdLocationPin /> ទីតាំងរបស់អ្នក{" "}
                      {
                        <SyncOutlined
                          className={`${loading
                            ? " opacity-100 transition-opacity duration-500"
                            : "opacity-0 transition-opacity duration-500"
                            }`}
                          spin
                        />
                      }
                    </button>
                    <textarea
                      onChange={(e) => {
                        const location = e.target.value.split(",");
                        console.log(location);

                        setLocation({
                          latitude: location[0],
                          longitude: location[1],
                        });
                        setOrders((prev) => {
                          const results = {
                            ...prev,
                            order_address: e.target.value,
                          };
                          localStorage.setItem(
                            "orderItems",
                            JSON.stringify(results)
                          );
                          return results;
                        });
                      }}
                      value={orders?.order_address || ""}
                      className="textarea bg-transparent border-gray-400 text-gray-800 h-24"
                      placeholder="address"
                    ></textarea>
                    <div className="label text-gray-400">Optional</div>
                  </fieldset>

                  <iframe
                    src={`https://www.google.com/maps?q=${location.latitude} ,${location.longitude}&hl=es;z=14&output=embed`}
                    width="100%"
                    height="200"
                    // style="border:0;"
                    // allowfullscreen=""
                    loading="lazy"
                  // referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>

                  <div className="text-black flex items-center justify-between gap-4">
                    <h1 className="font-bold">សរុប</h1>
                    <h1 className="font-bold">
                      ${currencyFormat(orders?.order_total)} <br />៛
                      {currencyFormat(
                        orders?.order_total * exchangeRate?.data?.usd_to_khr
                      )}
                    </h1>
                  </div>

                  <button className="btn btn-info mt-4" onClick={handleSubmit}>
                    Pay Now
                  </button>
                </fieldset>
              </nav>
            </Drawer>
          </nav>
        </article>
      </section>
    </motion.div>
  );
};

export default Sales;
