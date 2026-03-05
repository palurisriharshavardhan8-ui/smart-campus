import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Trash2, Loader2, ExternalLink, Search, X, Clock, Link2, FileText } from 'lucide-react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query,
    where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const SUBJECT_COLORS = [
    'from-indigo-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-fuchsia-500',
];

export default function TeacherNotes() {
    const { currentUser, userProfile } = useAuth();
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ subject: '', description: '', noteLink: '', type: 'link' });

    const className = userProfile?.className;

    /* ── Real-time: notes for this teacher's class ── */
    useEffect(() => {
        if (!className) return;
        const q = query(
            collection(db, 'notes'),
            where('className', '==', className),
        );
        return onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setNotes(docs);
        }, err => console.error('notes:', err));
    }, [className]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject.trim()) return toast.error('Enter a subject/title');
        if (form.type === 'link' && !form.noteLink.trim()) return toast.error('Enter a drive/link URL');
        if (form.type === 'text' && !form.description.trim()) return toast.error('Enter the note content');
        setLoading(true);
        try {
            await addDoc(collection(db, 'notes'), {
                subject: form.subject.trim(),
                description: form.description.trim(),
                noteLink: form.type === 'link' ? form.noteLink.trim() : '',
                type: form.type,
                className,
                branch: userProfile?.branch || '',
                section: userProfile?.section || '',
                uploadedBy: userProfile?.name || 'Teacher',
                teacherId: currentUser.uid,
                createdAt: serverTimestamp(),
            });
            toast.success('Note posted!');
            setForm({ subject: '', description: '', noteLink: '', type: 'link' });
            setShowForm(false);
        } catch { toast.error('Failed to post note'); }
        finally { setLoading(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this note?')) return;
        try { await deleteDoc(doc(db, 'notes', id)); toast.success('Deleted'); }
        catch { toast.error('Delete failed'); }
    }

    const filtered = notes.filter(n =>
        !search ||
        n.subject?.toLowerCase().includes(search.toLowerCase()) ||
        n.description?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <DashboardLayout title="Class Notes">
            <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="page-title">Class Notes</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Class <span className="font-semibold text-gray-700 dark:text-gray-300">{className}</span>
                        {' '}· {notes.length} note{notes.length !== 1 ? 's' : ''} posted
                    </p>
                </div>
                <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {showForm ? 'Cancel' : 'Add Note'}
                </button>
            </div>

            {/* ── Form ── */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="card mb-6 border-2 border-primary-200 dark:border-primary-800">
                        <h3 className="section-title mb-4">Post New Note</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject / Title</label>
                                <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="e.g. Data Structures – Unit 3" className="input-field" required />
                            </div>

                            {/* Type toggle */}
                            <div className="flex gap-2">
                                {[{ key: 'link', icon: Link2, label: 'Drive / Link' }, { key: 'text', icon: FileText, label: 'Text Note' }].map(t => (
                                    <button key={t.key} type="button" onClick={() => setForm(f => ({ ...f, type: t.key }))}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${form.type === t.key
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border border-primary-300 dark:border-primary-700'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                        <t.icon className="w-3.5 h-3.5" />{t.label}
                                    </button>
                                ))}
                            </div>

                            {form.type === 'link' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Drive / Resource Link</label>
                                    <input type="url" value={form.noteLink} onChange={e => setForm(f => ({ ...f, noteLink: e.target.value }))}
                                        placeholder="https://drive.google.com/..." className="input-field" />
                                </div>
                            ) : null}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {form.type === 'text' ? 'Note Content' : 'Description (optional)'}
                                </label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder={form.type === 'text' ? 'Write your note content here...' : 'Brief description...'}
                                    rows={form.type === 'text' ? 6 : 2} className="input-field resize-none" />
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Posting...' : 'Post Note'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Search ── */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search notes..." className="input-field pl-9 pr-9" />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* ── Notes grid ── */}
            {filtered.length === 0 ? (
                <div className="card text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400">{search ? 'No notes match your search' : 'No notes posted yet — add your first note!'}</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((note, i) => (
                        <motion.div key={note.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                            className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative">

                            <button onClick={() => handleDelete(note.id)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {note.type === 'text' ? <FileText className="w-6 h-6 text-white" /> : <BookOpen className="w-6 h-6 text-white" />}
                            </div>

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 pr-8">{note.subject}</h3>
                            {note.description && (
                                <p className="text-xs text-gray-400 mb-3 line-clamp-3">{note.description}</p>
                            )}

                            {/* Timestamp */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                                <Clock className="w-3 h-3" />
                                <span>
                                    {note.createdAt
                                        ? format(note.createdAt.toDate?.() || new Date(note.createdAt), 'dd MMM yyyy, hh:mm a')
                                        : '—'}
                                </span>
                            </div>

                            {note.type === 'link' && note.noteLink ? (
                                <a href={note.noteLink} target="_blank" rel="noopener noreferrer"
                                    className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 w-full justify-center">
                                    <ExternalLink className="w-3.5 h-3.5" /> Open Resource
                                </a>
                            ) : (
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 leading-relaxed whitespace-pre-line">
                                    {note.description || '(No content)'}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
