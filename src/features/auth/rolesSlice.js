import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "@/app/api";
import { url } from "@/app/api";
export const rolesApi = createApi({
  reducerPath: "roles",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  tagTypes: ["Roles"],
  endpoints: (builder) => ({
    getAllRole: builder.query({
      query: (token) => queryData("/roles", token),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, role_id }) => ({ type: "Roles", id: id || role_id })),
              { type: "Roles", id: "LIST" },
            ]
          : [{ type: "Roles", id: "LIST" }],
    }),
    getRoleById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/roles", token),
      providesTags: (result, error, { id }) => [{ type: "Roles", id }],
    }),
    createRole: builder.mutation({
      query: ({ itemData, token }) => createData(itemData, "/roles", token),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    updateRole: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/roles", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Roles", id },
        { type: "Roles", id: "LIST" },
      ],
    }),
    deleteRole: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/roles", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Roles", id },
        { type: "Roles", id: "LIST" },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          rolesApi.util.updateQueryData("getAllRole", undefined, (draft) => {
            if (draft?.data) {
              draft.data = draft.data.filter(
                (item) => String(item.id || item.role_id) !== String(id)
              );
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
