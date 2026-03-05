import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { formatDistanceToNow, format } from 'date-fns';

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const colors = ['from-primary-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-600'];

    return (
        <DashboardLayout title="Announcements">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h2 className="page-title">Campus Announcements</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Stay updated with the latest campus news</p>
                </div>

                {announcements.length === 0 ? (
                    <div className="card text-center py-16">
                        <Megaphone className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-400">No announcements yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="card border-0 overflow-hidden"
                            >
                                <div className={`h-1.5 w-full bg-gradient-to-r ${colors[i % colors.length]} -mt-6 -mx-6 mb-4 rounded-t-2xl`} />
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center flex-shrink-0`}>
                                        <Megaphone className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{a.body}</p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="text-xs text-gray-400">By {a.createdBy}</span>
                                            {a.createdAt && (
                                                <>
                                                    <span className="text-gray-200 dark:text-gray-700">•</span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatDistanceToNow(a.createdAt.toDate?.() || new Date(), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
