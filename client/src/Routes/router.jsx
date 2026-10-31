import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
import Errorpage from "../Pages/Shared/Errorpage";
import Home from "../Pages/User/Home";
import Login from "../Pages/User/Login";
import Signup from "../Pages/User/Signup";
import Dashboard from "../Pages/User/Dashboard";
import Profile from "../Pages/User/Profile";
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
            // Public / General user routes
            { path: '/', element: <Home /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'profile', element: <Profile /> },
            { 
              path: 'subscriptions', 
              element: <GenericCatalogPage title="My Subscriptions" subtitle="View active subscriber billing plans and receipts." entityName="Subscription" canMutate={false} /> 
            },
            { 
              path: 'subscription-plans', 
              element: <GenericCatalogPage title="Subscription Plans" subtitle="Available recurring subscription tiers." entityName="Plan" canMutate={false} /> 
            },
            { 
              path: 'products', 
              element: <GenericCatalogPage title="Available Products" subtitle="Explore software modules and SaaS add-ons." entityName="Product" canMutate={false} /> 
            },
            { 
              path: 'invoices', 
              element: <GenericCatalogPage title="My Invoices" subtitle="Receipts and payment records." entityName="Invoice" canMutate={false} /> 
            },

            // Staff & Admin restricted routes (Customer management, internal pricing, discounts, reports)
            {
              element: <RoleBasedRoute allowedRoles={['staff', 'admin']} />,
              children: [
                { 
                  path: 'product-variants', 
                  element: <GenericCatalogPage title="Product Variants (Staff/Admin)" subtitle="SKUs, regional editions, and resource seat packaging." entityName="Variant" canMutate={true} /> 
                },
                { 
                  path: 'customers', 
                  element: <GenericCatalogPage title="Customer Directory (Staff/Admin)" subtitle="Subscriber organizations and payment methods." entityName="Customer" canMutate={true} /> 
                },
                { 
                  path: 'quotations', 
                  element: <GenericCatalogPage title="B2B Quotations (Staff/Admin)" subtitle="Enterprise sales proposals and contracts." entityName="Quotation" canMutate={true} /> 
                },
                { 
                  path: 'payments', 
                  element: <GenericCatalogPage title="Payment Processing (Staff/Admin)" subtitle="Real-time transaction settlement and card chargebacks." entityName="Payment" canMutate={true} /> 
                },
                { 
                  path: 'discounts', 
                  element: <GenericCatalogPage title="Discounts & Coupons (Staff/Admin)" subtitle="Manage promotional vouchers and rebates." entityName="Discount" canMutate={true} /> 
                },
                { 
                  path: 'reports', 
                  element: <GenericCatalogPage title="Financial Reports (Staff/Admin)" subtitle="GAAP revenue recognition, cohort churn, and MRR waterfall." entityName="Report" canMutate={true} /> 
                },
                { 
                  path: 'settings', 
                  element: <GenericCatalogPage title="Workspace Settings (Staff/Admin)" subtitle="Configure organization brand, webhook endpoints, and tax profiles." entityName="Setting" canMutate={true} /> 
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
                    {
                        path: '',
                        element: <AdminHome />
                    }
                ]
            }
        ]
    }
]);

export default router;
