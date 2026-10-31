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

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <Errorpage />,
        children: [
            { path: '/', element: <Home /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'profile', element: <Profile /> },
            { 
              path: 'subscriptions', 
              element: <GenericCatalogPage title="Subscriptions" subtitle="Manage subscriber billing terms, lifecycle statuses, and auto-renewals." entityName="Subscription" /> 
            },
            { 
              path: 'subscription-plans', 
              element: <GenericCatalogPage title="Subscription Plans" subtitle="Define recurring billing frequency, quotas, and pricing tiers." entityName="Plan" /> 
            },
            { 
              path: 'products', 
              element: <GenericCatalogPage title="Products" subtitle="Catalog of SaaS software modules, add-ons, and API products." entityName="Product" /> 
            },
            { 
              path: 'product-variants', 
              element: <GenericCatalogPage title="Product Variants" subtitle="SKUs, regional editions, and resource seat packaging." entityName="Variant" /> 
            },
            { 
              path: 'customers', 
              element: <GenericCatalogPage title="Customers" subtitle="Subscriber organizations, primary billing contacts, and payment methods." entityName="Customer" /> 
            },
            { 
              path: 'quotations', 
              element: <GenericCatalogPage title="Quotations" subtitle="B2B sales quotes, enterprise proposals, and contract sign-offs." entityName="Quotation" /> 
            },
            { 
              path: 'invoices', 
              element: <GenericCatalogPage title="Invoices" subtitle="Generated recurring tax invoices, payment receipts, and reconciliation." entityName="Invoice" /> 
            },
            { 
              path: 'payments', 
              element: <GenericCatalogPage title="Payments" subtitle="Real-time transaction settlement, card debits, and refund logs." entityName="Payment" /> 
            },
            { 
              path: 'discounts', 
              element: <GenericCatalogPage title="Discounts & Coupons" subtitle="Promotional coupons, early-bird vouchers, and partner rebates." entityName="Discount" /> 
            },
            { 
              path: 'reports', 
              element: <GenericCatalogPage title="Reports & Financial Analytics" subtitle="GAAP revenue recognition, cohort churn, and MRR waterfall." entityName="Report" /> 
            },
            { 
              path: 'settings', 
              element: <GenericCatalogPage title="Workspace Settings" subtitle="Configure organization brand, webhook endpoints, and tax profiles." entityName="Setting" /> 
            },
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
