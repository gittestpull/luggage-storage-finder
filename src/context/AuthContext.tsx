'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    // Analysis Result for Report
    analysisResult: any;
    setAnalysisResult: (result: any) => void;
    modals: {
        login: boolean;
        register: boolean;
        report: boolean;
        photoScan: boolean;
        ai: boolean;
    };
    openModal: (modal: 'login' | 'register' | 'report' | 'photoScan' | 'ai') => void;
    closeModal: (modal: 'login' | 'register' | 'report' | 'photoScan' | 'ai') => void;
    closeAllModals: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [modals, setModals] = useState({
        login: false,
        register: false,
        report: false,
        photoScan: false,
        ai: false,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const openModal = (modal: keyof typeof modals) => {
        setModals(prev => ({ ...prev, [modal]: true }));
    };

    const closeModal = (modal: keyof typeof modals) => {
        setModals(prev => ({ ...prev, [modal]: false }));
    };

    const closeAllModals = () => {
        setModals({
            login: false,
            register: false,
            report: false,
            photoScan: false,
            ai: false,
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, modals, openModal, closeModal, closeAllModals, analysisResult, setAnalysisResult }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
