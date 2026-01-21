import React, { useEffect, useState } from 'react';
import { Avatar, Button, Empty, List, Skeleton, Tag } from 'antd';
import { useGetAllOrderOnlineQuery } from '../../../app/Features/notificationSlice';
import { useNavigate } from 'react-router';
import { useViewOrderMutation } from '../../../app/Features/ordersSlice';
const OrderOnline = () => {
    const token = localStorage.getItem('token');
    // const [loading, setLoading] = useState(false);
    const navigator = useNavigate();
    const [data, setData] = useState([]);
    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);
    const { data: dataOrderOnline, refetch, isLoading } = useGetAllOrderOnlineQuery(token);
    const [viewOrder] = useViewOrderMutation();
    useEffect(() => {
        const addLoading = dataOrderOnline?.data?.map(item => ({ ...item, items: item.items.map(i => ({ ...i, loading: false })) })) || [];
        setData(addLoading || []);
        setList(addLoading);
    }, [dataOrderOnline?.data]);
    const timeSince = (date) => {
        const diff = (new Date() - new Date(date)) / 1000;
        if (diff < 60) return `${Math.floor(diff)} second ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minute ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
        return `${Math.floor(diff / 86400)} day ago`;
    };

    if (!isLoading && data?.length == 0) {
        return <Empty />
    }



    return (
        <List
            className={`demo-loadmore-list `}
            loading={isLoading}
            itemLayout="horizontal"
            // loadMore={loadMore}
            dataSource={list}
            renderItem={item => (
                <List.Item
                    className={`${item?.status == 1 ? 'bg-gray-300 !text-white' : ''}`}
                    actions={[
                        // <a key="list-loadmore-edit" >edit</a>,
                        // <Tag color={item?.status == 2 ? "warning" : "success"}>{item?.status == 1 ? "new" : "please check it"}</Tag>,
                        // <a key="list-loadmore-more"
                        //     onClick={async () => {
                        //         // setLoading(true);
                        //         await viewOrder({ id: item?.order_id, token });
                        //         refetch();
                        //         navigator('/dashboard/detail-notification/' + item?.order_id);
                        //     }}>receive order</a>,
                        <Button type="primary" loading={item?.loading}
                            onClick={async () => {
                                // if (item?.status == 2) {
                                //     item.loading = true;
                                //     setList([...list]);
                                //     await viewOrder({ id: item?.order_id, token });
                                //     refetch();
                                // }
                                // navigator('/dashboard/detail-notification/' + item?.order_id);
                                navigator('/dashboard/order-tracking');
                            }}>
                            Order Tracking
                        </Button>]}
                >
                    <Skeleton avatar title={false} loading={item?.items[0].loading} active>
                        <List.Item.Meta
                            avatar={<Avatar src={item?.items[0].item_image} />}
                            title={<a href="https://ant.design">{item?.order_tel}</a>}
                            description={<span className='text-xs'>{` Order at
                                ${timeSince(item?.order_date)}`}</span>}
                        />
                        <Tag variant='solid' color="success">{item?.items?.reduce((init, value) => init + Number(value.quantity || 0), 0)} quantity</Tag>
                    </Skeleton>
                </List.Item>
            )}
        />
    );
};
export default OrderOnline;