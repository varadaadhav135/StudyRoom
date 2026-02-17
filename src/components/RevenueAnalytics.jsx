import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const RevenueAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [revenue, setRevenue] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [revenueRes, subsRes, paymentsRes] = await Promise.all([
                api.getRevenue(),
                api.getAllSubscriptions(),
                api.getPayments()
            ]);

            if (revenueRes.success) {
                setRevenue(revenueRes.revenue);
            }

            if (subsRes.success) {
                setSubscriptions(subsRes.subscriptions || []);
            }

            if (paymentsRes.success) {
                setPayments(paymentsRes.payments || []);
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            toast.error('Failed to load revenue data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner message="Calculating revenue..." />
            </div>
        );
    }

    // Calculate expiring soon count
    const expiringSoonCount = subscriptions.filter(s => s.status === 'expiring_soon').length;
    const expiredCount = subscriptions.filter(s => s.status === 'expired').length;

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Revenue Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-lg hover:shadow-gold-premium transition-all duration-500 reveal">
                    <div className="absolute top-[-10%] right-[-10%] p-6 text-9xl opacity-[0.03] text-emerald-500 group-hover:scale-110 transition-transform font-display">₹</div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">
                        Total Imperial Revenue
                    </p>
                    <h4 className="text-4xl font-black font-display text-slate-900 dark:text-white tracking-tightest">
                        ₹{revenue?.total?.toLocaleString('en-IN') || '0'}
                    </h4>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Vault Status: Secure
                    </div>
                </div>

                <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-lg hover:shadow-gold-premium transition-all duration-500 reveal">
                    <div className="absolute top-[-10%] right-[-10%] p-6 text-9xl opacity-[0.03] text-blue-500 group-hover:scale-110 transition-transform font-display">📜</div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">
                        Active Manuscripts
                    </p>
                    <h4 className="text-4xl font-black font-display text-slate-900 dark:text-white tracking-tightest">
                        {revenue?.activeSubscriptions || 0}
                    </h4>
                    <div className="mt-4 text-xs font-bold text-slate-400">Total scholarly access</div>
                </div>

                <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-lg hover:shadow-gold-premium transition-all duration-500 reveal">
                    <div className="absolute top-[-10%] right-[-10%] p-6 text-9xl opacity-[0.03] text-amber-500 group-hover:scale-110 transition-transform font-display">⌛</div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">
                        Expiring Soon
                    </p>
                    <h4 className="text-4xl font-black font-display text-amber-600 dark:text-amber-500 tracking-tightest">
                        {expiringSoonCount}
                    </h4>
                    <div className="mt-4 text-xs font-bold text-amber-500/60 uppercase tracking-widest">Urgent renewal required</div>
                </div>

                <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-lg hover:shadow-gold-premium transition-all duration-500 reveal">
                    <div className="absolute top-[-10%] right-[-10%] p-6 text-9xl opacity-[0.03] text-red-500 group-hover:scale-110 transition-transform font-display">📉</div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-3">
                        Remaining Revenue
                    </p>
                    <h4 className="text-4xl font-black font-display text-red-600 dark:text-red-400 tracking-tightest">
                        ₹{revenue?.remaining?.toLocaleString('en-IN') || '0'}
                    </h4>
                    <div className="mt-4 text-xs font-bold text-red-400/60 uppercase tracking-widest">Pending Collection</div>
                </div>
            </div>

            {/* Students with Dues */}
            {revenue?.studentsWithDues?.length > 0 && (
                <div className="glass-premium rounded-[3rem] overflow-hidden border border-white/10 shadow-xl reveal mb-10">
                    <div className="p-8 border-b border-white/5 bg-red-500/5">
                        <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tightest uppercase flex items-center gap-3">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            Pending <span className="text-red-500">Tributes</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Scholar</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Contact</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Total Fee</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Paid</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Remaining</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {revenue.studentsWithDues.map((student) => (
                                    <tr key={student.id} className="hover:bg-red-500/5 transition-colors">
                                        <td className="px-8 py-6 font-bold text-slate-700 dark:text-slate-300">
                                            {student.username}
                                            <div className="text-xs font-normal text-slate-400">{student.email}</div>
                                        </td>
                                        <td className="px-8 py-6 font-medium text-slate-500">
                                            {/* We might need to fetch mobile here if not in revenue object, but let's assume it's passed or available */}
                                            {student.mobile || '—'}
                                        </td>
                                        <td className="px-8 py-6 font-bold">₹{student.total}</td>
                                        <td className="px-8 py-6 font-bold text-emerald-500">₹{student.paid}</td>
                                        <td className="px-8 py-6 font-black text-red-500">₹{student.due}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Subscriptions Table */}
            <div className="glass-premium rounded-[3rem] overflow-hidden border border-white/10 shadow-xl reveal">
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tightest uppercase">
                        Imperial <span className="text-gold-royal">Subscription Ledger</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Scholar</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Joined</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Expires</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Tribute</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {subscriptions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-16 text-center text-slate-500 italic">
                                        The ledger remains empty.
                                    </td>
                                </tr>
                            ) : (
                                subscriptions.map((sub) => (
                                    <tr
                                        key={sub.id}
                                        className="hover:bg-amber-500/5 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white font-display tracking-tight text-lg">
                                                    {sub.profiles?.username || 'N/A'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {sub.profiles?.email || ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {sub.status === 'active' && (
                                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                                                    Academic Active
                                                </span>
                                            )}
                                            {sub.status === 'expiring_soon' && (
                                                <span className="px-4 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                                                    Ending Soon
                                                </span>
                                            )}
                                            {sub.status === 'expired' && (
                                                <span className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-red-500/20">
                                                    Access Revoked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                            {new Date(sub.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                            {new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-emerald-600 dark:text-emerald-500 font-display text-xl tracking-tight">
                                                ₹{parseFloat(sub.amount).toLocaleString('en-IN')}
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Payments */}
            <div className="glass-premium rounded-[3rem] overflow-hidden border border-white/10 shadow-xl reveal">
                <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-2xl font-black font-display text-slate-900 dark:text-white tracking-tightest uppercase">
                        Recent <span className="text-emerald-600">Imperial Transactions</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Scholar</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Transaction Date</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Tribute Amount</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.3em]">Process</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-16 text-center text-slate-500 italic">
                                        No transactions recorded in the scrolls.
                                    </td>
                                </tr>
                            ) : (
                                payments.slice(0, 10).map((payment) => (
                                    <tr
                                        key={payment.id}
                                        className="hover:bg-emerald-500/5 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white font-display tracking-tight text-lg">
                                                    {payment.profiles?.username || 'N/A'}
                                                </p>
                                                <p className="text-xs text-slate-400 font-medium">
                                                    {payment.profiles?.email || ''}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-600 dark:text-slate-400 font-bold">
                                            {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-emerald-600 dark:text-emerald-500 font-display text-xl tracking-tight">
                                                ₹{parseFloat(payment.amount).toLocaleString('en-IN')}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-slate-900 text-gold-royal rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border border-white/10 shadow-lg">
                                                {payment.payment_method || 'Imperial Vault'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueAnalytics;
