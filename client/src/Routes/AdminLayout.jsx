import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from '../Components/Admin/AdminHeader';
import AdminFooter from '../Components/Admin/AdminFooter';

export default function AdminLayout() {
    return (
        <div className="flex flex-col min-h-[100dvh] justify-between">
            <AdminHeader />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
            <AdminFooter />
        </div>
    );
}
