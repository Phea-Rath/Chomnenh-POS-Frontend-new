import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const stockTypesApi = createApi({
    reducerPath: 'stockTypes',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['StockTypes'],
    endpoints: (builder) => ({
        getAllStockTypes: builder.query({
            query: (token) => queryData('/stock_types', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, stock_type_id }) => ({ type: 'StockTypes', id: id || stock_type_id })),
                          { type: 'StockTypes', id: 'LIST' },
                      ]
                    : [{ type: 'StockTypes', id: 'LIST' }],
        }),
        getStockTypeById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/stock_types', token),
            providesTags: (result, error, { id }) => [{ type: 'StockTypes', id }],
        }),
        createStockType: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/stock_types', token),
            invalidatesTags: [{ type: 'StockTypes', id: 'LIST' }],
        }),
        updateStockType: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/stock_types', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'StockTypes', id },
                { type: 'StockTypes', id: 'LIST' },
            ],
        }),
        deleteStockType: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/stock_types', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'StockTypes', id },
                { type: 'StockTypes', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    stockTypesApi.util.updateQueryData('getAllStockTypes', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter(
                                (item) => String(item.id || item.stock_type_id) !== String(id)
                            );
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
    useGetAllStockTypesQuery,
    useGetStockTypeByIdQuery,
    useCreateStockTypeMutation,
    useUpdateStockTypeMutation,
    useDeleteStockTypeMutation
} = stockTypesApi;