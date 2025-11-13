// src/App.tsx (or src/main layout component)
import React from 'react';
import { useAppUser } from './hooks/useAppUser';
import CitizenDashboard from './pages/CitizenDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SignInPage from './pages/SignInPage';

export default function App() {
  const { appUser, loading } = useAppUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // not signed in
  if (!appUser) {
    return <SignInPage />;
  }

  // if profile exists but specialization rows missing, show a short onboarding CTA
  if (!appUser.isEmployee && !appUser.citizen) {
    return (
      <div className="p-8">
        <h2>Complete your profile</h2>
        <p>We couldn't find your citizen profile. Please complete it to use citizen features.</p>
        <button onClick={() => window.location.assign('/profile')}>Complete Profile</button>
      </div>
    );
  }

  // render appropriate dashboard
  if (appUser.isEmployee) {
    return <EmployeeDashboard user={appUser} />;
  } else {
    return <CitizenDashboard user={appUser} />;
  }
}
