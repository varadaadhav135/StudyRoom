import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StudentProfileForm = ({ onComplete }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [existingInfo, setExistingInfo] = useState(null);
    const [formData, setFormData] = useState({
        phone_number: '',
        date_of_birth: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        educational_background: '',
        institution_name: '',
        course_enrolled: ''
    });

    useEffect(() => {
        fetchExistingInfo();
    }, []);

    const fetchExistingInfo = async () => {
        try {
            const response = await api.getStudentInfo(user.id);
            if (response.success && response.studentInfo) {
                setExistingInfo(response.studentInfo);
                setFormData(response.studentInfo);
            }
        } catch (error) {
            console.error('Error fetching student info:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.updateStudentInfo(user.id, formData);

            if (response.success) {
                toast.success('Profile information saved successfully!');
                if (onComplete) {
                    onComplete();
                }
            } else {
                toast.error(response.message || 'Failed to save profile information');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('An error occurred while saving your profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12 reveal">
            {/* Personal Information */}
            <div className="space-y-8 p-8 glass-premium rounded-[2.5rem] border border-white/5 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-4 tracking-tightest uppercase">
                    <span className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-xl">👤</span>
                    Personal <span className="text-gold-royal">Identity</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Imperial Link (Phone)
                        </label>
                        <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="+91 98765 43210"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Day of Inception (DOB)
                        </label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="input-premium"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Address Information */}
            <div className="space-y-8 p-8 glass-premium rounded-[2.5rem] border border-white/5 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-4 tracking-tightest uppercase">
                    <span className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-xl">📍</span>
                    Geographic <span className="text-emerald-600">Coordinates</span>
                </h3>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                        Imperial Residence
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Street address, apartment, etc."
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            City
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="Mumbai"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            State
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="Maharashtra"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Postal Code
                        </label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.postal_code}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="400001"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                        Country
                    </label>
                    <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="input-premium"
                        required
                    />
                </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-8 p-8 glass-premium rounded-[2.5rem] border border-white/5 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-4 tracking-tightest uppercase">
                    <span className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-xl">🚨</span>
                    Imperial <span className="text-red-500">Shield</span> (Emergency)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Guardian Name
                        </label>
                        <input
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Guardian Link
                        </label>
                        <input
                            type="tel"
                            name="emergency_contact_phone"
                            value={formData.emergency_contact_phone}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="+91 98765 43210"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                        Kinship
                    </label>
                    <input
                        type="text"
                        name="emergency_contact_relation"
                        value={formData.emergency_contact_relation}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Parent, Spouse, Sibling, etc."
                        required
                    />
                </div>
            </div>

            {/* Educational Background */}
            <div className="space-y-8 p-8 glass-premium rounded-[2.5rem] border border-white/5 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display flex items-center gap-4 tracking-tightest uppercase">
                    <span className="w-10 h-10 bg-gold-royal/10 rounded-xl flex items-center justify-center text-xl">🎓</span>
                    Academic <span className="text-gold-royal">Legacy</span>
                </h3>

                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                        Highest Qualification
                    </label>
                    <textarea
                        name="educational_background"
                        value={formData.educational_background}
                        onChange={handleChange}
                        className="input-premium"
                        placeholder="Bachelor's in Computer Science, etc."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Imperial Institution
                        </label>
                        <input
                            type="text"
                            name="institution_name"
                            value={formData.institution_name}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="University of Mumbai"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] ml-1">
                            Current Discipline
                        </label>
                        <input
                            type="text"
                            name="course_enrolled"
                            value={formData.course_enrolled}
                            onChange={handleChange}
                            className="input-premium"
                            placeholder="Full Stack Development"
                        />
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-10">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-premium btn-gold py-6 text-xs font-black uppercase tracking-[0.4em] shadow-gold-premium disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-5 h-5 border-3 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                            <span>Recording Archive...</span>
                        </div>
                    ) : (
                        <span className="flex items-center justify-center gap-4">
                            {existingInfo ? 'Seal Ancient Record' : 'Commence Legacy'}
                            <span className="text-xl group-hover:translate-x-2 transition-transform">→</span>
                        </span>
                    )}
                </button>
            </div>
        </form>
    );
};

export default StudentProfileForm;
