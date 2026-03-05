import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Search, X, Clock, User, FileText } from 'lucide-react';
import {
    collection, onSnapshot, query, where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { format, formatDistanceToNow } from 'date-fns';

const SUBJECT_COLORS = [
    'from-indigo-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-fuchsia-500',
];

export default function NotesHub() {
    const { userProfile } = useAuth();
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');

    const className = userProfile?.className;

    useEffect(() => {
        if (!className) return;
        // Fetch notes for this student's class + any general notes (no className)
        const classQ = query(
            collection(db, 'notes'),
            where('className', '==', className),
        );
        const unsubClass = onSnapshot(classQ, snap => {
            const classDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setNotes(prev => {
                const globalNotes = prev.filter(n => !n.className);
                const merged = [...globalNotes, ...classDocs];
                merged.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
                return merged;
            });
        });
        return () => unsubClass();
    }, [className]);

    const filtered = notes.filter(n =>
        !search ||
        n.subject?.toLowerCase().includes(search.toLowerCase()) ||
        n.uploadedBy?.toLowerCase().includes(search.toLowerCase()) ||
        n.description?.toLowerCase().includes(search.toLowerCase())
    );

    function fmtDate(ts) {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return format(d, 'dd MMM yyyy, hh:mm a');
    }
    function fmtRel(ts) {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return formatDistanceToNow(d, { addSuffix: true });
    }

    return (
        <DashboardLayout title="Notes Hub">
            <div className="mb-6">
                <h2 className="page-title">Notes Hub</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    Academic notes for class <span className="font-semibold text-gray-700 dark:text-gray-300">{className || '—'}</span>
                    {' '}· {notes.length} note{notes.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by subject or teacher..." className="input-field pl-9 pr-9" />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="card text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400">{search ? 'No notes match your search' : 'No notes available for your class yet'}</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((note, i) => (
                        <motion.div
                            key={note.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.06 }}
                            className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                {note.type === 'text'
                                    ? <FileText className="w-6 h-6 text-white" />
                                    : <BookOpen className="w-6 h-6 text-white" />
                                }
                            </div>

                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{note.subject}</h3>

                            {note.description && (
                                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{note.description}</p>
                            )}

                            {/* Posted by + timestamp */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                <User className="w-3 h-3" />
                                <span>{note.uploadedBy}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                                <Clock className="w-3 h-3" />
                                <span title={fmtDate(note.createdAt)}>{fmtRel(note.createdAt)}</span>
                                {note.createdAt && (
                                    <span className="text-[10px] text-gray-300 dark:text-gray-600">
                                        {' '}· {fmtDate(note.createdAt)}
                                    </span>
                                )}
                            </div>

                            {note.type === 'text' && !note.noteLink ? (
                                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 leading-relaxed whitespace-pre-line">
                                    {note.description || '(No content)'}
                                </div>
                            ) : (
                                <a
                                    href={note.noteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 w-full justify-center"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open Notes
                                </a>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
