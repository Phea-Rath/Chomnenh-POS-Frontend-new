import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData, updateDataByPost, queryDataNoToken } from "@/app/api";
import { url } from "@/app/api";
const normalizeParams = (arg) => {
    if (typeof arg === "string") {
        return { token: arg, limit: 12, page: 1, search: "", category_id: 0, brand_id: 0, filter: "all", supplier_id: 0 };
    }
    if (arg && typeof arg === "object") {
        return {
            token: arg.token || "",
            limit: arg.limit ?? 12,
            page: arg.page ?? 1,
            search: typeof arg.search === "string" ? arg.search : "",
            category_id: arg.category_id ?? 0,
            brand_id: arg.brand_id ?? 0,
            filter: typeof arg.filter === "string" ? arg.filter : "all",
            supplier_id: arg.supplier_id ?? 0,
            profile_id: arg.profile_id ?? "",
            price_range: arg.price_range ?? "",
            is_discounted: arg.is_discounted ?? "",
        };
    }
    return { token: "", limit: 12, page: 1, search: "", category_id: 0, brand_id: 0, filter: "all", supplier_id: 0 };
};

export const itemsApi = createApi({
    reducerPath: 'items',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    tagTypes: ['Items'],
    endpoints: (builder) => ({
        getAllItems: builder.query({
            query: (arg) => {
                const { token, limit, page, search, category_id, brand_id, filter, supplier_id } = normalizeParams(arg);
                const params = new URLSearchParams({
                    limit: String(limit),
                    page: String(page),
                    search: search ?? "",
                    category_id: String(category_id),
                    brand_id: String(brand_id),
                    filter: String(filter),
                    supplier_id: String(supplier_id),
                });
                return queryData(`/items?${params.toString()}`, token);
            },
            providesTags: (result) =>
                result?.data
                    ? [
                          ...result.data.map(({ id }) => ({ type: 'Items', id })),
                          { type: 'Items', id: 'LIST' },
                      ]
                    : [{ type: 'Items', id: 'LIST' }],
        }),
        getAllItemsForMarketPlace: builder.query({
            query: (arg = {}) => {
                const { limit, page, search, category_id, brand_id, profile_id, price_range, is_discounted } = normalizeParams(arg);
                const params = new URLSearchParams({
                    limit: String(limit),
                    page: String(page),
                    search: search ?? "",
                    category_id: String(category_id),
                    brand_id: String(brand_id),
                    profile_id: String(profile_id),
                    price_range: String(price_range),
                    is_discounted: String(is_discounted),
                });
                return queryDataNoToken(`/sale-item-marketplace?${params.toString()}`);
            },
            providesTags: [{ type: 'Items', id: 'LIST' }],
        }),
        getItemMarketPlaceById: builder.query({
            query: ({ id }) => queryDataNoToken(`/item-marketplace/${id}`),
            providesTags: (result, error, id) => [{ type: 'Items', id }],
        }),
        getAllItemInStock: builder.query({
            query: (token) => queryData('/item_in_stock', typeof token === 'string' ? token : token?.token),
            providesTags: [{ type: 'Items', id: 'LIST' }],
        }),
        getItemsByStock: builder.query({
            query: (arg) => {
                const { token, limit, page, search } = normalizeParams(arg);
                const params = new URLSearchParams({
                    limit: String(limit),
                    page: String(page),
                    search: search ?? "",
                });
                return queryData(`/item_by_stock?${params.toString()}`, token);
            },
            providesTags: [{ type: 'Items', id: 'LIST' }],
        }),
        getItemById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/items', token),
            providesTags: (result, error, { id }) => [{ type: 'Items', id }],
        }),
        createItem: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/items', token),
            invalidatesTags: [{ type: 'Items', id: 'LIST' }],
        }),
        updateItem: builder.mutation({
            query: ({ id, itemData, token }) => updateDataByPost(id, itemData, '/items', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Items', id },
                { type: 'Items', id: 'LIST' },
            ],
        }),
        deleteItem: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/items', token),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Items', id },
                { type: 'Items', id: 'LIST' },
            ],
            async onQueryStarted({ id, queryArgs }, { dispatch, queryFulfilled }) {
                let patchResult;
                if (queryArgs) {
                    patchResult = dispatch(
                        itemsApi.util.updateQueryData('getAllItems', queryArgs, (draft) => {
                            if (draft?.data) {
                                draft.data = draft.data.filter((item) => String(item.id) !== String(id));
                                if (draft.pagination && typeof draft.pagination.total === 'number') {
                                    draft.pagination.total -= 1;
                                }
                            }
                        })
                    );
                }
                try {
                    await queryFulfilled;
                } catch {
                    if (patchResult) {
                        patchResult.undo();
                    }
                }
            },
        }),
        getTopItems: builder.query({
            query: ({operation = 'sale', token, filter = 'price', limit = 5, start_date, end_date, user_id}) => {
                const params = new URLSearchParams({ operation, filter, limit: String(limit) });
                if (start_date) params.append("start_date", start_date);
                if (end_date) params.append("end_date", end_date);
                if (user_id) params.append("user_id", user_id);
                return queryData(`/top-items?${params.toString()}`, token);
            },
            providesTags: [{ type: 'Items', id: 'LIST' }],
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
    useGetTopItemsQuery,

} = itemsApi;