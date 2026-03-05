import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children, title }) {
    const { userRole } = useAuth();

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <Sidebar role={userRole} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar title={title} />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
