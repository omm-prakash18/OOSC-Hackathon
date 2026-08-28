import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import UserVoiceApp from './components/UserVoiceApp';
import PublicSchemesDashboard from './components/PublicSchemesDashboard';
import CommunityIntel from './components/CommunityIntel';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import BackgroundElements from './components/BackgroundElements';
import { useAuth } from './context/AuthContext';

function MainContent() {
  const { activeTab, userProfile } = useApp();
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Enforce Sign-In for Dashboard, Voice App, Public Schemes, and Community Intel tabs
  const isProtectedTab = ['dashboard', 'voice', 'schemes', 'intel'].includes(activeTab);
  if (isProtectedTab && !isSignedIn) {
    return <AuthPage />;
  }

  // Profile Detail Completion Gate:
  // If signed in, but profile is incomplete and user tries to access feature tabs, redirect to dashboard to fill details
  const isFeatureTab = ['voice', 'schemes', 'intel'].includes(activeTab);
  const isProfileIncomplete = isSignedIn && (!userProfile || !userProfile.fullName || !userProfile.fullName.trim());
  if (isFeatureTab && isProfileIncomplete) {
    return <Dashboard />;
  }

  return (
    <main className="relative z-10" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {activeTab === 'home' && <LandingPage />}
      {activeTab === 'auth' && <AuthPage />}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'voice' && <UserVoiceApp />}
      {activeTab === 'schemes' && <PublicSchemesDashboard />}
      {activeTab === 'intel' && <CommunityIntel />}
    </main>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fbfbfa' }}>
        <BackgroundElements />
        <Header />
        <MainContent />
        <Footer />
      </div>
    </AppProvider>
  );
}
