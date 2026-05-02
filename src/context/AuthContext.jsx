import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, setSession, clearSession, findUserByEmail, saveUser } from '../lib/storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const existingUser = findUserByEmail(email);
    if (!existingUser) throw new Error('User not found. Please sign up.');
    if (existingUser.password !== password) throw new Error('Incorrect password.');
    
    // Create session (excluding password for security in state)
    const sessionUser = { name: existingUser.name, email: existingUser.email };
    setUser(sessionUser);
    setSession(sessionUser);
  };

  const signup = async (name, email, password) => {
    if (findUserByEmail(email)) throw new Error('Email already exists. Please log in.');
    
    const newUser = { name, email, password };
    saveUser(newUser);
    
    const sessionUser = { name, email };
    setUser(sessionUser);
    setSession(sessionUser);
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  if (loading) return <div style={{display: 'flex', justifyContent: 'center', padding: '50px'}}>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
