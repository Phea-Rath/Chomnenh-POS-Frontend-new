import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const expanseTypesApi = createApi({
    reducerPath: 'expanseTypes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllExpanseTypes: builder.query({
            query: (token) => queryData('/expanse_types', token),
        }),
        getExpanseTypeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/expanse_types', token),
        }),
        createExpanseType: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/expanse_types', token),
        }),
        updateExpanseType: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/expanse_types', token),
        }),
        deleteExpanseType: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/expanse_types', token),
        }),
    }),
});

export const {
    useGetAllExpanseTypesQuery,
    useGetExpanseTypeByIdQuery,
    useCreateExpanseTypeMutation,
    useUpdateExpanseTypeMutation,
    useDeleteExpanseTypeMutation
} = expanseTypesApi; 