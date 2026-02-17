import React from 'react';
import {
    AreaChart,
    Area,
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
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xl">
                <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold text-slate-600 uppercase">{entry.name}:</span>
                            <span className="text-sm font-black text-slate-900">₹{entry.value.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const RevenueChart = ({ data }) => {
    return (
        <div className="w-full">
            <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-lg shadow-amber-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
                </div>
            </div>

            <div className="h-[300px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="collected"
                            name="Collected"
                            stroke="#10b981"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorCollected)"
                        />
                        <Area
                            type="monotone"
                            dataKey="pending"
                            name="Pending"
                            stroke="#f59e0b"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorPending)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
