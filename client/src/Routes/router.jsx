import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
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
            // General registered user routes (accessible by 'user' & 'admin')
            { path: '/', element: <Home /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'profile', element: <Profile /> },
            { path: 'subscriptions', element: <Subscriptions /> },
            { path: 'subscription-plans', element: <SubscriptionPlans /> },
            { path: 'invoices', element: <Invoices /> },
            { 
              path: 'products', 
              element: <GenericCatalogPage title="Available Products & Modules" subtitle="Explore software modules and SaaS add-ons." entityName="Product" canMutate={false} /> 
            },

            // Admin Only restricted routes (only 2 roles: 'user' and 'admin')
            {
              element: <RoleBasedRoute allowedRoles={['admin']} />,
              children: [
                { 
                  path: 'product-variants', 
                  element: <GenericCatalogPage title="Product Variants (Admin)" subtitle="SKUs, regional editions, and resource seat packaging." entityName="Variant" canMutate={true} /> 
                },
                { 
                  path: 'customers', 
                  element: <GenericCatalogPage title="Customer Directory (Admin)" subtitle="Subscriber organizations and payment methods." entityName="Customer" canMutate={true} /> 
                },
                { 
                  path: 'quotations', 
                  element: <GenericCatalogPage title="B2B Quotations (Admin)" subtitle="Enterprise sales proposals and contracts." entityName="Quotation" canMutate={true} /> 
                },
                { 
                  path: 'payments', 
                  element: <GenericCatalogPage title="Payment Processing (Admin)" subtitle="Real-time transaction settlement and card chargebacks." entityName="Payment" canMutate={true} /> 
                },
                { 
                  path: 'discounts', 
                  element: <GenericCatalogPage title="Discounts & Coupons (Admin)" subtitle="Manage promotional vouchers and rebates." entityName="Discount" canMutate={true} /> 
                },
                { 
                  path: 'reports', 
                  element: <GenericCatalogPage title="Financial Reports (Admin)" subtitle="GAAP revenue recognition, cohort churn, and MRR waterfall." entityName="Report" canMutate={true} /> 
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
    },
    // Admin Only Portal
    {
        path: 'admin',
        element: <AdminLayout />,
        errorElement: <Errorpage />,
        children: [
            {
                element: <RoleBasedRoute allowedRoles={['admin']} />,
                children: [
                    { path: '', element: <AdminHome /> }
                ]
            }
        ]
    }
]);

export default router;
