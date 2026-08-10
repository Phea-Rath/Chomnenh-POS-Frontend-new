import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const categoryApi = createApi({
    reducerPath: 'categories',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Categories'],
    endpoints: (builder) => ({
        getAllCategories: builder.query({
            query: (token) => queryData('/categorys', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, category_id }) => ({ type: 'Categories', id: id || category_id })),
                          { type: 'Categories', id: 'LIST' },
                      ]
                    : [{ type: 'Categories', id: 'LIST' }],
        }),
        getCategoryById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/categorys', token),
            providesTags: (result, error, { id }) => [{ type: 'Categories', id }],
        }),
        createCategory: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/categorys', token),
            invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
        }),
        updateCategory: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/categorys', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Categories', id },
                { type: 'Categories', id: 'LIST' },
            ],
        }),
        deleteCategory: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/categorys', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Categories', id },
                { type: 'Categories', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    categoryApi.util.updateQueryData('getAllCategories', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter((item) => String(item.id || item.category_id) !== String(id));
                        }
                    })
                );
                try {
                    await queryFulfilled;
                } catch {
                    patchResult.undo();
                }
            },
        }),
    }),
});

export const {
    useGetAllCategoriesQuery,
    useGetCategoryByIdQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} = categoryApi;