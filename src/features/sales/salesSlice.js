import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from "@/app/api";
import { url } from "@/app/api";
const normalizeParams = (arg) => {
    if (typeof arg === "string") {
        return { token: arg, limit: "", page: "", search: "", category_id: "", brand_id: "" };
    }
    if (arg && typeof arg === "object") {
        return {
            token: arg.token || "",
            limit: arg.limit ?? "",
            page: arg.page ?? "",
            search: typeof arg.search === "string" ? arg.search : "",
            category_id: arg.category_id ?? "",
            brand_id: arg.brand_id ?? "",
        };
    }
    return { token: "", limit: "", page: "", search: "", category_id: "", brand_id: "" };
};

export const salesApi = createApi({
    reducerPath: 'sales',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllSale: builder.query({
            query: (arg) => {
                const { token, limit, page, search, category_id, brand_id } = normalizeParams(arg);
                const params = new URLSearchParams();
                if (limit !== undefined && limit !== null && limit !== "") params.append("limit", limit);
                if (page !== undefined && page !== null && page !== "") params.append("page", page);
                if (category_id) params.append("category_id", category_id);
                if (brand_id) params.append("brand_id", brand_id);
                if (search) params.append("search", search);
                const queryString = params.toString();
                return queryData(`/sale-items${queryString ? `?${queryString}` : ""}`, token);
            },
        }),
        getSaleById: builder.query({
            query: ({ id, token }) => queryDataById(id, '/sale-items', token),
        }),
        createSale: builder.mutation({
            query: ({ itemData, token }) => createData(itemData, '/sale-items', token),
        }),
        updateSale: builder.mutation({
            query: ({ id, itemData, token }) => updateData(id, itemData, '/sale-items', token),
        }),
        deleteSale: builder.mutation({
            query: ({ id, token }) => deleteData(id, '/sale-items', token),
        }),
    }),
});

export const {
    useGetAllSaleQuery,
    useGetSaleByIdQuery,
    useCreateSaleMutation,
    useUpdateSaleMutation,
    useDeleteSaleMutation
} = salesApi;