import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
    User, ShieldCheck, Users, CheckCircle2, KeyRound,
    BookOpen, Hash, Building2, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateAdminCode, DEPARTMENT_LABELS } from '../utils/adminCodes';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const SECTIONS = ['A', 'B', 'C', 'D'];

function PasswordStrength({ password }) {
    if (!password) return null;
    const strong = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
    const medium = password.length >= 6;
    const label = strong ? 'Strong' : medium ? 'Fair' : 'Too short';
    const color = strong ? 'bg-emerald-500' : medium ? 'bg-yellow-500' : 'bg-red-500';
    const width = strong ? '100%' : medium ? '55%' : '25%';
    return (
        <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width }} />
            </div>
            <p className="text-xs text-gray-400">{label}</p>
        </div>
    );
}

function Field({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
                {children}
            </div>
        </div>
    );
}

/* ─── STUDENT FORM ────────────────────────────────────────── */
function StudentForm({ onSubmit, loading }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        branch: 'CSE', section: 'A', registerNumber: '', className: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    function handleSubmit(e) {
        e.preventDefault();
        const { name, email, password, confirmPassword, branch, section, registerNumber, className } = form;
        if (!name.trim()) return toast.error('Enter your full name');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (!registerNumber.trim()) return toast.error('Enter your register number');
        if (!className.trim()) return toast.error('Enter your class');
        onSubmit({ name: name.trim(), email, password, role: 'student', branch, section, registerNumber: registerNumber.trim(), className: className.trim() });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row: Name */}
            <Field label="Full Name" icon={User}>
                <input name="name" type="text" value={form.name} onChange={set('name')}
                    placeholder="Arjun Sharma" className="input-field pl-9" required />
            </Field>

            <Field label="Email" icon={Mail}>
                <input name="email" type="email" value={form.email} onChange={set('email')}
                    placeholder="arjun@campus.edu" className="input-field pl-9" required />
            </Field>

            {/* Branch + Section */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Branch</label>
                    <select value={form.branch} onChange={set('branch')} className="select-field">
                        {BRANCHES.map(b => <option key={b}>{b}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Section</label>
                    <select value={form.section} onChange={set('section')} className="select-field">
                        {SECTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Register Number + Class */}
            <div className="grid grid-cols-2 gap-3">
                <Field label="Register Number" icon={Hash}>
                    <input name="registerNumber" type="text" value={form.registerNumber} onChange={set('registerNumber')}
                        placeholder="22CSR001" className="input-field pl-9" required />
                </Field>
                <Field label="Class" icon={BookOpen}>
                    <input name="className" type="text" value={form.className} onChange={set('className')}
                        placeholder="CSE-A" className="input-field pl-9" required />
                </Field>
            </div>

            {/* Password */}
            <Field label="Password" icon={Lock}>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="Min. 6 characters" className="input-field pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <PasswordStrength password={form.password} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" icon={Lock}>
                <input type={showConf ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Re-enter password"
                    className={`input-field pl-9 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400 focus:ring-red-400' : form.confirmPassword && form.password === form.confirmPassword ? 'border-emerald-400 focus:ring-emerald-400' : ''}`}
                    required />
                <button type="button" onClick={() => setShowConf(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>
            {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-500 -mt-2">Passwords don't match</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Student Account'}
            </button>
        </form>
    );
}

/* ─── ADMIN FORM ──────────────────────────────────────────── */
function AdminForm({ onSubmit, loading }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        adminCode: '', collegeId: '',
    });
    const [detectedDept, setDetectedDept] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

    function handleCodeChange(e) {
        const code = e.target.value;
        setForm(p => ({ ...p, adminCode: code }));
        const dept = validateAdminCode(code);
        setDetectedDept(dept);
    }

    function handleSubmit(e) {
        e.preventDefault();
        const { name, email, password, confirmPassword, adminCode, collegeId } = form;
        if (!name.trim()) return toast.error('Enter your full name');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        const dept = validateAdminCode(adminCode);
        if (!dept) return toast.error('Invalid Admin Code. Contact your super-admin.');
        if (!collegeId.trim()) return toast.error('Enter your College ID');
        onSubmit({ name: name.trim(), email, password, role: 'admin', department: dept, collegeId: collegeId.trim() });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" icon={User}>
                <input type="text" value={form.name} onChange={set('name')}
                    placeholder="Dr. Priya Nair" className="input-field pl-9" required />
            </Field>

            <Field label="Email" icon={Mail}>
                <input type="email" value={form.email} onChange={set('email')}
                    placeholder="admin@campus.edu" className="input-field pl-9" required />
            </Field>

            {/* Admin Code */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Admin Code</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.adminCode} onChange={handleCodeChange}
                        placeholder="e.g. INFRA_ADMIN_2026" className="input-field pl-9 font-mono uppercase tracking-wider" required />
                </div>
                {form.adminCode && (
                    <p className={`text-xs mt-1 ${detectedDept ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {detectedDept
                            ? `✓ Valid — Department: ${DEPARTMENT_LABELS[detectedDept]}`
                            : '✗ Invalid admin code'}
                    </p>
                )}
            </div>

            {/* Department (auto-filled) + College ID */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department</label>
                    <div className={`input-field flex items-center gap-2 ${detectedDept ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{detectedDept ? DEPARTMENT_LABELS[detectedDept] : 'Auto-detected'}</span>
                    </div>
                </div>
                <Field label="College ID" icon={Hash}>
                    <input type="text" value={form.collegeId} onChange={set('collegeId')}
                        placeholder="AD22001" className="input-field pl-9" required />
                </Field>
            </div>

            <Field label="Password" icon={Lock}>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="Min. 6 characters" className="input-field pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <PasswordStrength password={form.password} />
            </Field>

            <Field label="Confirm Password" icon={Lock}>
                <input type={showConf ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Re-enter password"
                    className={`input-field pl-9 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                    required />
                <button type="button" onClick={() => setShowConf(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Admin Account'}
            </button>
        </form>
    );
}

/* ─── MAIN SIGNUP PAGE ────────────────────────────────────── */
export default function Signup() {
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(data) {
        setLoading(true);
        try {
            await signup(data);
            toast.success('Account created! Please sign in. 🎉');
            navigate('/login');
        } catch (err) {
            const msg =
                err.code === 'auth/email-already-in-use' ? 'This email is already registered' :
                    err.code === 'auth/invalid-email' ? 'Invalid email address' :
                        err.code === 'auth/weak-password' ? 'Password is too weak' :
                            'Sign up failed. Please try again.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 overflow-hidden">
            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-violet-500 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-bold text-xl">SmartCampus</span>
                </div>
                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-bold text-white leading-tight">
                        Join the<br />
                        <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                            Smart Campus.
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
                        Create your account and get instant access — notes, announcements, complaints, and more.
                    </p>
                    <div className="space-y-3 pt-2">
                        {[
                            'Access subject notes from all courses',
                            'Submit & track complaints in real-time',
                            'Role-based dashboards for students & admins',
                            'Complaint routing through class teacher & dept',
                        ].map(item => (
                            <div key={item} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="relative z-10 text-gray-600 text-xs">© 2025 SmartCampus. Built for hackathon demo.</p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-lg"
                >
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
                        {/* Mobile logo */}
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center">
                                <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-gray-800 dark:text-white">SmartCampus</span>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create account</h2>
                        <p className="text-gray-500 text-sm mb-6">Join SmartCampus today</p>

                        {/* Role Selector */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {[
                                { value: 'student', label: 'Student', icon: Users, desc: 'Access notes, track complaints', color: 'primary' },
                                { value: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Requires admin code', color: 'violet' },
                            ].map(({ value, label, icon: Icon, desc, color }) => {
                                const sel = role === value;
                                return (
                                    <button key={value} type="button" onClick={() => setRole(value)}
                                        className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all
                                            ${sel
                                                ? color === 'violet' ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'}`}>
                                        <Icon className={`w-5 h-5 ${sel ? (color === 'violet' ? 'text-violet-500' : 'text-primary-500') : 'text-gray-400'}`} />
                                        <span className={`font-semibold text-sm ${sel ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
                                        <span className="text-xs text-gray-400 leading-tight">{desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic form */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, x: role === 'admin' ? 30 : -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {role === 'student'
                                    ? <StudentForm onSubmit={handleSubmit} loading={loading} />
                                    : <AdminForm onSubmit={handleSubmit} loading={loading} />}
                            </motion.div>
                        </AnimatePresence>

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
