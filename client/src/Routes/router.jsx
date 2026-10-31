import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
import Errorpage from "../Pages/Shared/Errorpage";
import Home from "../Pages/User/Home";
import Login from "../Pages/User/Login";
import Signup from "../Pages/User/Signup";
import Dashboard from "../Pages/User/Dashboard";
import AdminHome from "../Pages/Admin/AdminHome";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <Errorpage />,
        children: [
            {
                path: '/',
                element: <Home />
            },
            {
                path: 'dashboard',
                element: <Dashboard />
            }
        ]
    },
    {
        path: '/login',
        element: <Login />,
        errorElement: <Errorpage />
    },
    {
        path: '/signup',
        element: <Signup />,
        errorElement: <Errorpage />
    },
    {
        path: 'admin',
        element: <AdminLayout />,
        errorElement: <Errorpage />,
        children: [
            {
                path: '',
                element: <AdminHome />
            }
        ]
    }
]);

export default router;
