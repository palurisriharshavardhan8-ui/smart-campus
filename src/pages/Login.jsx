import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Users, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { seedDemoData } from '../utils/seedData';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill in all fields');
        setLoading(true);
        try {
            await login(email, password);
            // Role-based redirect happens in App.jsx via protected routes
            if (email.toLowerCase().includes('admin')) {
                navigate('/admin');
            } else {
                navigate('/student');
            }
            toast.success('Welcome back! 🎉');
        } catch (err) {
            toast.error(err.code === 'auth/invalid-credential'
                ? 'Invalid email or password'
                : 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function quickLogin(role) {
        if (role === 'student') {
            setEmail('student@campus.edu');
            setPassword('Student123!');
        } else {
            setEmail('admin@campus.edu');
            setPassword('Admin123!');
        }
    }

    async function handleSeed() {
        setSeeding(true);
        try {
            await seedDemoData();
            toast.success('✅ Demo data seeded! You can now login.');
        } catch (err) {
            toast.error('Seeding failed: ' + err.message);
        } finally {
            setSeeding(false);
        }
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 overflow-hidden">
            {/* Left panel */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
                {/* Background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-violet-500 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl">SmartCampus</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-bold text-white leading-tight">
                        Your Campus,<br />
                        <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">
                            Smarter.
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
                        Manage complaints, access announcements, browse notes, and track your attendance — all in one beautiful dashboard.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        {[
                            { icon: '🎓', label: 'Academic Notes', desc: 'All subjects in one place' },
                            { icon: '📢', label: 'Live Announcements', desc: 'Never miss updates' },
                            { icon: '📋', label: 'Complaint Tracker', desc: 'Track issue resolution' },
                            { icon: '📊', label: 'Attendance Analytics', desc: 'Visual insights' },
                        ].map((f) => (
                            <div key={f.label} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                                <div className="text-2xl mb-2">{f.icon}</div>
                                <p className="text-white font-medium text-sm">{f.label}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-gray-600 text-xs">© 2025 SmartCampus. Built for hackathon demo.</p>
                </div>
            </div>

            {/* Right panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-6 lg:hidden">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-white">SmartCampus</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                            <p className="text-gray-500 text-sm mt-1">Sign in to access your dashboard</p>
                        </div>

                        {/* Quick login buttons */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                onClick={() => quickLogin('student')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <Users className="w-4 h-4 text-primary-500" />
                                Student Demo
                            </button>
                            <button
                                onClick={() => quickLogin('admin')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                <ShieldCheck className="w-4 h-4 text-violet-500" />
                                Admin Demo
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                            <span className="text-xs text-gray-400">or sign in manually</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@campus.edu"
                                        className="input-field pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input-field pl-9 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        {/* Seed button */}
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-400 text-center mb-3">
                                First time? Seed demo data to Firebase first:
                            </p>
                            <button
                                onClick={handleSeed}
                                disabled={seeding}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : '🌱'}
                                {seeding ? 'Seeding data...' : 'Seed Demo Data to Firebase'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
