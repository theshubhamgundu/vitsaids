import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Menu, X } from 'lucide-react';
import LoginModal from './LoginModal';
import { useAuth } from '@/contexts/AuthContext';
import AchievementsModal from './AchievementsModal';

const Header = () => {
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Achievements', href: '#achievements' },
    { name: 'Faculty', href: '#faculty' },
    { name: 'Clubs', href: '#clubs' },
    { name: 'Events', href: '#events' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Placements', href: '#placements' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (href: string) => {
    if (href === '#achievements') {
      setShowAchievementsModal(true);
      setMobileMenuOpen(false);
      return;
    }

    const element = document.querySelector(href);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI & DS</h1>
                <p className="text-xs text-gray-600">Vignan Institute of Technology and Science</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  {item.name}
                </button>
              ))}
            </nav>

            {/* Login Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStudentLogin(true)}
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Student Login</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAdminLogin(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <UserCheck className="w-4 h-4" />
                <span>Admin Login</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => scrollToSection(item.href)}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-left px-2 py-1"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStudentLogin(true)}
                    className="flex items-center justify-center space-x-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Student Login</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowAdminLogin(true)}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Admin Login</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Login Modals */}
      <LoginModal
        isOpen={showStudentLogin}
        onClose={() => setShowStudentLogin(false)}
        userType="student"
      />
      <LoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        userType="admin"
      />

      {/* Achievements Modal */}
      <AchievementsModal
        open={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
      />
    </>
  );
};

export default Header;
