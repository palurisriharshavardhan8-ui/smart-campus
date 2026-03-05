import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Search, X } from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';

const SUBJECT_COLORS = [
    'from-indigo-400 to-violet-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-blue-400 to-cyan-500',
    'from-purple-400 to-fuchsia-500',
];

export default function NotesHub() {
    const [notes, setNotes] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const filtered = notes.filter(n =>
        n.subject?.toLowerCase().includes(search.toLowerCase()) ||
        n.uploadedBy?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout title="Notes Hub">
            <div className="mb-6">
                <h2 className="page-title">Notes Hub</h2>
                <p className="text-sm text-gray-500 mt-0.5">Access all your academic notes in one place</p>
            </div>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by subject or professor..."
                    className="input-field pl-9 pr-9"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {filtered.length === 0 ? (
                <div className="card text-center py-16">
                    <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400">{search ? 'No notes match your search' : 'No notes available yet'}</p>
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
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{note.subject}</h3>
                            {note.description && (
                                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{note.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mb-4">By {note.uploadedBy}</p>
                            <a
                                href={note.noteLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4 w-full justify-center"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open Notes
                            </a>
                        </motion.div>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}
