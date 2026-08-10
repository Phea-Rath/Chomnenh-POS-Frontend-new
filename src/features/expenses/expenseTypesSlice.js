import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const expenseTypesApi = createApi({
    reducerPath: 'expenseTypes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['ExpenseTypes'],
    endpoints: (builder) => ({
        getAllExpanseTypes: builder.query({
            query: (token) => queryData('/expense_types', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, expense_type_id }) => ({ type: 'ExpenseTypes', id: id || expense_type_id })),
                          { type: 'ExpenseTypes', id: 'LIST' },
                      ]
                    : [{ type: 'ExpenseTypes', id: 'LIST' }],
        }),
        getExpanseTypeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/expense_types', token),
            providesTags: (result, error, { id }) => [{ type: 'ExpenseTypes', id }],
        }),
        createExpanseType: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/expense_types', token),
            invalidatesTags: [{ type: 'ExpenseTypes', id: 'LIST' }],
        }),
        updateExpanseType: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/expense_types', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ExpenseTypes', id },
                { type: 'ExpenseTypes', id: 'LIST' },
            ],
        }),
        deleteExpanseType: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/expense_types', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'ExpenseTypes', id },
                { type: 'ExpenseTypes', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    expenseTypesApi.util.updateQueryData('getAllExpanseTypes', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter((item) => String(item.id || item.expense_type_id) !== String(id));
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
    useGetAllExpanseTypesQuery,
    useGetExpanseTypeByIdQuery,
    useCreateExpanseTypeMutation,
    useUpdateExpanseTypeMutation,
    useDeleteExpanseTypeMutation
} = expenseTypesApi; 