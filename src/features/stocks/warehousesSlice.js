import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
export const warehousesApi = createApi({
    reducerPath: 'warehouses',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Warehouses'],
    endpoints: (builder) => ({
        getAllWarehouses: builder.query({
            query: (token) => queryData('/warehouses', token),
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id, warehouse_id }) => ({ type: 'Warehouses', id: id || warehouse_id })),
                          { type: 'Warehouses', id: 'LIST' },
                      ]
                    : [{ type: 'Warehouses', id: 'LIST' }],
        }),
        getWarehouseById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/warehouses', token),
            providesTags: (result, error, { id }) => [{ type: 'Warehouses', id }],
        }),
        createWarehouse: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/warehouses', token),
            invalidatesTags: [{ type: 'Warehouses', id: 'LIST' }],
        }),
        updateWarehouse: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/warehouses', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Warehouses', id },
                { type: 'Warehouses', id: 'LIST' },
            ],
        }),
        deleteWarehouse: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/warehouses', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Warehouses', id },
                { type: 'Warehouses', id: 'LIST' },
            ],
            async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    warehousesApi.util.updateQueryData('getAllWarehouses', undefined, (draft) => {
                        if (draft?.data) {
                            draft.data = draft.data.filter(
                                (item) => String(item.id || item.warehouse_id) !== String(id)
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
    useGetAllWarehousesQuery,
    useGetWarehouseByIdQuery,
    useCreateWarehouseMutation,
    useUpdateWarehouseMutation,
    useDeleteWarehouseMutation
} = warehousesApi;