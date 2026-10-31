import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Components/User/Navbar';
import Footer from '../Components/User/Footer';

export default function Layout() {
    return (
        <div className='min-h-[100dvh] flex flex-col justify-between'>
            <Navbar />
            <main className='mt-[6rem] min-h-[50vh]'>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
