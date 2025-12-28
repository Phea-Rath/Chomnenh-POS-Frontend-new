import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const categoryApi = createApi({
    reducerPath: 'categories',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllCategories: builder.query({
            query: (token) => queryData('/categorys', token),
        }),
        getCategoryById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/categorys', token),
        }),
        createCategory: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/categorys', token),
        }),
        updateCategory: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/categorys', token),
        }),
        deleteCategory: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/categorys', token),
        }),
    }),
})

export const {
    useGetAllCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} = categoryApi;