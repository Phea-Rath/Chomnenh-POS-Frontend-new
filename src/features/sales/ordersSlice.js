import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
  cancelData,
  uncancelData,
} from "@/app/api";
import { url } from "@/app/api";
const normalizeParams = (arg) => {
  if (typeof arg === "string") {
    return { token: arg, limit: "", page: "", search: "", category_id: "", brand_id: "" };
  }
  if (arg && typeof arg === "object") {
    return {
      token: arg.token || "",
      limit: arg.limit ?? "",
      page: arg.page ?? "",
      search: typeof arg.search === "string" ? arg.search : "",
      category_id: arg.category_id ?? "",
      brand_id: arg.brand_id ?? "",
      created_by: arg.created_by ?? "",
      customer_id: arg.customer_id ?? "",
      item_for: arg.item_for ?? "",
      start_date: arg.start_date ?? "",
      end_date: arg.end_date ?? "",
      deliver_id: arg.deliver_id ?? "",
      user_id: arg.user_id ?? "",
      filter: typeof arg.filter === "string" ? arg.filter : "price",
    };
  }
  return { token: "", limit: "", page: "", search: "", category_id: "", brand_id: "" };
};

export const ordersApi = createApi({
  reducerPath: "orders",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    getAllOrder: builder.query({
      query: (arg) => {
        const { token, limit, page, search, category_id, brand_id } = normalizeParams(arg);
        const params = new URLSearchParams();
        if (limit !== undefined && limit !== null && limit !== "") params.append("limit", limit);
        if (page !== undefined && page !== null && page !== "") params.append("page", page);
        if (category_id) params.append("category_id", category_id);
        if (brand_id) params.append("brand_id", brand_id);
        if (search) params.append("search", search);
        const queryString = params.toString();
        return queryData(`/order_masters${queryString ? `?${queryString}` : ""}`, token);
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, order_id }) => ({ type: "Orders", id: id || order_id })),
              { type: "Orders", id: "LIST" },
            ]
          : [{ type: "Orders", id: "LIST" }],
    }),

    getOrderInvoice: builder.query({
      query: (arg) => {
        const { token, limit, page, search, created_by, customer_id, item_for, start_date, end_date } = normalizeParams(arg);
        const params = new URLSearchParams();
        if (limit !== undefined && limit !== null && limit !== "") params.append("limit", String(limit));
        if (page !== undefined && page !== null && page !== "") params.append("page", String(page));
        if (search) params.append("search", search);

        if (created_by !== "" && created_by !== null && created_by !== undefined) {
          params.append("created_by", String(created_by));
        }
        if (customer_id !== "" && customer_id !== null && customer_id !== undefined) {
          params.append("customer_id", String(customer_id));
        }
        if (item_for !== "" && item_for !== null && item_for !== undefined) {
          params.append("item_for", String(item_for));
        }
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);

        const queryString = params.toString();
        return queryData(`/order_invoices${queryString ? `?${queryString}` : ""}`, token);
      },
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getAllOrderTransection: builder.query({
      query: (arg) => {
        const { token, limit, page, search } = normalizeParams(arg);
        const params = new URLSearchParams();
        if (limit !== undefined && limit !== null && limit !== "") params.append("limit", limit);
        if (page !== undefined && page !== null && page !== "") params.append("page", page);
        if (search) params.append("search", search);
        const queryString = params.toString();
        return queryData(`/order_transection${queryString ? `?${queryString}` : ""}`, token);
      },
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getAllDeliveryTracking: builder.query({
      query: (arg) => {
        const { token, limit, page, search, deliver_id, user_id } = normalizeParams(arg);
        const params = new URLSearchParams();
        if (limit !== undefined && limit !== null && limit !== "") params.append("limit", String(limit));
        if (page !== undefined && page !== null && page !== "") params.append("page", String(page));
        if (search) params.append("search", search);
        if (deliver_id !== "" && deliver_id !== null && deliver_id !== undefined) {
          params.append("deliver_id", String(deliver_id));
        }
        if (user_id !== "" && user_id !== null && user_id !== undefined) {
          params.append("user_id", String(user_id));
        }
        const queryString = params.toString();
        return queryData(`/delivery_tracking${queryString ? `?${queryString}` : ""}`, token);
      },
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getOrderByUser: builder.query({
      query: ({ id, token }) => queryData(`/order_by_user/${id}`, token),
      providesTags: (result, error, { id }) => [{ type: "Orders", id }],
    }),
    getPopularOrder: builder.query({
      query: (token) => queryData("/popular_sales", token),
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getPersentOrderMonthly: builder.query({
      query: (token) => queryData("/order_persent_montly", token),
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getMaxOrderId: builder.query({
      query: (token) => queryData("/orders/max-id", token),
    }),
    getOrderById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/order_masters", token),
      providesTags: (result, error, { id }) => [{ type: "Orders", id }],
    }),
    createOrder: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/order_masters", token),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
    updateOrder: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/order_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
    deleteOrder: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/order_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        let patchResult;
        if (queryArgs) {
          patchResult = dispatch(
            ordersApi.util.updateQueryData("getAllOrder", queryArgs, (draft) => {
              if (draft?.data) {
                draft.data = draft.data.filter(
                  (item) => String(item.id || item.order_id) !== String(id)
                );
                if (draft.pagination && typeof draft.pagination.total === "number") {
                  draft.pagination.total -= 1;
                }
              }
            })
          );
        }
        try {
          await queryFulfilled;
        } catch {
          if (patchResult) patchResult.undo();
        }
      },
    }),
    cancelOrder: builder.mutation({
      query: ({ id, token }) => cancelData(id, "/order_cancel", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
    uncancelOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/order_uncancel", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
    receiveOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/receive_order", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Orders", id },
        { type: "Orders", id: "LIST" },
      ],
    }),
    viewOrder: builder.mutation({
      query: ({ id, token }) => uncancelData(id, "/view_order", token),
    }),
    getTopSeller: builder.query({
      query: ({ token, filter = "price", start_date, end_date, user_id }) => {
        const params = new URLSearchParams({ filter });
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);
        if (user_id) params.append("user_id", user_id);
        return queryData(`/top-seller?${params.toString()}`, token);
      },
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
  })
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
  useGetTopSellerQuery,
} = ordersApi;
