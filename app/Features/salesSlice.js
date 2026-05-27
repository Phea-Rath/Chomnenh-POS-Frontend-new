import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const salesApi = createApi({
    reducerPath: 'sales',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllSale: builder.query({
            query: ({ token, limit, page, search, category_id = '', brand_id = '' }) => queryData(`/sale-items?limit=${limit}&page=${page}&search=${search}&category_id=${category_id}&brand_id=${brand_id}`, token),
        }),
        getSaleById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/sale-items', token),
        }),
        createSale: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/sale-items', token),
        }),
        updateSale: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/sale-items', token),
        }),
        deleteSale: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/sale-items', token),
        }),
    }),
});

export const {
    useGetAllSaleQuery,
    useGetSaleByIdQuery,
    useCreateSaleMutation,
    useUpdateSaleMutation,
    useDeleteSaleMutation
} = salesApi;