import React, { use, useEffect, useState } from 'react';
import { Avatar, Button, Empty, List, Skeleton, Tag } from 'antd';
import { useGetAllWasteQuery } from '../../../app/Features/notificationSlice';
import { useNavigate } from 'react-router';
const Waste = () => {
    const token = localStorage.getItem('token');
    const [loading, setLoading] = useState(false);
    const navigator = useNavigate();
    const [data, setData] = useState([]);
    const [daysDifference, setDaysDifference] = useState(0);
    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);
    const { data: dataWaste, refetch, isLoading, isError } = useGetAllWasteQuery(token);
    // const fetchData = currentPage => {
    //     const fakeDataUrl = `https://660d2bd96ddfa2943b33731c.mockapi.io/api/users?page=${currentPage}&limit=${PAGE_SIZE}`;
    //     return fetch(fakeDataUrl).then(res => res.json());
    // };
    useEffect(() => {
        setData(dataWaste?.data || []);
        setList(dataWaste?.data);
        // setList(dataWaste.data.concat(Array.from({ length: PAGE_SIZE }).map(() => ({ loading: true }))));

    }, [dataWaste?.data]);
    if (!isLoading && data?.length == 0) {
        return <Empty />
    }
    const timeSince = (date) => {
        const diff = (new Date() - new Date(date)) / 1000;
        if (diff < 60) return `${Math.floor(diff)} second ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minute ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hour ago`;
        return `${Math.floor(diff / 86400)} day ago`;
    };

    return (
        <List
            className="demo-loadmore-list"
            loading={isLoading}
            itemLayout="horizontal"
            // loadMore={loadMore}
            dataSource={list}
            renderItem={item => (
                <List.Item
                    actions={[
                        // <a key="list-loadmore-edit">edit</a>, 
                        <a key="list-loadmore-more" onClick={() => navigator('/dashboard/detail-waste/' + item.item_id)}>more</a>]}
                >
                    <Skeleton avatar title={false} loading={item.loading} active>
                        <List.Item.Meta
                            avatar={<Avatar src={item.item_image} />}
                            title={<a href="https://ant.design">{item.item_name}</a>}
                            description={<span className='text-xs'>{`This item, It wasted ${timeSince(item?.expire_date)}`}</span>}
                        />
                        <Tag bordered={false} color="magenta">{item.in_stock}</Tag>
                    </Skeleton>
                </List.Item>
            )}
        />
    );
};
export default Waste;