import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
  cancelData,
  uncancelData,
} from "../api";
import { url } from "../api";
export const ordersApi = createApi({
  reducerPath: "orders",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllOrder: builder.query({
      query: (token) => queryData("/order_masters", token),
    }),
    getOrderByUser: builder.query({
      query: (token) => queryData("/order_by_user", token),
    }),
    getPopularOrder: builder.query({
      query: (token) => queryData("/popular_sales", token),
    }),
    getPersentOrderMonthly: builder.query({
      query: (token) => queryData("/order_persent_montly", token),
    }),
    getMaxOrderId: builder.query({
      query: (token) => queryData("/orders/max-id", token),
    }),
    getOrderById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/order_masters", token),
    }),
    createOrder: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/order_masters", token),
    }),
    updateOrder: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/order_masters", token),
    }),
    deleteOrder: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/order_masters", token),
    }),
    cancelOrder: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/order_cancel", token),
    }),
    uncancelOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/order_uncancel", token),
    }),
    receiveOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/receive_order", token),
    }),
    viewOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/view_order", token),
    }),
  }),
});

export const {
  useGetAllOrderQuery,
  useGetOrderByIdQuery,
  useGetOrderByUserQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useCancelOrderMutation,
  useUncancelOrderMutation,
  useGetMaxOrderIdQuery,
  useReceiveOrderMutation,
  useViewOrderMutation,
  useGetPopularOrderQuery,
  useGetPersentOrderMonthlyQuery,
} = ordersApi;
