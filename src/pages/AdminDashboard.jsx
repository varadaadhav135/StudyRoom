import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import emailService from '../utils/emailService';
import Navbar from '../components/Navbar';
import Modal from '../components/Modal';
import FinancialAnalytics from '../components/Dashboard/FinancialAnalytics';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [payments, setPayments] = useState([]); // Store all payment history
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [studentToDelete, setStudentToDelete] = useState(null);

    // Date State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, unpaid, free

    // Form States
    const [studentForm, setStudentForm] = useState({
        id: '',
        username: '',
        email: '',
        mobile: '',
        aadhar_number: '',
        monthly_fee: '',
        subscription_start: new Date().toISOString().split('T')[0],
        subscription_end: '',
        is_free: false // New field for explicit free status
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch students AND payments
            const [resStudents, resPayments] = await Promise.all([
                api.getStudents(),
                api.getPayments ? api.getPayments() : Promise.resolve({ success: true, payments: [] })
            ]);

            if (resStudents.success) {
                setStudents(resStudents.students || []);
            }
            if (resPayments.success) {
                setPayments(resPayments.payments || []);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();

        if (studentForm.aadhar_number && !/^\d{12}$/.test(studentForm.aadhar_number)) {
            toast.error('Aadhar card number must be exactly 12 digits');
            return;
        }

        try {
            // Ensure fee is 0 if free
            const payload = {
                ...studentForm,
                monthly_fee: studentForm.is_free ? 0 : studentForm.monthly_fee
            };

            let res;
            if (editingStudent) {
                res = await api.updateProfile(editingStudent.id, payload);
            } else {
                res = await api.createStudent(null, payload);
            }

            if (res.success) {
                toast.success(editingStudent ? 'Record updated successfully!' : 'Student registered successfully!');
                setShowStudentModal(false);
                resetForm();
                fetchData();
            } else {
                toast.error(res.message || 'Action failed');
            }
        } catch (error) {
            console.error('Submission failed:', error);
            toast.error('Submission failed');
        }
    };

    const handleEditStudent = (student) => {
        setEditingStudent(student);
        setStudentForm({
            id: student.id,
            username: student.username,
            email: student.email,
            mobile: student.mobile,
            aadhar_number: student.aadhar_number,
            monthly_fee: student.monthly_fee,
            subscription_start: student.subscriptions?.[0]?.start_date || new Date().toISOString().split('T')[0],
            subscription_end: student.subscriptions?.[0]?.end_date || '',
            is_free: parseFloat(student.monthly_fee) === 0 // Infer free status from fee
        });
        setShowStudentModal(true);
    };

    const handleDeleteStudent = async () => {
        if (!studentToDelete) return;
        try {
            const res = await api.deleteStudent(null, studentToDelete.id);
            if (res.success) {
                toast.success('Student record removed');
                setStudentToDelete(null);
                fetchData();
            }
        } catch (error) {
            toast.error('Deletion failed');
        }
    };

    // Toggle Payment for the SELECTED Month/Year
    const handleStatusChange = async (student, newStatus) => {
        const originalStudents = [...students];
        const originalPayments = [...payments];

        try {
            // OPTIMISTIC UPDATES
            // 1. Handle "Free" Status
            if (newStatus === 'free') {
                setStudents(prev => prev.map(s =>
                    s.id === student.id ? { ...s, monthly_fee: 0, is_free: true } : s
                ));

                await api.updateProfile(student.id, { is_free: true, monthly_fee: 0 });
                // Success - student is now free
                return;
            }

            // 2. Handle Switching FROM Free TO Paid/Unpaid
            let currentFee = student.monthly_fee;
            if (student.is_free || parseFloat(student.monthly_fee) === 0) {
                setStudents(prev => prev.map(s =>
                    s.id === student.id ? { ...s, monthly_fee: 500, is_free: false } : s
                ));
                currentFee = 500; // Default fee for recording

                await api.updateProfile(student.id, { is_free: false });
            }

            // 3. Handle Paid/Unpaid (Monthly Ledger)
            const feeToRecord = parseFloat(currentFee) > 0 ? currentFee : 500;
            const isPaid = newStatus === 'paid';

            // Optimistically update payments
            setPayments(prev => {
                const filtered = prev.filter(p =>
                    !(String(p.student_id) === String(student.id) &&
                        String(p.month) === String(selectedMonth) &&
                        String(p.year) === String(selectedYear))
                );
                return [...filtered, {
                    id: 'temp-' + Date.now(),
                    student_id: student.id,
                    month: String(selectedMonth),
                    year: String(selectedYear),
                    amount: feeToRecord,
                    status: isPaid ? 'Paid' : 'Unpaid',
                    payment_date: new Date().toISOString()
                }];
            });

            // API call in background - no need to refresh as optimistic update is already correct
            await api.recordPayment(
                student.id,
                selectedMonth,
                selectedYear,
                feeToRecord,
                isPaid
            );
            // Success - optimistic update is now confirmed


        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
            // Revert on error
            setStudents(originalStudents);
            setPayments(originalPayments);
        }
    };

    const handleSendReceipt = async (student) => {
        try {
            const subscription = student.subscriptions?.[0];
            await emailService.sendReceipt(student, {
                amount: subscription?.amount || student.monthly_fee || 0,
                startDate: subscription?.start_date || 'N/A',
                endDate: subscription?.end_date || 'N/A'
            });
            toast.success('Receipt email opened!');
        } catch (error) {
            toast.error('Failed to send receipt');
        }
    };

    const handleSendReminder = async (student) => {
        try {
            const message = `Hi ${student.username}, reminder to pay ₹${student.monthly_fee || 500} for DnyanPeeth library fees this month. Thank you!`;

            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobile: student.mobile,
                    message: message,
                    studentName: student.username
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`SMS sent to ${student.username}`);
            } else {
                toast.error(data.error || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('SMS Error:', error);
            toast.error('Failed to send SMS');
        }
    };

    const resetForm = () => {
        setStudentForm({
            id: '',
            username: '',
            email: '',
            mobile: '',
            aadhar_number: '',
            monthly_fee: '',
            subscription_start: new Date().toISOString().split('T')[0],
            subscription_end: '',
            is_free: false
        });
        setEditingStudent(null);
    };

    const calculateAutoEndDate = (startDate) => {
        if (!startDate) return '';
        const start = new Date(startDate);
        start.setMonth(start.getMonth() + 1);
        return start.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (studentForm.subscription_start) {
            setStudentForm(prev => ({
                ...prev,
                subscription_end: calculateAutoEndDate(prev.subscription_start)
            }));
        }
    }, [studentForm.subscription_start]);

    // Check payment status based on PAYMENTS array
    const getPaymentStatusForSelectedMonth = (student) => {
        // 1. Check if Free
        if (parseFloat(student.monthly_fee) === 0) {
            return { isPaid: true, label: 'FREE', color: 'text-blue-600 font-bold', bgColor: 'bg-blue-50' };
        }

        // 2. Check Permissions/Payments Log
        const paymentRecord = payments.find(p =>
            String(p.student_id) === String(student.id) &&
            String(p.month) === String(selectedMonth) &&
            String(p.year) === String(selectedYear)
        );

        const isPaid = paymentRecord && paymentRecord.status === 'Paid';

        if (isPaid) {
            return { isPaid: true, label: 'PAID', color: 'text-green-600 font-bold', bgColor: 'bg-green-50' };
        }
        return { isPaid: false, label: 'UNPAID', color: 'text-red-600 font-bold', bgColor: 'bg-red-50' };
    };

    const filteredStudents = students.filter(student => {
        // Show ALL students who have joined BEFORE or DURING the selected month/year.
        // Don't show students who join in the future.
        const start = new Date(student.subscriptions?.[0]?.start_date || student.created_at || new Date());
        const selectedDate = new Date(selectedYear, selectedMonth + 1, 0); // End of selected month

        // If simple joining date check:
        // const hasJoined = start <= selectedDate;

        // For now, let's keep it simple: Show ALL active students.
        // The user asked "suppose we change the month do student are visible", implying they want to see everyone.

        const status = getPaymentStatusForSelectedMonth(student);

        // Status Filter
        let statusMatch = true;
        if (statusFilter === 'paid') statusMatch = status.isPaid && status.label !== 'FREE';
        else if (statusFilter === 'unpaid') statusMatch = !status.isPaid;
        else if (statusFilter === 'free') statusMatch = status.label === 'FREE';

        return statusMatch;
    }).sort((a, b) => {
        // Sort by desk number (ID) numerically
        const deskA = parseInt(String(a.id).replace(/\D/g, '')) || 0;
        const deskB = parseInt(String(b.id).replace(/\D/g, '')) || 0;
        return deskA - deskB;
    });

    const stats = {
        totalCollected: payments
            .filter(p => String(p.month) === String(selectedMonth) && String(p.year) === String(selectedYear) && p.status === 'Paid')
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),

        // Pending = Sum of fees of UNPAID students for this month
        totalPending: filteredStudents
            .reduce((sum, s) => {
                const status = getPaymentStatusForSelectedMonth(s);
                return !status.isPaid ? sum + (parseFloat(s.monthly_fee) || 0) : sum;
            }, 0),

        activeStudents: filteredStudents.length,
        freeStudents: filteredStudents.filter(s => parseFloat(s.monthly_fee) === 0).length
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026];

    // Chart Data Preparation (Last 6 Months)
    const getChartData = () => {
        const data = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthName = months[m].substring(0, 3);

            const collected = payments
                .filter(p => String(p.month) === String(m) && String(p.year) === String(y) && p.status === 'Paid')
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            // For pending, we check all students who are not free and didn't pay in that month
            const pending = students
                .filter(s => parseFloat(s.monthly_fee) > 0)
                .filter(s => {
                    const paidInMonth = payments.some(p =>
                        String(p.student_id) === String(s.id) &&
                        String(p.month) === String(m) &&
                        String(p.year) === String(y) &&
                        p.status === 'Paid'
                    );
                    return !paidInMonth;
                })
                .reduce((sum, s) => sum + (parseFloat(s.monthly_fee) || 0), 0);

            data.push({
                name: `${monthName} ${y}`,
                collected,
                pending
            });
        }
        return data;
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar darkMode={false} />

            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 border-b-2 border-amber-100 pb-6 md:pb-8 gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 font-display tracking-tightest">
                            Student <span className="text-amber-500">Management</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-2">DnyanPeeth Abhyasika Administration</p>
                    </div>
                    <div className="flex w-full md:w-auto">
                        <button
                            onClick={() => setShowStudentModal(true)}
                            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl shadow-lg shadow-amber-200 transition-all hover:-translate-y-1 active:scale-95 text-xs md:text-sm uppercase tracking-widest"
                        >
                            + Register New Student
                        </button>
                    </div>
                </header>

                {/* Month Indicator - Prominent */}
                {!loading && (
                    <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100/50 border-l-4 border-amber-500 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                                📅
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Currently Managing</h4>
                                <p className="text-2xl font-black text-slate-900">
                                    {months[selectedMonth]} {selectedYear}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Hub Section */}
                {!loading && (
                    <div className="space-y-8 mb-16">
                        <section className="bg-slate-50 p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                                <div>
                                    <h2 className="text-2xl md:text-4xl font-black text-imperial-indigo font-display tracking-tightest">
                                        Financial <span className="text-imperial-gold">Hub</span>
                                    </h2>
                                    <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <span className="w-8 h-[2px] bg-imperial-gold"></span>
                                        Insights for {months[selectedMonth]} {selectedYear}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="flex-1 lg:flex-none bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all hover:border-amber-200"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="paid">Paid Only</option>
                                        <option value="unpaid">Unpaid Only</option>
                                        <option value="free">Free Users</option>
                                    </select>
                                    <div className="flex gap-2 w-full lg:w-auto">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all hover:border-amber-200"
                                        >
                                            {months.map((month, idx) => (
                                                <option key={month} value={idx}>{month}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all hover:border-amber-200"
                                        >
                                            {years.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <FinancialAnalytics
                                data={getChartData()}
                                currentMonthStats={{
                                    totalCollected: stats.totalCollected,
                                    totalPending: stats.totalPending
                                }}
                            />

                            {/* Current Month Stat Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-12">
                                <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-50 hover:-translate-y-1">
                                    <span className="text-[8px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1 md:mb-2">Collected (This Month)</span>
                                    <div className="text-xl md:text-3xl font-black text-slate-900">₹{stats.totalCollected.toLocaleString('en-IN')}</div>
                                    <div className="mt-3 md:mt-4 w-8 md:w-12 h-1 bg-emerald-500 rounded-full"></div>
                                </div>
                                <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-red-50 hover:-translate-y-1">
                                    <span className="text-[8px] md:text-[10px] font-black text-red-600 uppercase tracking-widest block mb-1 md:mb-2">Pending (This Month)</span>
                                    <div className="text-xl md:text-3xl font-black text-slate-900">₹{stats.totalPending.toLocaleString('en-IN')}</div>
                                    <div className="mt-3 md:mt-4 w-8 md:w-12 h-1 bg-red-500 rounded-full"></div>
                                </div>
                                <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-amber-50 hover:-translate-y-1">
                                    <span className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1 md:mb-2">Active Students</span>
                                    <div className="text-xl md:text-3xl font-black text-slate-900">{stats.activeStudents}</div>
                                    <div className="mt-3 md:mt-4 w-8 md:w-12 h-1 bg-amber-500 rounded-full"></div>
                                </div>
                                <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-50 hover:-translate-y-1">
                                    <span className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1 md:mb-2">Free Students</span>
                                    <div className="text-xl md:text-3xl font-black text-slate-900">{stats.freeStudents}</div>
                                    <div className="mt-3 md:mt-4 w-8 md:w-12 h-1 bg-blue-500 rounded-full"></div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-gold-premium border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="min-w-full text-xs md:text-sm">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-5 text-left font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Desk</th>
                                            <th className="px-6 py-5 text-left font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Student</th>
                                            <th className="px-6 py-5 text-left font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Contact</th>
                                            <th className="px-6 py-5 text-left font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Fee</th>
                                            <th className="px-6 py-5 text-left font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Status ({months[selectedMonth]})</th>
                                            <th className="px-6 py-5 text-right font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredStudents.map((student, index) => {
                                            const status = getPaymentStatusForSelectedMonth(student);
                                            return (
                                                <tr key={student.id} className="group hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-600">
                                                        {student.id ? student.id : `#${String(index + 1).padStart(3, '0')}`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900">{student.username}</div>
                                                        <div className="text-[10px] text-gray-400 font-mono">{student.aadhar_number || 'No Aadhar'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 font-medium">{student.mobile || '—'}</td>
                                                    <td className="px-6 py-4 font-bold text-gray-900">
                                                        {parseFloat(student.monthly_fee) > 0 ? (
                                                            <span>₹{parseFloat(student.monthly_fee).toLocaleString('en-IN')}</span>
                                                        ) : (
                                                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-blue-100">Free</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="relative">
                                                            <select
                                                                value={status.label.toLowerCase()}
                                                                onChange={(e) => handleStatusChange(student, e.target.value)}
                                                                className={`appearance-none cursor-pointer px-4 py-2 rounded-xl text-xs font-black ${status.bgColor} ${status.color} hover:opacity-80 transition-all border-none focus:ring-2 focus:ring-amber-500/20 text-center w-full`}
                                                            >
                                                                <option value="paid" className="text-green-600 bg-green-50 font-bold">PAID</option>
                                                                <option value="unpaid" className="text-red-600 bg-red-50 font-bold">UNPAID</option>
                                                                <option value="free" className="text-blue-600 bg-blue-50 font-bold">FREE</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSendReceipt(student)}
                                                                className="flex flex-col items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm group"
                                                                title="Send Receipt"
                                                            >
                                                                <span className="text-lg">📧</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-wide">Receipt</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleSendReminder(student)}
                                                                className="flex flex-col items-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm group"
                                                                title="Send Reminder"
                                                            >
                                                                <span className="text-lg">📱</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-wide">Remind</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditStudent(student)}
                                                                className="flex flex-col items-center gap-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
                                                                title="Edit Student"
                                                            >
                                                                <span className="text-lg">✏️</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-wide">Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setStudentToDelete(student)}
                                                                className="flex flex-col items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                                                                title="Delete"
                                                            >
                                                                <span className="text-lg">🗑️</span>
                                                                <span className="text-[9px] font-bold uppercase tracking-wide">Delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {filteredStudents.length === 0 && (
                                <div className="text-center py-20 text-gray-400 font-medium italic">
                                    No student records match the filters.
                                </div>
                            )}
                        </div>
                    )
                }
            </div >

            <Modal
                isOpen={showStudentModal}
                onClose={() => { setShowStudentModal(false); resetForm(); }}
                title={editingStudent ? "Edit Student Details" : "New Student Registration"}
            >
                <form onSubmit={handleCreateStudent} className="space-y-6">
                    {/* Personal Information */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desk Allotted *</label>
                                <input
                                    type="text"
                                    value={studentForm.id}
                                    onChange={e => setStudentForm({ ...studentForm, id: e.target.value })}
                                    className="input-premium font-mono"
                                    placeholder="369"
                                    required
                                    disabled={!!editingStudent}
                                />
                                {editingStudent && <p className="text-[10px] text-slate-400 font-bold uppercase italic">Desk cannot be changed after registration</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                                <input
                                    type="text"
                                    value={studentForm.username}
                                    onChange={e => setStudentForm({ ...studentForm, username: e.target.value })}
                                    className="input-premium"
                                    placeholder="Enter student name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aadhar Card Number *</label>
                                <input
                                    type="text"
                                    value={studentForm.aadhar_number}
                                    onChange={e => setStudentForm({ ...studentForm, aadhar_number: e.target.value })}
                                    className="input-premium font-mono"
                                    placeholder="123456789012"
                                    maxLength="12"
                                    pattern="\d{12}"
                                    required
                                />
                                <p className="text-xs text-gray-400">Must be exactly 12 digits</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number *</label>
                                <input
                                    type="tel"
                                    value={studentForm.mobile}
                                    onChange={e => setStudentForm({ ...studentForm, mobile: e.target.value })}
                                    className="input-premium"
                                    placeholder="+91 9876543210"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address *</label>
                                <input
                                    type="email"
                                    value={studentForm.email}
                                    onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                                    className="input-premium"
                                    placeholder="student@example.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account & Subscription */}
                    <div className="border-b border-gray-100 pb-6">
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Account & Subscription</h3>

                        {/* Free Student Option */}
                        <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Free Student Membership</h4>
                                <p className="text-xs text-blue-700">Grant full access with zero fees.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={studentForm.is_free}
                                    onChange={e => {
                                        const isFree = e.target.checked;
                                        setStudentForm({
                                            ...studentForm,
                                            is_free: isFree,
                                            monthly_fee: isFree ? 0 : (editingStudent?.monthly_fee || '')
                                        });
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className={`grid grid-cols-1 gap-6 transition-all ${studentForm.is_free ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gold-premium uppercase tracking-wider">Monthly Fee (₹) *</label>
                                <input
                                    type="number"
                                    value={studentForm.monthly_fee}
                                    onChange={e => setStudentForm({ ...studentForm, monthly_fee: e.target.value })}
                                    className="input-premium"
                                    placeholder="1000"
                                    required={!studentForm.is_free}
                                    disabled={studentForm.is_free}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-green-600 uppercase tracking-wider">Subscription Start Date *</label>
                                <input
                                    type="date"
                                    value={studentForm.subscription_start}
                                    onChange={e => setStudentForm({ ...studentForm, subscription_start: e.target.value })}
                                    className="input-premium"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-green-600 uppercase tracking-wider">Subscription End Date *</label>
                                <input
                                    type="date"
                                    value={studentForm.subscription_end}
                                    onChange={e => setStudentForm({ ...studentForm, subscription_end: e.target.value })}
                                    className="input-premium"
                                    required
                                />
                                <p className="text-xs text-gray-400">Auto-calculated as 30 days from start date</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status (Only show if not free) */}
                    {!studentForm.is_free && (
                        <div className="pb-6">
                            <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">Current Month Payment</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={getPaymentStatusForSelectedMonth({
                                        id: editingStudent?.id || 'temp',
                                        monthly_fee: studentForm.monthly_fee
                                    }).isPaid}
                                    disabled={true}
                                    // This checkbox is just visual in the simplified logic as payment is toggleable from list
                                    // Or we can allow setting it for current month here?
                                    // For simplicity, let's remove it or make it just a static label saying "Manage payments from dashboard"
                                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-500 italic">
                                    Payments are now managed from the dashboard list for specific months.
                                </span>
                            </label>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-200 transition-all hover:-translate-y-1 active:scale-95 text-lg uppercase tracking-[0.2em]">
                        {editingStudent ? 'Update Details' : 'Register Student'}
                    </button>
                </form>
            </Modal>

            {/* Deletion Confirmation Modal */}
            <Modal
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                title="Confirm Removal"
            >
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border border-red-100 shadow-sm">
                        ⚠️
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2">Are you absolutely sure?</h4>
                    <p className="text-slate-500 font-medium mb-8">
                        You are about to remove <span className="text-red-600 font-black">{studentToDelete?.username}</span> from the library records.
                        This action is permanent and cannot be reversed.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStudentToDelete(null)}
                            className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteStudent}
                            className="flex-1 px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-200 uppercase tracking-widest text-sm"
                        >
                            Yes, Delete Permanently
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
};

export default AdminDashboard;