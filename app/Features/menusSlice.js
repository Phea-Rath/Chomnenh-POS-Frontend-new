import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData, updateDataByPost } from '../api';
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
            query: ({ id, itemData, token }) => updateDataByPost(id, itemData, '/menus', token),
        }),
        deleteMenu: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/menus', token),
        }),
        getCurrentMenus: builder.query({
            query:({token})=> queryData('/menusByCurrentUser', token),
        }),
        getCurrentMenusWebsite: builder.query({
            query:({token})=> queryData('/menu-website-current-user', token),
        }),
        getCurrentMenusByUserWebsite: builder.query({
            query:({id, token})=> queryDataById(id, '/menu-website-by-user', token),
        })
    }),
});

export const {
    useGetAllMenuQuery,
    useGetMenuByIdQuery,
    useCreateMenuMutation,
    useUpdateMenuMutation,
    useDeleteMenuMutation,
    useGetCurrentMenusQuery,
    useGetCurrentMenusWebsiteQuery,
    useGetCurrentMenusByUserWebsiteQuery
} = menusApi;