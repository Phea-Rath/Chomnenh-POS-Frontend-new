import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData, updateDataByPost, queryDataNoToken } from '../api';
import { url } from '../api';
export const itemsApi = createApi({
    reducerPath: 'items',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllItems: builder.query({
            query: ({ token, limit = 12, page = 1, search, category_id = 0, brand_id = 0 }) => queryData(`/items?limit=${limit}&page=${page}&search=${search}&category_id=${category_id}&brand_id=${brand_id}`, token),
        }),
        getAllItemsForMarketPlace: builder.query({
            query: ({ limit = 12, page = 1, search = '', category_id = '', brand_id = '', profile_id = '', price_range = '', is_discounted = '' }) => queryDataNoToken(`/sale-item-marketplace?limit=${limit}&page=${page}&search=${search}&category_id=${category_id}&brand_id=${brand_id}&profile_id=${profile_id}&price_range=${price_range}&is_discounted=${is_discounted}`),
        }),
        getItemMarketPlaceById: builder.query({
            query: ({ id }) => queryDataNoToken(`/item-marketplace/${id}`),
        }),
        getAllItemInStock: builder.query({
            query: (token) => queryData('/item_in_stock', token),
        }),
        getItemsByStock: builder.query({
            query: ({ token, limit = 12, page = 1, search }) => queryData(`/item_by_stock?limit=${limit}&page=${page}&search=${search}`, token),
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
    useGetAllItemInStockQuery,
    useGetAllItemsForMarketPlaceQuery,
    useGetItemMarketPlaceByIdQuery,

} = itemsApi;