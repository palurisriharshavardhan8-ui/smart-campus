import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, User, ShieldAlert } from 'lucide-react';

/* ── 5-step flow ─────────────────────────────────────────────── */
const STEPS = [
    { key: 'submitted', label: 'Submitted', desc: 'Complaint received' },
    { key: 'under_review', label: 'Teacher Review', desc: 'Class teacher reviewing' },
    { key: 'forwarded', label: 'Dept. Admin', desc: 'Forwarded to admin' },
    { key: 'pending_confirmation', label: 'Awaiting Confirm', desc: 'Student must confirm' },
    { key: 'resolved', label: 'Resolved', desc: 'Fully resolved' },
];

const STATUS_STEP = {
    submitted: 0,
    pending: 0,
    under_review: 1,
    'in-progress': 1,
    forwarded: 2,
    pending_confirmation: 3,
    resolved: 4,
};

const DOT_COLORS = {
    Submitted: 'bg-amber-500',
    'Under Review': 'bg-blue-500',
    Forwarded: 'bg-violet-500',
    'Pending Confirmation': 'bg-orange-500',
    'Student Confirmed': 'bg-teal-500',
    Resolved: 'bg-emerald-500',
    Reopened: 'bg-red-400',
};

function fmtTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ── Timeline list ───────────────────────────────────────────── */
function Timeline({ history }) {
    if (!history?.length) return null;
    const sorted = [...history].sort((a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0));
    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Activity Timeline</p>
            <div className="relative space-y-3 pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
                {sorted.map((entry, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                        <div className={`absolute -left-4 w-3 h-3 rounded-full ${DOT_COLORS[entry.stage] || 'bg-gray-400'} ring-2 ring-white dark:ring-gray-900 mt-0.5 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{entry.stage}</p>
                                <p className="text-[10px] text-gray-400 flex-shrink-0">{fmtTime(entry.timestamp)}</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entry.message}</p>
                            {entry.actor && (
                                <div className="flex items-center gap-1 mt-1">
                                    <User className="w-3 h-3 text-gray-400" />
                                    <span className="text-[10px] text-gray-400">{entry.actor}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main component ──────────────────────────────────────────── */
export default function ComplaintProgressTracker({ status, trackingHistory, assignedTo, compact = false }) {
    const [showTimeline, setShowTimeline] = useState(false);
    const currentStep = STATUS_STEP[status] ?? 0;
    const isResolved = status === 'resolved';
    const isPendingConf = status === 'pending_confirmation';

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {/* ── Stepper ── */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Complaint Progress</p>
            <div className="flex items-start">
                {STEPS.map((step, i) => {
                    const done = i < currentStep || isResolved;
                    const active = i === currentStep && !isResolved;

                    return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                            {i > 0 && (
                                <div className={`absolute top-3 right-1/2 h-0.5 w-full transition-colors duration-500 ${done ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                            <div className="relative z-10">
                                {done ? (
                                    <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-500/40">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                ) : active && isPendingConf ? (
                                    <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 border-2 border-orange-500 flex items-center justify-center">
                                        <ShieldAlert className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                    </div>
                                ) : active ? (
                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 border-2 border-primary-500 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                                    </div>
                                )}
                            </div>
                            <p className={`text-center text-[10px] mt-1.5 font-medium leading-tight px-0.5 ${done || active ? (isPendingConf && active ? 'text-orange-600 dark:text-orange-400' : 'text-primary-600 dark:text-primary-400') : 'text-gray-400 dark:text-gray-600'}`}>
                                {step.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── Handler badges ── */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                {assignedTo && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Handler: <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">{assignedTo.replace(/_/g, ' ')}</span></span>
                    </div>
                )}
                {isPendingConf && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3" /> Awaiting your confirmation
                    </div>
                )}
            </div>

            {/* ── Timeline toggle ── */}
            {trackingHistory?.length > 0 && (
                <>
                    <button
                        onClick={() => setShowTimeline(s => !s)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                        {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showTimeline ? 'Hide Timeline' : `View Timeline (${trackingHistory.length} update${trackingHistory.length > 1 ? 's' : ''})`}
                    </button>
                    <AnimatePresence>
                        {showTimeline && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                <Timeline history={trackingHistory} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}
