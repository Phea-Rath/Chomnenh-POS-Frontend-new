import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  queryData,
  queryDataById,
  createData,
  updateData,
  deleteData,
} from "@/app/api";
import { url } from "@/app/api";
export const expensesApi = createApi({
  reducerPath: "expenses",
  baseQuery: fetchBaseQuery({
    baseUrl: url,
  }),
  tagTypes: ["Expenses"],
  endpoints: (builder) => ({
    getAllExpanses: builder.query({
      query: (token) => queryData("/expense_masters", token),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id, expense_id }) => ({ type: "Expenses", id: id || expense_id })),
              { type: "Expenses", id: "LIST" },
            ]
          : [{ type: "Expenses", id: "LIST" }],
    }),
    getPopularExpanses: builder.query({
      query: (token) => queryData("/popular_expense", token),
      providesTags: [{ type: "Expenses", id: "LIST" }],
    }),
    getExpanseById: builder.query({
      query: ({ id, token }) => queryDataById(id, "/expense_masters", token),
      providesTags: (result, error, { id }) => [{ type: "Expenses", id }],
    }),
    createExpanse: builder.mutation({
      query: ({ itemData, token }) =>
        createData(itemData, "/expense_masters", token),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }],
    }),
    updateExpanse: builder.mutation({
      query: ({ id, itemData, token }) =>
        updateData(id, itemData, "/expense_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expenses", id },
        { type: "Expenses", id: "LIST" },
      ],
    }),
    deleteExpanse: builder.mutation({
      query: ({ id, token }) => deleteData(id, "/expense_masters", token),
      invalidatesTags: (result, error, { id }) => [
        { type: "Expenses", id },
        { type: "Expenses", id: "LIST" },
      ],
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          expensesApi.util.updateQueryData("getAllExpanses", undefined, (draft) => {
            if (draft?.data) {
              draft.data = draft.data.filter(
                (item) => String(item.id || item.expense_id) !== String(id)
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
  useGetAllExpansesQuery,
  useGetExpanseByIdQuery,
  useCreateExpanseMutation,
  useUpdateExpanseMutation,
  useDeleteExpanseMutation,
  useGetPopularExpansesQuery,
} = expensesApi;
