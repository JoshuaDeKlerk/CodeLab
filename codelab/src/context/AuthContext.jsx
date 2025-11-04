/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

// Named export so the hook file can import it
export const AuthCtx = createContext(null);

// Auth Provider Component
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitialising(false);
    });

    getRedirectResult(auth).catch(() => { /* ignore; onAuth handles success */ });
    return unsub;
  }, []);

  // Email/password signup
  async function signup({ name, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return cred.user;
  }

  // Email/password login
  function login({ email, password }) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logout() {
    return signOut(auth);
  }

  // Google auth flow (signup/login)
  async function googleAuthFlow() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      // Try popup first
      const cred = await signInWithPopup(auth, provider);
      return cred.user; // logged in (new or existing)
    } catch (e) {
      // Fallback to redirect for popup blockers / user closed popup
      if (e?.code === "auth/popup-blocked" || e?.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
        return null; // flow will continue after redirect
      }
      throw e;
    }
  }

  // Google signup/login
  async function googleSignup() {
    return googleAuthFlow();
  }
  async function googleLogin() {
    return googleAuthFlow();
  }


  return (
    <AuthCtx.Provider
      value={{
        user,
        initialising,
        login,
        signup,
        logout,
        googleSignup,
        googleLogin,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
