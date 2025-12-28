import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { queryData, queryDataById, createData, updateData, deleteData } from '../api';
import { url } from '../api';
export const notificationsApi = createApi({
    reducerPath: 'notifications',
    baseQuery: fetchBaseQuery({
        baseUrl: url
    }),
    endpoints: (builder) => ({
        getAllOrderOnline: builder.query({
            query: (token) => queryData('/alert_order_online', token),
        }),
        getAllWaste: builder.query({
            query: (token) => queryData('/alert_stock_waste', token),
        }),

    }),
});

export const {
    useGetAllWasteQuery,
    useGetAllOrderOnlineQuery
} = notificationsApi;