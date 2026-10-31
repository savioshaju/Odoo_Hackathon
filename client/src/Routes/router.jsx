import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Errorpage from "../Pages/Shared/Errorpage";
import Home from "../Pages/User/Home";
import Login from "../Pages/User/Login";
import Signup from "../Pages/User/Signup";
import Dashboard from "../Pages/User/Dashboard";
import Profile from "../Pages/User/Profile";
import Subscriptions from "../Pages/User/Subscriptions";
import SubscriptionPlans from "../Pages/User/SubscriptionPlans";
import Invoices from "../Pages/User/Invoices";
import ForgotPassword from "../Pages/User/ForgotPassword";
import AdminHome from "../Pages/Admin/AdminHome";
import CustomerDirectory from "../Pages/Admin/CustomerDirectory";
import ProductVariants from "../Pages/Admin/ProductVariants";
import AdminPayments from "../Pages/Admin/AdminPayments";
import Discounts from "../Pages/Admin/Discounts";
import RoleBasedRoute from "./RoleBasedRoute";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <Errorpage />,
        children: [
            // Public Landing / Home (accessible to everyone)
            { path: '/', element: <Home /> },

            // Protected User & Admin Routes (Require Login)
            {
              element: <RoleBasedRoute allowedRoles={['user', 'admin']} />,
              children: [
                { path: 'dashboard', element: <Dashboard /> },
                { path: 'profile', element: <Profile /> },
                { path: 'subscriptions', element: <Subscriptions /> },
                { path: 'subscription-plans', element: <SubscriptionPlans /> },
                { path: 'invoices', element: <Invoices /> },
              ]
            },

            // Admin Functions: Strictly nested under /admin/ (Require Admin Login)
            {
              path: 'admin',
              element: <RoleBasedRoute allowedRoles={['admin']} />,
              children: [
                { index: true, element: <AdminHome /> },
                { path: 'customers', element: <CustomerDirectory /> },
                { path: 'services', element: <ProductVariants /> },
                { path: 'product-variants', element: <ProductVariants /> },
                { path: 'discounts', element: <Discounts /> },
                { path: 'payments', element: <AdminPayments /> },
              ]
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
        path: '/forgot-password',
        element: <ForgotPassword />,
        errorElement: <Errorpage />
    }
]);

export default router;
