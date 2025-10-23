import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on a dashboard page
  const isDashboardPage = location.pathname.includes('dashboard');
  
  // Don't show navbar on dashboard pages (they have their own headers)
  if (isDashboardPage) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/')}
          >
            <Logo size="md" showText={true} />
          </motion.button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="#events" className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full p-2"
            >
              {theme === 'dark' ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </Button>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden rounded-full p-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={16} /> : <Menu size={16} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 space-y-4"
          >
            <div className="flex flex-col space-y-2">
              <a href="#events" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Events
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                About
              </a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Contact
              </a>
            </div>
            <div className="flex flex-col space-y-2 pt-2 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="justify-start"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 justify-start"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}