import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "../api";
import { url } from "../api";
export const rolesApi = createApi({
  reducerPath: "roles",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  endpoints: (builder) => ({
    getAllRole: builder.query({
      query: (token) => queryData("/roles", token),
    }),
    getRoleById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/roles", token),
    }),
    createRole: builder.mutation({
      query: ({ itemData, token }) => createData(itemData, "/roles", token),
    }),
    updateRole: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/roles", token),
    }),
    deleteRole: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/roles", token),
    }),
  }),
});

export const {
  useGetAllRoleQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi;
