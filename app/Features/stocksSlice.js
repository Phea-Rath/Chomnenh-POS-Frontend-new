import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const stocksApi = createApi({
  reducerPath: "stocks",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllStock: builder.query({
      query: ({ limit, page, search, token }) => queryData(`/stock_masters?limit=${limit}&page=${page}&search=${search}`, token),
    }),
    getAllStockRaw: builder.query({
      query: ({ limit, page, search, token }) => queryData(`/stock-raw?limit=${limit}&page=${page}&search=${search}`, token),
    }),
    getPopularStock: builder.query({
      query: (token) => queryData("/popular_stock", token),
    }),
    getStockById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock_masters", token),
    }),
    getStockRawById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock-raw", token),
    }),
    getStockByOrderId: builder.query({
      query: ({ id, token }) => queryDataById(id, "/stock", token),
    }),
    createStock: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_masters", token),
    }),
    createStockRaw: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/stock_masters_raw", token),
    }),
    updateStock: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/stock_masters", token),
    }),
    updateStockRaw: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/stock_masters_raw", token),
    }),
    deleteStock: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/stock_masters", token),
    }),
    deleteStockRaw: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/stock_masters_raw", token),
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
} = stocksApi;
