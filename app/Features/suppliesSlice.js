import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const suppliersApi = createApi({
    reducerPath: 'suppliers',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllSupplier: builder.query({
            query: (token) => queryData('/suppliers', token),
        }),
        getSupplierById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/suppliers', token),
        }),
        createSupplier: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/suppliers', token),
        }),
        updateSupplier: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/suppliers', token),
        }),
        deleteSupplier: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/suppliers', token),
        }),
    }),
});

export const {
    useGetAllSupplierQuery,
    useGetSupplierByIdQuery,
    useCreateSupplierMutation,
    useUpdateSupplierMutation,
    useDeleteSupplierMutation
} = suppliersApi;