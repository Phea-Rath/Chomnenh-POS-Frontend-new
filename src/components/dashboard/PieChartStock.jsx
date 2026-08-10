import React, { useContext } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';
import { stockChartContext } from './Analysis';
import { useTranslation } from 'react-i18next';

const COLORS = ['#30AFFF', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

const RenderActiveShape = (props) => {
    const { t } = useTranslation();
    const {
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
    } = props;
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

    const getTranslationKey = (name) => {
        return name.split(' ').map((word, index) => 
            index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    };

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold dark:fill-gray-300">
                {t(getTranslationKey(payload.name))}
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
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="currentColor" className="text-gray-900 dark:text-gray-100 font-medium">
                {`${t("quantityCount")} ${value}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-gray-500 dark:text-gray-400">
                {`(${t("total")} ${(Number(payload?.total) ?? 1)})`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#999" className="text-gray-500 dark:text-gray-400">
                {`(${t("rate")} ${((percent ?? 1) * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

export default function PieChartStock() {
    const { apiData } = useContext(stockChartContext);
    const [data, setData] = React.useState([]);
    const { t } = useTranslation();

    const getTranslationKey = (name) => {
        return name.split(' ').map((word, index) => 
            index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
    };

    React.useEffect(() => {
        if (apiData) {
            setData([
                { name: 'Stock Return', value: Number(apiData?.data?.stock_return) || 0 },
                { name: 'In Stock', value: (Number(apiData?.data?.stock_in) - Number(apiData?.data?.stock_out) - Number(apiData?.data?.stock_sale) - Number(apiData?.data?.stock_waste) + Number(apiData?.data?.stock_return)) || 0 },
                { name: 'Stock Out', value: Number(apiData?.data?.stock_out) || 0 },
                { name: 'Stock Sale', value: Number(apiData?.data?.stock_sale) || 0 },
                { name: 'Stock Waste', value: Number(apiData?.data?.stock_waste) || 0 },
            ]);
        }
    }, [apiData]);

    return (
        <ResponsiveContainer width="100%" height="100%" className='text-xs'>
            <PieChart width={'100%'} height={'100%'}>
                <Legend 
                    formatter={(value) => <span className="text-gray-700 dark:text-gray-300 capitalize">{t(getTranslationKey(value))}</span>}
                />
                <Pie
                    activeShape={(props) => <RenderActiveShape {...props} />}
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
