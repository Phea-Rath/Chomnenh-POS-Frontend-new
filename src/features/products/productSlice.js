import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const productionsApi = createApi({
    reducerPath: 'productions',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Productions'],
    endpoints: (builder) => ({
        getAllProduction: builder.query({
            query: ({ token, limit = 12, page = 1, search }) => queryData(`/production?limit=${limit}&page=${page}&search=${search}`, token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, production_id }) => ({ type: 'Productions', id: id || production_id })),
                          { type: 'Productions', id: 'LIST' },
                      ]
                    : [{ type: 'Productions', id: 'LIST' }],
        }),
        getProductionById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/production', token),
            providesTags: (result, error, { id }) => [{ type: 'Productions', id }],
        }),
        createProduction: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/production', token),
            invalidatesTags: [{ type: 'Productions', id: 'LIST' }],
        }),
        updateProduction: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/production', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Productions', id },
                { type: 'Productions', id: 'LIST' },
            ],
        }),
        deleteProduction: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/production', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Productions', id },
                { type: 'Productions', id: 'LIST' },
            ],
            async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
                let patchResult;
                if (queryArgs) {
                    patchResult = dispatch(
                        productionsApi.util.updateQueryData('getAllProduction', queryArgs, (draft) => {
                            if (draft?.data) {
                                draft.data = draft.data.filter(
                                    (item) => String(item.id || item.production_id) !== String(id)
                                );
                                if (draft.pagination && typeof draft.pagination.total === "number") {
                                    draft.pagination.total -= 1;
                                }
                            }
                        })
                    );
                }
                try {
                    await queryFulfilled;
                } catch {
                    if (patchResult) patchResult.undo();
                }
            },
        }),
    }),
});

export const {
    useGetAllProductionQuery,
    useGetProductionByIdQuery,
    useCreateProductionMutation,
    useUpdateProductionMutation,
    useDeleteProductionMutation
} = productionsApi;