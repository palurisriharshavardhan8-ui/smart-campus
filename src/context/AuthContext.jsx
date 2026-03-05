import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup({ name, email, password, role, ...extra }) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const { uid } = result.user;

        const base = { uid, name, email, role, createdAt: serverTimestamp() };
        const userData = { ...base, ...extra };

        // Universal users collection
        await setDoc(doc(db, 'users', uid), userData);

        // Role-specific collection
        const collectionName =
            role === 'superAdmin' ? 'admins' :        // super admin lives in admins
                role === 'admin' ? 'admins' :
                    role === 'classTeacher' ? 'classTeachers' :
                        'students';
        await setDoc(doc(db, collectionName, uid), userData);

        // Teacher: also update classes collection for routing
        if (role === 'classTeacher' && extra.className) {
            await setDoc(doc(db, 'classes', extra.className), {
                className: extra.className,
                branch: extra.branch || '',
                section: extra.section || '',
                teacherId: uid,
                teacherName: name,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }

        return result;
    }

    async function login(email, password) {
        return await signInWithEmailAndPassword(auth, email, password);
    }

    async function logout() {
        await signOut(auth);
        setUserRole(null);
        setUserProfile(null);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    let profile = null;
                    let role = null;

                    // Check students first
                    const studentSnap = await getDoc(doc(db, 'students', user.uid));
                    if (studentSnap.exists()) {
                        profile = studentSnap.data();
                        role = 'student';
                    } else {
                        // Check admins (includes superAdmin)
                        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
                        if (adminSnap.exists()) {
                            profile = adminSnap.data();
                            // Use stored role so superAdmin is preserved
                            role = profile.role === 'superAdmin' ? 'superAdmin' : 'admin';
                        } else {
                            // Check class teachers
                            const teacherSnap = await getDoc(doc(db, 'classTeachers', user.uid));
                            if (teacherSnap.exists()) {
                                profile = teacherSnap.data();
                                role = 'classTeacher';
                            }
                        }
                    }

                    setUserRole(role);
                    setUserProfile(profile);
                } catch (err) {
                    console.error('Error fetching user profile:', err);
                }
            } else {
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = { currentUser, userRole, userProfile, loading, signup, login, logout };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
