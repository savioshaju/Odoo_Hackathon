import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import AdminLayout from "./AdminLayout";
import Errorpage from "../Pages/Shared/Errorpage";
import Home from "../Pages/User/Home";
import Login from "../Pages/User/Login";
import Signup from "../Pages/User/Signup";
import AdminHome from "../Pages/Admin/AdminHome";
import ProductsPage from "../Pages/Admin/ProductsPage";
import PlansDiscountsPage from "../Pages/Admin/PlansDiscountsPage";

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
                path: 'login',
                element: <Login />
            },
            {
                path: 'signup',
                element: <Signup />
            }
        ]
    },
    {
        path: 'admin',
        element: <AdminLayout />,
        errorElement: <Errorpage />,
        children: [
            {
                path: '',
                element: <AdminHome />
            },
            {
                path: 'products',
                element: <ProductsPage />
            },
            {
                path: 'plans',
                element: <PlansDiscountsPage />
            }
        ]
    }
]);

export default router;
