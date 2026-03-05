import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardList, Filter, Search, X,
} from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Infrastructure', 'Faculty', 'Academic', 'Hostel', 'Transport'];
const STATUSES = ['all', 'pending', 'in-progress', 'resolved'];
const STATUS_BADGE = {
    pending: 'badge-pending',
    'in-progress': 'badge-inprogress',
    resolved: 'badge-resolved',
};

export default function ManageComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    async function handleStatus(id, status) {
        try {
            await updateDoc(doc(db, 'complaints', id), { status });
            toast.success(`Status → ${status}`);
        } catch {
            toast.error('Update failed');
        }
    }

    const filtered = complaints
        .filter(c => catFilter === 'All' || c.category === catFilter)
        .filter(c => statusFilter === 'all' || c.status === statusFilter)
        .filter(c =>
            !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.studentName?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <DashboardLayout title="Manage Complaints">
            <div className="mb-6">
                <h2 className="page-title">Complaints Management</h2>
                <p className="text-sm text-gray-500 mt-0.5">{complaints.length} total complaints</p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search complaints..."
                            className="input-field pl-9"
                        />
                    </div>

                    {/* Category */}
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="select-field w-auto">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>

                    {/* Status */}
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto capitalize">
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Student</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No complaints found</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((c, i) => (
                                    <motion.tr
                                        key={c.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{c.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 md:hidden">{c.studentName}</p>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell">{c.studentName}</td>
                                        <td className="px-5 py-4 hidden sm:table-cell">
                                            <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{c.category}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`badge ${STATUS_BADGE[c.status] || 'badge-pending'}`}>{c.status}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <select
                                                value={c.status}
                                                onChange={e => handleStatus(c.id, e.target.value)}
                                                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
