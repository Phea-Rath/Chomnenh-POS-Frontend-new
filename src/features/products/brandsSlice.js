import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const brandsApi = createApi({
    reducerPath: 'brands',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Brands'],
    endpoints: (builder) => ({
        getAllBrand: builder.query({
            query: (token) => queryData('/brands', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, brand_id }) => ({ type: 'Brands', id: id || brand_id })),
                          { type: 'Brands', id: 'LIST' },
                      ]
                    : [{ type: 'Brands', id: 'LIST' }],
        }),
        getBrandById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/brands', token),
            providesTags: (result, error, { id }) => [{ type: 'Brands', id }],
        }),
        createBrand: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/brands', token),
            invalidatesTags: [{ type: 'Brands', id: 'LIST' }],
        }),
        updateBrand: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/brands', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Brands', id },
                { type: 'Brands', id: 'LIST' },
            ],
        }),
        deleteBrand: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/brands', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Brands', id },
                { type: 'Brands', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    brandsApi.util.updateQueryData('getAllBrand', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter((item) => String(item.id || item.brand_id) !== String(id));
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
    useGetAllBrandQuery,
    useGetBrandByIdQuery,
    useCreateBrandMutation,
    useUpdateBrandMutation,
    useDeleteBrandMutation
} = brandsApi;