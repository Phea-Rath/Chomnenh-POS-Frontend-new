import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const sizesApi = createApi({
    reducerPath: 'sizes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllSizes: builder.query({
            query: (token) => queryData('/sizes', token),
        }),
        getSizeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/sizes', token),
        }),
        createSize: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/sizes', token),
        }),
        updateSize: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/sizes', token),
        }),
        deleteSize: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/sizes', token),
        }),
    }),
});

export const {
    useGetAllSizesQuery,
    useGetSizeByIdQuery,
    useCreateSizeMutation,
    useUpdateSizeMutation,
    useDeleteSizeMutation
} = sizesApi;