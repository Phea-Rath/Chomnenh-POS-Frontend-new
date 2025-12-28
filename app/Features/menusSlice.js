import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const menusApi = createApi({
    reducerPath: 'menus',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllMenu: builder.query({
            query: (token) => queryData('/menus', token),
        }),
        getMenuById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/menus', token),
        }),
        createMenu: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/menus', token),
        }),
        updateMenu: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/menus', token),
        }),
        deleteMenu: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/menus', token),
        }),
    }),
});

export const {
    useGetAllMenuQuery,
    useGetMenuByIdQuery,
    useCreateMenuMutation,
    useUpdateMenuMutation,
    useDeleteMenuMutation
} = menusApi;