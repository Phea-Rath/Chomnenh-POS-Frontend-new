import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const brandsApi = createApi({
    reducerPath: 'brands',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllBrand: builder.query({
            query: (token) => queryData('/brands', token),
        }),
        getBrandById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/brands', token),
        }),
        createBrand: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/brands', token),
        }),
        updateBrand: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/brands', token),
        }),
        deleteBrand: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/brands', token),
        }),
    }),
});

export const {
    useGetAllBrandQuery,
    useGetBrandByIdQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation
} = brandsApi;