import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseUrl from "@/services/baseUrl";

const API_URL = `${baseUrl}/api`;

const queryData = (path, token) => ({
  url: `${path}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const queryDataById = (id, path, token) => ({
  url: `${path}/${id}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const createData = (itemData, path, token) => ({
  url: `${path}`,
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: itemData
});

const updateData = (id, itemData, path, token) => ({
  url: `${path}/${id}`,
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: itemData
});

const deleteData = (id, path, token) => ({
  url: `${path}/${id}`,
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

export const stocksApi = createApi({
  reducerPath: "stocks",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Stocks"],
  endpoints: (builder) => ({
    getAllStock: builder.query({
      query: ({ limit, page, search, token }) => queryData(`/stock_masters?limit=${limit}&page=${page}&search=${search}`, token),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, stock_id }) => ({ type: "Stocks", id: id || stock_id })),
              { type: "Stocks", id: "LIST" },
            ]
          : [{ type: "Stocks", id: "LIST" }],
    }),
    getAllStockRaw: builder.query({
      query: ({ limit, page, search, token }) => queryData(`/stock-raw?limit=${limit}&page=${page}&search=${search}`, token),
      providesTags: [{ type: "Stocks", id: "LIST" }],
    }),
    getPopularStock: builder.query({
      query: (token) => queryData("/popular_stock", token),
      providesTags: [{ type: "Stocks", id: "LIST" }],
    }),
    getStockById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock_masters", token),
      providesTags: (result, error, { id }) => [{ type: "Stocks", id }],
    }),
    getStockRawById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock-raw", token),
      providesTags: (result, error, { id }) => [{ type: "Stocks", id }],
    }),
    getStockByOrderId: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock", token),
      providesTags: [{ type: "Stocks", id: "LIST" }],
    }),
    createStock: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_masters", token),
      invalidatesTags: [{ type: "Stocks", id: "LIST" }],
    }),
    createStockRaw: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_masters_raw", token),
      invalidatesTags: [{ type: "Stocks", id: "LIST" }],
    }),
    updateStock: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/stock_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Stocks", id },
        { type: "Stocks", id: "LIST" },
      ],
    }),
    updateStockRaw: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/stock_masters_raw", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Stocks", id },
        { type: "Stocks", id: "LIST" },
      ],
    }),
    deleteStock: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/stock_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Stocks", id },
        { type: "Stocks", id: "LIST" },
      ],
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        let patchResult;
        if (queryArgs) {
          patchResult = dispatch(
            stocksApi.util.updateQueryData("getAllStock", queryArgs, (draft) => {
              if (draft?.data) {
                draft.data = draft.data.filter(
                  (item) => String(item.id || item.stock_id) !== String(id)
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
    deleteStockRaw: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/stock_masters_raw", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Stocks", id },
        { type: "Stocks", id: "LIST" },
      ],
      async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
        let patchResult;
        if (queryArgs) {
          patchResult = dispatch(
            stocksApi.util.updateQueryData("getAllStockRaw", queryArgs, (draft) => {
              if (draft?.data) {
                draft.data = draft.data.filter(
                  (item) => String(item.id || item.stock_id) !== String(id)
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
    getStockFilter: builder.query({
      query: ({ type, item_id, warehouse_id, token }) =>
        queryData(
          `/stock_filter?type=${type || "all"}&item_id=${item_id || ""}&warehouse_id=${warehouse_id || ""}`,
          token
        ),
      providesTags: [{ type: "Stocks", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllStockQuery,
  useGetAllStockRawQuery,
  useGetStockByIdQuery,
  useCreateStockMutation,
  useCreateStockRawMutation,
  useUpdateStockMutation,
  useUpdateStockRawMutation,
  useDeleteStockMutation,
  useDeleteStockRawMutation,
  useGetStockByOrderIdQuery,
  useGetPopularStockQuery,
  useGetStockRawByIdQuery,
  useGetStockFilterQuery,
} = stocksApi;

export default stocksApi;
