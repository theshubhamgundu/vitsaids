
import React from 'react';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Department Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">AI & Data Science</h3>
                <p className="text-sm text-gray-400">Excellence in Innovation</p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Leading the future of technology through cutting-edge research and education in 
              Artificial Intelligence and Data Science at Vignan Institute of Technology and Science.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">
                  Vignan Institute of Technology and Science<br />
                  Hyderabad, Telangana, India
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">+91 40 2345 6789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">aids@vignanits.ac.in</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300">www.vignanits.ac.in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                'About Us',
                'Faculty',
                'Research',
                'Admissions',
                'Student Clubs',
                'Events',
                'Placements',
                'Contact'
              ].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-gray-300 hover:text-blue-400 transition-colors text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 AI & Data Science Department, Vignan Institute of Technology and Science. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
