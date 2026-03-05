import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap, Mail, Lock, Eye, EyeOff, Loader2,
    User, ShieldCheck, Users, CheckCircle2, KeyRound,
    BookOpen, Hash, Building2, ChevronRight, School,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    validateAdminCode, validateTeacherCode,
    DEPARTMENT_LABELS, TEACHER_CODES,
} from '../utils/adminCodes';
import toast from 'react-hot-toast';

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const SECTIONS = ['A', 'B', 'C', 'D'];

/* ── Shared helpers ─────────────────────────────────────────── */
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

/* ─── STUDENT FORM ───────────────────────────────────────────── */
function StudentForm({ onSubmit, loading }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        branch: 'CSE', section: 'A', registerNumber: '', className: '',
    });
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    function handleSubmit(e) {
        e.preventDefault();
        const { name, email, password, confirmPassword, branch, section, registerNumber, className } = form;
        if (!name.trim()) return toast.error('Enter your full name');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        if (!registerNumber.trim()) return toast.error('Enter your register number');
        if (!className.trim()) return toast.error('Enter your class (e.g. CSE-A)');
        onSubmit({ name: name.trim(), email, password, role: 'student', branch, section, registerNumber: registerNumber.trim(), className: className.trim() });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" icon={User}>
                <input name="name" type="text" value={form.name} onChange={set('name')}
                    placeholder="Arjun Sharma" className="input-field pl-9" required />
            </Field>
            <Field label="Email" icon={Mail}>
                <input type="email" value={form.email} onChange={set('email')}
                    placeholder="arjun@campus.edu" className="input-field pl-9" required />
            </Field>
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
            <div className="grid grid-cols-2 gap-3">
                <Field label="Register Number" icon={Hash}>
                    <input type="text" value={form.registerNumber} onChange={set('registerNumber')}
                        placeholder="22CSR001" className="input-field pl-9" required />
                </Field>
                <Field label="Class" icon={BookOpen}>
                    <input type="text" value={form.className} onChange={set('className')}
                        placeholder="CSE-A" className="input-field pl-9" required />
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

/* ─── TEACHER FORM ───────────────────────────────────────────── */
function TeacherForm({ onSubmit, loading }) {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        teacherCode: '', employeeId: '',
    });
    const [detectedClass, setDetectedClass] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    function handleCodeChange(e) {
        const code = e.target.value;
        setForm(p => ({ ...p, teacherCode: code }));
        setDetectedClass(validateTeacherCode(code));
    }

    function handleSubmit(e) {
        e.preventDefault();
        const { name, email, password, confirmPassword, teacherCode, employeeId } = form;
        if (!name.trim()) return toast.error('Enter your full name');
        if (password.length < 6) return toast.error('Password must be at least 6 characters');
        if (password !== confirmPassword) return toast.error('Passwords do not match');
        const cls = validateTeacherCode(teacherCode);
        if (!cls) return toast.error('Invalid Teacher Code. Contact the admin office.');
        if (!employeeId.trim()) return toast.error('Enter your Employee ID');
        onSubmit({
            name: name.trim(), email, password,
            role: 'classTeacher',
            className: cls.className,
            branch: cls.branch,
            section: cls.section,
            employeeId: employeeId.trim(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" icon={User}>
                <input type="text" value={form.name} onChange={set('name')}
                    placeholder="Prof. Kavita Reddy" className="input-field pl-9" required />
            </Field>
            <Field label="College Email" icon={Mail}>
                <input type="email" value={form.email} onChange={set('email')}
                    placeholder="teacher@campus.edu" className="input-field pl-9" required />
            </Field>

            {/* Teacher Code */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Teacher Code</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.teacherCode} onChange={handleCodeChange}
                        placeholder="e.g. CSE_A_TEACHER_2026"
                        className="input-field pl-9 font-mono uppercase tracking-wider" required />
                </div>
                {form.teacherCode && (
                    <p className={`text-xs mt-1 ${detectedClass ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {detectedClass
                            ? `✓ Valid — Assigned class: ${detectedClass.className} (${detectedClass.branch} Sec-${detectedClass.section})`
                            : '✗ Invalid teacher code — contact admin office'}
                    </p>
                )}
            </div>

            {/* Class (auto-filled) + Employee ID */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assigned Class</label>
                    <div className={`input-field flex items-center gap-2 ${detectedClass ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'text-gray-400'}`}>
                        <School className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{detectedClass ? detectedClass.className : 'Auto-detected'}</span>
                    </div>
                </div>
                <Field label="Employee ID" icon={Hash}>
                    <input type="text" value={form.employeeId} onChange={set('employeeId')}
                        placeholder="EMP2026001" className="input-field pl-9" required />
                </Field>
            </div>

            {/* Available codes hint */}
            <details className="text-xs text-gray-400 cursor-pointer">
                <summary className="font-medium hover:text-gray-600 dark:hover:text-gray-300">Available teacher codes ↓</summary>
                <div className="mt-2 grid grid-cols-2 gap-1 pl-2">
                    {Object.keys(TEACHER_CODES).map(code => (
                        <span key={code} className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                            {code}
                        </span>
                    ))}
                </div>
            </details>

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
                    className={`input-field pl-9 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400' : ''}`}
                    required />
                <button type="button" onClick={() => setShowConf(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </Field>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <School className="w-4 h-4" />}
                {loading ? 'Creating account...' : 'Create Teacher Account'}
            </button>
        </form>
    );
}

/* ─── ADMIN FORM ──────────────────────────────────────────────── */
function AdminForm({ onSubmit, loading }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', adminCode: '', collegeId: '' });
    const [detectedDept, setDetectedDept] = useState(null);
    const [showPass, setShowPass] = useState(false);
    const [showConf, setShowConf] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    function handleCodeChange(e) {
        const code = e.target.value;
        setForm(p => ({ ...p, adminCode: code }));
        setDetectedDept(validateAdminCode(code));
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
        // If dept === 'superAdmin', create a Head Admin account
        const role = dept === 'superAdmin' ? 'superAdmin' : 'admin';
        const payload = dept === 'superAdmin'
            ? { name: name.trim(), email, password, role, collegeId: collegeId.trim() }
            : { name: name.trim(), email, password, role, department: dept, collegeId: collegeId.trim() };
        onSubmit(payload);
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
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Admin Code</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input type="text" value={form.adminCode} onChange={handleCodeChange}
                        placeholder="e.g. INFRA_ADMIN_2026" className="input-field pl-9 font-mono uppercase tracking-wider" required />
                </div>
                {form.adminCode && (
                    <p className={`text-xs mt-1 ${detectedDept ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {detectedDept ? `✓ Valid — Department: ${DEPARTMENT_LABELS[detectedDept]}` : '✗ Invalid admin code'}
                    </p>
                )}
            </div>
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
                    className={`input-field pl-9 pr-10 ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-400' : ''}`}
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

/* ─── MAIN SIGNUP PAGE ───────────────────────────────────────── */
const ROLES = [
    { value: 'student', label: 'Student', icon: Users, desc: 'Access notes & complaints', color: 'primary' },
    { value: 'classTeacher', label: 'Class Teacher', icon: School, desc: 'Requires teacher code', color: 'emerald' },
    { value: 'admin', label: 'Dept Admin', icon: ShieldCheck, desc: 'Requires admin code', color: 'violet' },
];

export default function Signup() {
    const [role, setRole] = useState('student');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(data) {
        setLoading(true);
        try {
            await signup(data);
            toast.success('Account created! Please sign in 🎉');
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
                        Students, teachers, and admins — each with a dedicated workspace.
                    </p>
                    <div className="space-y-3 pt-2">
                        {[
                            'Students: notes, complaints, announcements',
                            'Teachers: review & forward to dept admins',
                            'Dept Admins: resolve department issues',
                            'Real-time tracking across all roles',
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
                        <p className="text-gray-500 text-sm mb-6">Choose your role to get started</p>

                        {/* 3-way Role Selector */}
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {ROLES.map(({ value, label, icon: Icon, desc, color }) => {
                                const sel = role === value;
                                const selCls = {
                                    primary: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
                                    emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
                                    violet: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20',
                                }[color];
                                const iconCls = {
                                    primary: 'text-primary-500',
                                    emerald: 'text-emerald-500',
                                    violet: 'text-violet-500',
                                }[color];
                                return (
                                    <button key={value} type="button" onClick={() => setRole(value)}
                                        className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all
                                            ${sel ? selCls : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'}`}>
                                        <Icon className={`w-5 h-5 ${sel ? iconCls : 'text-gray-400'}`} />
                                        <span className={`font-semibold text-xs ${sel ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
                                        <span className="text-[10px] text-gray-400 leading-tight">{desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dynamic form */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={role}
                                initial={{ opacity: 0, x: role === 'admin' ? 30 : role === 'classTeacher' ? 10 : -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                            >
                                {role === 'student' && <StudentForm onSubmit={handleSubmit} loading={loading} />}
                                {role === 'classTeacher' && <TeacherForm onSubmit={handleSubmit} loading={loading} />}
                                {role === 'admin' && <AdminForm onSubmit={handleSubmit} loading={loading} />}
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
