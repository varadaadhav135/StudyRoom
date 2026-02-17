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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart - 6 Month Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">6-Month Revenue Trend</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Monthly collection vs pending fees</p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="collectedBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2E1065" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#2E1065" stopOpacity={0.6} />
                                </linearGradient>
                                <linearGradient id="pendingBar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#C5A021" stopOpacity={0.9} />
                                    <stop offset="100%" stopColor="#C5A021" stopOpacity={0.6} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Legend
                                wrapperStyle={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    paddingTop: '20px'
                                }}
                            />
                            <Bar
                                dataKey="collected"
                                name="Collected"
                                fill="url(#collectedBar)"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={60}
                            />
                            <Bar
                                dataKey="pending"
                                name="Pending"
                                fill="url(#pendingBar)"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={60}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart - Current Month Status */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Current Month</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Payment Status Breakdown</p>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-3">
                        {statusData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-wide">{item.name}</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">₹{item.value.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialAnalytics;
