import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isRegistering = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Prevent race condition: if registration is in progress,
      // register() will handle setting the profile and user after Firestore write completes.
      if (isRegistering.current) {
        return;
      }

      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // Auto-create basic profile document in Firestore
            const initialProfile = {
              uid: currentUser.uid,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
              email: currentUser.email,
              phone: currentUser.phoneNumber || '',
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(docRef, initialProfile, { merge: true });
              setProfile(initialProfile);
            } catch (wErr) {
              console.warn("Could not auto-create profile document:", wErr);
              setProfile(initialProfile);
            }
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setProfile(null);
        }
        setFirebaseUser(currentUser);
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback((email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }, []);
  
  const register = useCallback(async (email, password, displayName, phone) => {
    isRegistering.current = true;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      try {
        await updateProfile(newUser, { displayName });
      } catch (profileError) {
        console.error("Error updating profile display name:", profileError);
      }
      
      const profileData = {
        uid: newUser.uid,
        displayName,
        email,
        phone,
        createdAt: new Date().toISOString()
      };

      // Save phone and user data to Firestore
      try {
        await setDoc(doc(db, 'users', newUser.uid), profileData);
      } catch (error) {
        console.error("Error saving user data to Firestore during registration:", error);
      }

      setFirebaseUser(newUser);
      setProfile(profileData);
      return userCredential;
    } finally {
      isRegistering.current = false;
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    return signOut(auth);
  }, []);

  // Backward-compatible merged user:
  // Preserves access to user.displayName, user.email, user.uid, user.phone,
  // retains original Firebase User via _firebaseUser, and proxies prototype methods
  const user = useMemo(() => {
    if (!firebaseUser) return null;

    const profileData = profile || {};
    const base = {
      ...profileData,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: profileData.displayName || firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      phone: profileData.phone || firebaseUser.phoneNumber || '',
      _firebaseUser: firebaseUser,
      firebaseUser: firebaseUser,
    };

    return new Proxy(base, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }
        const val = firebaseUser[prop];
        if (typeof val === 'function') {
          return val.bind(firebaseUser);
        }
        return val;
      }
    });
  }, [firebaseUser, profile]);

  const resetPassword = useCallback((email) => {
    return sendPasswordResetEmail(auth, email);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    firebaseUser,
    loading,
    login,
    register,
    logout,
    resetPassword
  }), [user, profile, firebaseUser, loading, login, register, logout, resetPassword]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw'
        }}>
          <div
            className="loading-spinner"
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTop: '3px solid #10B981',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
