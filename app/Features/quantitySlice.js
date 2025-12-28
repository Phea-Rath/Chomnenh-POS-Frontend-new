import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const quanApi = createApi({
    reducerPath: 'quantity',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getQuanStock: builder.query({
            query: (token) => queryData('/quan_stock_by_attr', token),
        }),
        getQuanOrder: builder.query({
            query: (token) => queryData('/quan_order_by_attr', token),
        }),

    }),
});

export const {
    useGetQuanStockQuery,
    useGetQuanOrderQuery
} = quanApi;