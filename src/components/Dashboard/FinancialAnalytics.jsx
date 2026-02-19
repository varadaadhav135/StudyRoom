import React from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-2xl border border-slate-200">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 mt-1">
                        <span className="text-xs font-bold" style={{ color: entry.color }}>{entry.name}</span>
                        <span className="text-sm font-black text-slate-900">₹{entry.value.toLocaleString('en-IN')}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const FinancialAnalytics = ({ data, currentMonthStats }) => {
    // Calculate collection rate
    const totalExpected = currentMonthStats?.totalCollected + currentMonthStats?.totalPending || 0;
    const collectionRate = totalExpected > 0 ? ((currentMonthStats?.totalCollected / totalExpected) * 100).toFixed(1) : 0;

    // Prepare pie chart data
    const statusData = [
        { name: 'Collected', value: currentMonthStats?.totalCollected || 0, color: '#2E1065' },
        { name: 'Pending', value: currentMonthStats?.totalPending || 0, color: '#C5A021' },
    ];

    // Calculate trend (comparing last 2 months)
    const lastMonthCollected = data[data.length - 2]?.collected || 0;
    const currentMonthCollected = data[data.length - 1]?.collected || 0;
    const trend = lastMonthCollected > 0
        ? (((currentMonthCollected - lastMonthCollected) / lastMonthCollected) * 100).toFixed(1)
        : 0;

    return (
        <div className="w-full">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Collection Rate */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-6 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Collection Rate</span>
                        <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-4xl font-black text-emerald-600">{collectionRate}%</div>
                    <p className="text-xs text-emerald-600 font-bold mt-2">Of expected revenue collected</p>
                </div>

                {/* Monthly Trend */}
                <div className={`bg-gradient-to-br ${trend >= 0 ? 'from-blue-50 to-blue-100/30' : 'from-red-50 to-red-100/30'} p-6 rounded-2xl border ${trend >= 0 ? 'border-blue-200' : 'border-red-200'} shadow-sm`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black ${trend >= 0 ? 'text-blue-700' : 'text-red-700'} uppercase tracking-widest`}>Growth Trend</span>
                        <span className="text-2xl">{trend >= 0 ? '📈' : '📉'}</span>
                    </div>
                    <div className={`text-4xl font-black ${trend >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </div>
                    <p className={`text-xs ${trend >= 0 ? 'text-blue-600' : 'text-red-600'} font-bold mt-2`}>
                        vs. last month
                    </p>
                </div>

                {/* Total Expected */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-6 rounded-2xl border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Expected Revenue</span>
                        <span className="text-2xl">🎯</span>
                    </div>
                    <div className="text-4xl font-black text-amber-600">₹{totalExpected.toLocaleString('en-IN')}</div>
                    <p className="text-xs text-amber-600 font-bold mt-2">This month's target</p>
                </div>
            </div>

            {/* Charts removed per user request (task h) */}
        </div>
    );
};

export default FinancialAnalytics;
