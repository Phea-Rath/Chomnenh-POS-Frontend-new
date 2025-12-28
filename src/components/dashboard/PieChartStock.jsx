import React, { useContext } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { useGetAllDashboardStockQuery } from '../../../app/Features/dashboardsSlice';
import { stockChartContext } from './Analysis';

const data = [
    { name: 'Group A', value: 400 },
    { name: 'Group B', value: 300 },
    { name: 'Group C', value: 300 },
    { name: 'Group D', value: 200 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9d8f42'];

const renderActiveShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
}) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * (midAngle ?? 1));
    const cos = Math.cos(-RADIAN * (midAngle ?? 1));
    const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos;
    const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin;
    const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos;
    const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';


    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={(outerRadius ?? 0) + 6}
                outerRadius={(outerRadius ?? 0) + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`ចំនួន ${value}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(សរុប ${(Number(payload?.total) ?? 1)})`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#999">
                {`(Rate ${((percent ?? 1) * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

export default function PieChartStock() {
    const { apiData } = useContext(stockChartContext);
    const [data, setData] = React.useState([]);
    React.useEffect(() => {
        if (apiData) {
            setData([
                // { name: 'Stock Return', value: Number(setdata?.data?.stock_return) || 0 },
                { name: 'In Stock', value: (Number(apiData?.data?.stock_in) + Number(apiData?.data?.stock_return)) - (Number(apiData?.data?.stock_out) + Number(apiData?.data?.stock_sale) + Number(apiData?.data?.stock_waste)) || 0 },
                { name: 'Stock Out', value: Number(apiData?.data?.stock_out) || 0 },
                { name: 'Stock Sale', value: Number(apiData?.data?.stock_sale) || 0 },
                { name: 'Stock Waste', value: Number(apiData?.data?.stock_waste) || 0 },
            ]);
        }
    }, [apiData]);
    return (
        <ResponsiveContainer width="100%" height="100%" className='text-xs'>
            <PieChart width={'100%'} height={'100%'}>
                <Legend />
                <Pie
                    activeShape={renderActiveShape}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]}
                            total={(Number(apiData?.data?.stock_in) + Number(apiData?.data?.stock_return))} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer >
    );
}
