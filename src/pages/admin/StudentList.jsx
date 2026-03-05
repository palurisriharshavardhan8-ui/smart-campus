import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, GraduationCap } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';

export default function StudentList() {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        return onSnapshot(collection(db, 'students'), snap =>
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
    }, []);

    const filtered = students.filter(s =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout title="Students">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="page-title">Student Directory</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search students..."
                        className="input-field pl-9 w-56"
                    />
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full card text-center py-12">
                        <Users className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-400">No students found</p>
                    </div>
                ) : (
                    filtered.map((s, i) => (
                        <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="card hover:shadow-md transition-all hover:-translate-y-0.5"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {s.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                                    <p className="text-xs text-gray-400">{s.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Roll No</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{s.rollNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Department</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{s.department || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Year</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{s.year || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Attendance</span>
                                    <span className={`font-semibold ${s.attendancePercent >= 75 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {s.attendancePercent || 0}%
                                    </span>
                                </div>
                            </div>
                            {/* Attendance bar */}
                            <div className="mt-3 progress-bar">
                                <div className="progress-fill" style={{ width: `${s.attendancePercent || 0}%` }} />
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
