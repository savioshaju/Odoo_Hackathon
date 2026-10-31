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
import GenericCatalogPage from "../Pages/Shared/GenericCatalogPage";
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
                { 
                  path: 'products', 
                  element: <GenericCatalogPage title="Available Products & Modules" subtitle="Explore software modules and SaaS add-ons." entityName="Product" canMutate={false} /> 
                },
              ]
            },

            // Admin Functions: Strictly nested under /admin/ (Require Admin Login)
            {
              path: 'admin',
              element: <RoleBasedRoute allowedRoles={['admin']} />,
              children: [
                { index: true, element: <AdminHome defaultTab="overview" /> },
                { 
                  path: 'customers', 
                  element: <AdminHome defaultTab="users" /> 
                },
                { 
                  path: 'product-variants', 
                  element: <AdminHome defaultTab="plans" /> 
                },
                { 
                  path: 'payments', 
                  element: <AdminHome defaultTab="subscriptions" /> 
                },
                { 
                  path: 'discounts', 
                  element: <GenericCatalogPage title="Discounts & Coupons (Admin)" subtitle="Manage promotional vouchers and rebates." entityName="Discount" canMutate={true} /> 
                },
                { 
                  path: 'reports', 
                  element: <AdminHome defaultTab="overview" /> 
                },
                { 
                  path: 'settings', 
                  element: <GenericCatalogPage title="Workspace Settings (Admin)" subtitle="Configure organization brand, webhook endpoints, and tax profiles." entityName="Setting" canMutate={true} /> 
                },
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
