import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const expansesApi = createApi({
  reducerPath: "expanses",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllExpanses: builder.query({
      query: (token) => queryData("/expanse_masters", token),
    }),
    getPopularExpanses: builder.query({
      query: (token) => queryData("/popular_expanse", token),
    }),
    getExpanseById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/expanse_masters", token),
    }),
    createExpanse: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/expanse_masters", token),
    }),
    updateExpanse: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/expanse_masters", token),
    }),
    deleteExpanse: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/expanse_masters", token),
    }),
  }),
});

export const {
  useGetAllExpansesQuery,
  useGetExpanseByIdQuery,
  useCreateExpanseMutation,
  useUpdateExpanseMutation,
  useDeleteExpanseMutation,
  useGetPopularExpansesQuery,
} = expansesApi;
