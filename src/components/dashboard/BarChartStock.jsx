'use client';

import React, { useContext, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { stockChartContext } from './Analysis';

// const data = [
//     {
//         name: 'Page A',
//         uv: 4000,
//         pv: 2400,
//         amt: 2400,
//     },
//     {
//         name: 'Page B',
//         uv: 3000,
//         pv: 1398,
//         amt: 2210,
//     },
//     {
//         name: 'Page C',
//         uv: 2000,
//         pv: 9800,
//         amt: 2290,
//     },
//     {
//         name: 'Page D',
//         uv: 2780,
//         pv: 3908,
//         amt: 2000,
//     },
//     {
//         name: 'Page E',
//         uv: 1890,
//         pv: 4800,
//         amt: 2181,
//     },
//     {
//         name: 'Page F',
//         uv: 2390,
//         pv: 3800,
//         amt: 2500,
//     },
//     {
//         name: 'Page G',
//         uv: 3490,
//         pv: 4300,
//         amt: 2100,
//     },
// ];

const getIntroOfPage = (label) => {
    if (label === 'Page A') {
        return "Page A is about men's clothing";
    }
    if (label === 'Page B') {
        return "Page B is about women's dress";
    }
    if (label === 'Page C') {
        return "Page C is about women's bag";
    }
    if (label === 'Page D') {
        return 'Page D is about household goods';
    }
    if (label === 'Page E') {
        return 'Page E is about food';
    }
    if (label === 'Page F') {
        return 'Page F is about baby food';
    }
    return '';
};

const CustomTooltip = ({ active, payload, label }) => {

    const isVisible = active && payload && payload.length;
    return (
        <div className="custom-tooltip bg-stone-100 p-2" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>
            {isVisible && (
                <>
                    <p className="desc">Quantity of Stock in {label}</p>
                    <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p> <br />
                    <p className="label">{`${payload[1].name} : ${payload[1].value}`}</p> <br />
                    <p className="label">{`${payload[2].name} : ${payload[2].value}`}</p> <br />
                    <p className="label">{`${payload[3].name} : ${payload[3].value}`}</p> <br />
                    <p className="label">{`${payload[4].name} : ${payload[4].value}`}</p> <br />
                    <p className="intro">{getIntroOfPage(label)}</p>
                </>
            )}
        </div>
    );
};

const BarChartStock = () => {
    const { apiData } = useContext(stockChartContext);
    const [data, setData] = useState([]);
    useEffect(() => {
        if (apiData) {
            setData(apiData?.data?.month || []);
        }
    }, [apiData])
    return (
        <ResponsiveContainer width="100%" height="100%" className='text-xs'>
            <BarChart
                width={'100%'}
                height={'100%'}
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <defs>
                    <linearGradient id="gradient-pv" x1="100%" y1="0%" x2="100%" y2="100%">
                        <stop offset="5%" stopColor="#f884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f8f4f8" stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0 3" />
                <XAxis stroke='0' dataKey="name" />
                <YAxis stroke='0' />
                <Tooltip content={CustomTooltip} />
                <Legend />
                <Bar dataKey="return" barSize={20} fill="url(#gradient-pv)" />
                <Bar dataKey="in" barSize={20} fill="#8884d8" />
                <Bar dataKey="out" barSize={20} fill="#88f4d8" />
                <Bar dataKey="sale" barSize={20} fill="#9f54d8" />
                <Bar dataKey="waste" barSize={20} fill="#88dfd8" />
            </BarChart>
        </ResponsiveContainer >

    );
};

export default BarChartStock;
