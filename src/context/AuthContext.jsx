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

  async function loginAsGuest(role = 'candidate') {
    const isMentor = role === 'mentor';
    const guestUser = {
      uid: isMentor ? 'guest_mentor_demo' : 'guest_candidate_demo',
      email: isMentor ? 'mentor.demo@placeprep.ai' : 'demo.candidate@placeprep.ai',
      displayName: isMentor ? 'Prof. Rajiv Sharma (Placement Officer)' : 'Demo Candidate',
      isAnonymous: true
    };
    const guestProfile = {
      uid: guestUser.uid,
      email: guestUser.email,
      name: guestUser.displayName,
      targetField: 'Software Development',
      role: isMentor ? 'mentor' : 'student',
      readyScore: 82,
      createdAt: new Date().toISOString()
    };
    setCurrentUser(guestUser);
    setUserProfile(guestProfile);
    try {
      localStorage.setItem('placeprep_guest_user', JSON.stringify({ guestUser, guestProfile }));
    } catch (e) {}
    return guestUser;
  }

  function toggleRole() {
    setUserProfile(prev => {
      const newRole = prev?.role === 'mentor' ? 'student' : 'mentor';
      const updated = {
        ...prev,
        role: newRole,
        name: newRole === 'mentor' ? 'Prof. Rajiv Sharma (Placement Officer)' : (prev?.name?.includes('Sharma') ? 'Demo Candidate' : prev?.name || 'Demo Candidate')
      };
      try {
        const saved = localStorage.getItem('placeprep_guest_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.guestProfile = updated;
          localStorage.setItem('placeprep_guest_user', JSON.stringify(parsed));
        }
      } catch (e) {}
      return updated;
    });
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
    try {
      localStorage.removeItem('placeprep_guest_user');
    } catch (e) {}
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (e) {}
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchOrCreateUserProfile(user);
        setLoading(false);
      } else {
        try {
          const savedGuest = localStorage.getItem('placeprep_guest_user');
          if (savedGuest) {
            const parsed = JSON.parse(savedGuest);
            setCurrentUser(parsed.guestUser);
            setUserProfile(parsed.guestProfile);
            setLoading(false);
            return;
          }
        } catch (e) {}
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
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
    loginAsGuest,
    toggleRole,
    logout,
    fetchOrCreateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
