import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
  updateDataByPost,
} from "../api";
import { url } from "../api";

export const customersApi = createApi({
  reducerPath: "customers",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllCustomer: builder.query({
      query: (token) => queryData("/customers", token),
    }),
    getCustomerById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/customers", token),
    }),
    createCustomer: builder.mutation({
      query: ({ itemData, token }) => createData(itemData, "/customers", token),
    }),
    updateCustomer: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateDataByPost(id, itemData, "/customers", token),
    }),
    deleteCustomer: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/customers", token),
    }),
  }),
});

export const {
  useGetAllCustomerQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
