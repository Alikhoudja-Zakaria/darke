import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Leisure from './pages/Leisure';
import ListingDetails from './pages/ListingDetails';
import Favorites from './pages/Favorites';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateListing from './pages/CreateListing';
import UserProfile from './pages/UserProfile';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="app-wrapper">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leisure" element={<Leisure />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/listing/:id" element={<ListingDetails />} />
                <Route path="/user/:id" element={<UserProfile />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/post" 
                  element={
                    <ProtectedRoute>
                      <CreateListing key="create" />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/edit/:id" 
                  element={
                    <ProtectedRoute>
                      <CreateListing key="edit" />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<div className="container" style={{padding: '100px 0', textAlign: 'center'}}><h2>Page introuvable (404)</h2></div>} />
              </Routes>
            </main>
            <Footer />
            <ScrollToTop />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
