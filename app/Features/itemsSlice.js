import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData, updateDataByPost } from '../api';
import { url } from '../api';
export const itemsApi = createApi({
    reducerPath: 'items',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllItems: builder.query({
            query: ({ token, limit = 12, page = 1, search }) => queryData(`/items?limit=${limit}&page=${page}&search=${search}`, token),
        }),
        getAllItemInStock: builder.query({
            query: (token) => queryData('/item_in_stock', token),
        }),
        getItemsByStock: builder.query({
            query: (token) => queryData('/item_by_stock', token),
        }),
        getItemById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/items', token),
        }),
        createItem: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/items', token),
        }),
        updateItem: builder.mutation({
            query: ({ id, itemData, token }) => updateDataByPost(id, itemData, '/items', token),
        }),
        deleteItem: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/items', token),
        }),
    }),
});

export const {
    useGetAllItemsQuery,
    useGetItemByIdQuery,
    useGetItemsByStockQuery,
    useCreateItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
    useGetAllItemInStockQuery
} = itemsApi;