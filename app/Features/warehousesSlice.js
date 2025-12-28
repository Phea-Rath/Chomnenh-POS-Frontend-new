import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const warehousesApi = createApi({
    reducerPath: 'warehouses',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllWarehouses: builder.query({
            query: (token) => queryData('/warehouses', token),
        }),
        getWarehouseById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/warehouses', token),
        }),
        createWarehouse: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/warehouses', token),
        }),
        updateWarehouse: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/warehouses', token),
        }),
        deleteWarehouse: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/warehouses', token),
        }),
    }),
});

export const {
    useGetAllWarehousesQuery,
    useGetWarehouseByIdQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation
} = warehousesApi;