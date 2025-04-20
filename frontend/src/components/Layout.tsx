import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ChatBot from './ChatBot';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-background-offset">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 font-bold text-xl text-primary">the gtm app</div>
        <nav className="mt-6">
          <Link 
            to="/dashboard" 
            className={`p-4 flex items-center ${location.pathname === '/dashboard' ? 'bg-secondary/10 text-secondary' : 'text-gray-700'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/accounts" 
            className={`p-4 flex items-center ${location.pathname === '/accounts' ? 'bg-secondary/10 text-secondary' : 'text-gray-700'}`}
          >
            Accounts
          </Link>
          <Link 
            to="/territories" 
            className={`p-4 flex items-center ${location.pathname === '/territories' ? 'bg-secondary/10 text-secondary' : 'text-gray-700'}`}
          >
            Territories
          </Link>
          <Link 
            to="/segments" 
            className={`p-4 flex items-center ${location.pathname === '/segments' ? 'bg-secondary/10 text-secondary' : 'text-gray-700'}`}
          >
            Segments
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold">GTM Platform</h1>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm text-secondary hover:text-secondary/80">Sign In</Link>
            <Link to="/signup" className="text-sm bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">Sign Up</Link>
          </div>
        </header>
        <main className="p-4">
          {children}
        </main>
        
        {/* Chat Bot is now added in App.tsx for global visibility */}
      </div>
    </div>
  );
};

export default Layout;