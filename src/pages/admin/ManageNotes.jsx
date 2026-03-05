import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';

export default function ManageNotes() {
    const { userProfile } = useAuth();
    const [notes, setNotes] = useState([]);
    const [form, setForm] = useState({ subject: '', noteLink: '', description: '' });
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject.trim() || !form.noteLink.trim()) return toast.error('Fill required fields');
        setLoading(true);
        try {
            await addDoc(collection(db, 'notes'), {
                ...form,
                uploadedBy: userProfile?.name || 'Admin',
                createdAt: serverTimestamp(),
            });
            toast.success('Note added!');
            setForm({ subject: '', noteLink: '', description: '' });
            setShowForm(false);
        } catch {
            toast.error('Failed to add note');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this note?')) return;
        try {
            await deleteDoc(doc(db, 'notes', id));
            toast.success('Deleted');
        } catch {
            toast.error('Delete failed');
        }
    }

    return (
        <DashboardLayout title="Manage Notes">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="page-title">Notes Management</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{notes.length} notes available</p>
                </div>
                <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {showForm ? 'Cancel' : 'Add Note'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-6 border-2 border-primary-200 dark:border-primary-800"
                >
                    <h3 className="section-title mb-4">Add Study Material</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject *</label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="e.g. Data Structures"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note Link *</label>
                                <input
                                    type="url"
                                    value={form.noteLink}
                                    onChange={e => setForm(f => ({ ...f, noteLink: e.target.value }))}
                                    placeholder="https://..."
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Brief description of the notes..."
                                rows={3}
                                className="input-field resize-none"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Adding...' : 'Add Note'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Notes Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Uploaded By</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {notes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No notes added yet</p>
                                    </td>
                                </tr>
                            ) : (
                                notes.map((note, i) => (
                                    <motion.tr
                                        key={note.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                                    <BookOpen className="w-4 h-4 text-primary-500" />
                                                </div>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{note.subject}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs">
                                            <span className="line-clamp-1">{note.description || '—'}</span>
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{note.uploadedBy}</td>
                                        <td className="px-5 py-4">
                                            <a
                                                href={note.noteLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline text-xs font-medium"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Open
                                            </a>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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
