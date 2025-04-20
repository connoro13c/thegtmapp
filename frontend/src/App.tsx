import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ChatBot from './components/ChatBot';
import Layout from './components/Layout';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const Demo = lazy(() => import('./pages/Demo'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Territories = lazy(() => import('./pages/Territories'));
const Segments = lazy(() => import('./pages/Segments'));
const PageDashboard = lazy(() => import('./pages/PageDashboard'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Test = lazy(() => import('./pages/Test'));
const TrialWizard = lazy(() => import('./components/FreeTrialWizard/WizardContainer'));

function App() {
  return (
    <>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/trial" element={<TrialWizard />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/accounts" element={<Layout><Accounts /></Layout>} />
          <Route path="/territories" element={<Layout><Territories /></Layout>} />
          <Route path="/segments" element={<Layout><Segments /></Layout>} />
          <Route path="/page" element={<Layout><PageDashboard /></Layout>} />
          <Route path="/landing" element={<Layout><LandingPage /></Layout>} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </Suspense>
      <ChatBot />
    </>
  );
}

export default App;
