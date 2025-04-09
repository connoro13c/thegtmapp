// React is imported for JSX compilation
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-background-offset py-16 border-t border-gray-200">
      {/* Top decorative bar */}
      <div className="h-1 bg-gradient-to-r from-primary via-secondary to-accent max-w-6xl mx-auto mb-12 rounded-full"></div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and tagline */}
          <div className="col-span-1">
            <div className="font-bold text-2xl text-primary mb-4 flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg mr-2 flex items-center justify-center text-white">G</div>
              the gtm app
            </div>
            <p className="text-gray-600 mb-6 border-l-2 border-accent pl-4 py-1 italic">Everything RevOps needs to build, deploy, and optimize your GTM strategy—on one platform.</p>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z"></path>
                </svg>
              </a>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="col-span-1">
            <div className="h-6 w-6 bg-secondary/10 rounded-full mb-2 flex items-center justify-center">
              <div className="h-3 w-3 bg-secondary rounded-full"></div>
            </div>
            <h3 className="font-semibold mb-4 text-gray-800 text-lg">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/product" className="text-gray-600 hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-600 hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/demo" className="text-gray-600 hover:text-primary transition-colors">Schedule Demo</Link></li>
              <li><Link to="/security" className="text-gray-600 hover:text-primary transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <div className="h-6 w-6 bg-primary/10 rounded-full mb-2 flex items-center justify-center">
              <div className="h-3 w-3 bg-primary rounded-full"></div>
            </div>
            <h3 className="font-semibold mb-4 text-gray-800 text-lg">Resources</h3>
            <ul className="space-y-3">
              <li><Link to="/resources" className="text-gray-600 hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/resources/docs" className="text-gray-600 hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/resources/guides" className="text-gray-600 hover:text-primary transition-colors">GTM Guides</Link></li>
              <li><Link to="/resources/webinars" className="text-gray-600 hover:text-primary transition-colors">Webinars</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <div className="h-6 w-6 bg-accent/10 rounded-full mb-2 flex items-center justify-center">
              <div className="h-3 w-3 bg-accent rounded-full"></div>
            </div>
            <h3 className="font-semibold mb-4 text-gray-800 text-lg">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-600 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/legal" className="text-gray-600 hover:text-primary transition-colors">Legal</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar with copyright */}
        <div className="border-t border-gray-200 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">&copy; {new Date().getFullYear()} The GTM App. All rights reserved.</div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;