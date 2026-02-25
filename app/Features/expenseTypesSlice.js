import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const expenseTypesApi = createApi({
    reducerPath: 'expenseTypes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllExpanseTypes: builder.query({
            query: (token) => queryData('/expense_types', token),
        }),
        getExpanseTypeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/expense_types', token),
        }),
        createExpanseType: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/expense_types', token),
        }),
        updateExpanseType: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/expense_types', token),
        }),
        deleteExpanseType: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/expense_types', token),
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