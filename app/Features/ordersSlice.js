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
      query: ({token, limit, page, search='', category_id='', brand_id=''}) => queryData(`/order_masters?limit=${limit}&page=${page}&category_id=${category_id}&brand_id=${brand_id}&search=${search}`, token),
    }),

    getOrderInvoice: builder.query({
      query: ({ token, limit = 10, page = 1, search = "", created_by = "", customer_id = "", item_for = "", start_date = "", end_date = "" }) => {
        const params = new URLSearchParams({
          limit: String(limit),
          page: String(page),
          search: search ?? "",
        });

        if (created_by !== "" && created_by !== null && created_by !== undefined) {
          params.append("created_by", String(created_by));
        }

        if (customer_id !== "" && customer_id !== null && customer_id !== undefined) {
          params.append("customer_id", String(customer_id));
        }

        if (item_for !== "" && item_for !== null && item_for !== undefined) {
          params.append("item_for", String(item_for));
        }

        if (start_date) {
          params.append("start_date", start_date);
        }

        if (end_date) {
          params.append("end_date", end_date);
        }

        return queryData(`/order_invoices?${params.toString()}`, token);
      },
    }),
    getAllOrderTransection: builder.query({
      query: ({ token, limit, page, search }) => queryData(`/order_transection?limit=${limit}&page=${page}&search=${search}`, token),
    }),
    getAllDeliveryTracking: builder.query({
      query: ({ token, limit = 10, page = 1, search = "", deliver_id = "", user_id = "" }) => {
        const params = new URLSearchParams({
          limit: String(limit),
          page: String(page),
          search: search ?? "",
        });

        if (deliver_id !== "" && deliver_id !== null && deliver_id !== undefined) {
          params.append("deliver_id", String(deliver_id));
        }

        if (user_id !== "" && user_id !== null && user_id !== undefined) {
          params.append("user_id", String(user_id));
        }

        return queryData(`/delivery_tracking?${params.toString()}`, token);
      },
    }),
    getOrderByUser: builder.query({
      query: ({ id, token }) => queryData(`/order_by_user/${id}`, token),
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
  useGetAllOrderTransectionQuery,
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
  useGetAllDeliveryTrackingQuery,
  useGetOrderInvoiceQuery,
} = ordersApi;
