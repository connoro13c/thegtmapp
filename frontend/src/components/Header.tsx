import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl text-primary">the gtm app</Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8 items-center">
          <Link to="/product" className="text-gray-700 hover:text-primary font-medium transition-colors">Product</Link>
          <Link to="/pricing" className="text-gray-700 hover:text-primary font-medium transition-colors">Pricing</Link>
          <Link to="/resources" className="text-gray-700 hover:text-primary font-medium transition-colors">Resources</Link>
          <Link to="/login" className="text-gray-800 font-medium">Sign in</Link>
          <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium">Sign up</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-gray-800 focus:outline-none"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden bg-white"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/product" className="text-gray-700 hover:text-primary font-medium py-2 transition-colors">Product</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-primary font-medium py-2 transition-colors">Pricing</Link>
            <Link to="/resources" className="text-gray-700 hover:text-primary font-medium py-2 transition-colors">Resources</Link>
            <div className="pt-4 flex flex-col space-y-3">
              <Link to="/login" className="text-gray-800 font-medium w-full text-center py-2">Sign in</Link>
              <Link to="/signup" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium w-full text-center">Sign up</Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;