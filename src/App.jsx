import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import Profile from './pages/Profile';
import { useDispatch } from 'react-redux';
import { logout, logoutLocal } from './store/slices/authSlice';

function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleBeforeUnload = () => {
            // Note: This will trigger on refresh as well. 
            // However, with sessionStorage, the user would stay logged in if we didn't call this.
            // If we want to support refresh, we might need a more complex check.
            // But for a strict 'logout on close', this is the most direct way.
            dispatch(logoutLocal());
            dispatch(logout());
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [dispatch]);

    return (
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify/:token" element={<VerifyEmail />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/b/:id" element={<BoardView />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
