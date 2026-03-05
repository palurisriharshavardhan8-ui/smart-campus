import React from 'react';
import { motion } from 'framer-motion';

const colorMap = {
    indigo: 'from-indigo-500 to-violet-600 shadow-indigo-500/25',
    green: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/25',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/25',
    blue: 'from-blue-500 to-cyan-600 shadow-blue-500/25',
    purple: 'from-purple-500 to-fuchsia-600 shadow-purple-500/25',
};

const bgMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
};

export default function StatCard({ icon: Icon, label, value, trend, color = 'indigo', suffix = '', index = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className="stat-card group"
        >
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgMap[color]} transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${trend >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                        }`}>
                        {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {value}<span className="text-base font-medium text-gray-400 ml-0.5">{suffix}</span>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
        </motion.div>
    );
}
