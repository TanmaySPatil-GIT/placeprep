import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth was invoked outside of an <AuthProvider> tree or before initialization.');
    return {};
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create user profile in Firestore
  async function fetchOrCreateUserProfile(user, additionalData = {}) {
    if (!user) return null;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setUserProfile(data);
        return data;
      } else {
        const newProfile = {
          uid: user.uid,
          email: user.email || '',
          name: additionalData.name || user.displayName || user.email?.split('@')[0] || 'Student Candidate',
          targetField: additionalData.targetField || 'Software Development',
          createdAt: new Date().toISOString(),
          readyScore: 78
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Firestore profile fetch/create notice:', err.message);
      // Fallback local profile if Firestore is unconfigured
      const fallbackProfile = {
        uid: user.uid,
        email: user.email || '',
        name: additionalData.name || user.displayName || user.email?.split('@')[0] || 'Student Candidate',
        targetField: additionalData.targetField || 'Software Development',
        createdAt: new Date().toISOString(),
        readyScore: 78
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  }

  async function signup(email, password, name, targetField) {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await fetchOrCreateUserProfile(res.user, { name, targetField });
    return res;
  }

  async function login(email, password) {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await fetchOrCreateUserProfile(res.user);
    return res;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    await fetchOrCreateUserProfile(res.user);
    return res;
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchOrCreateUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    fetchOrCreateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
