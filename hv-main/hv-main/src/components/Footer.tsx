import { motion } from 'motion/react';
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail } from 'lucide-react';

const footerLinks = {
  'Company': ['About', 'Events', 'Colleges', 'Contact'],
  'Support': ['Help Center', 'Privacy Policy', 'Terms of Service', 'FAQ'],
  'Community': ['Student Portal', 'Host Events', 'Organizers', 'Partners']
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Mail, href: '#', label: 'Email' }
];

export function Footer() {
  return (
    <footer className="relative bg-background border-t border-border">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 to-blue-900/5" />
      
      {/* Glowing border effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-1"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              FindMyEvent
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Discover and participate in college events across the country. From hackathons to cultural fests, find your perfect event experience.
            </p>
            
            {/* Social Media Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: 5,
                      color: '#a855f7'
                    }}
                    className="w-10 h-10 rounded-full bg-secondary backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:border-purple-500/50 transition-all duration-300"
                  >
                    <IconComponent className="h-5 w-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
          
          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 + 0.2 }}
            >
              <h4 className="text-foreground font-semibold mb-6">{category}</h4>
              <ul className="space-y-3">
                {links.map((link, linkIndex) => (
                  <motion.li 
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: linkIndex * 0.05 + categoryIndex * 0.1 + 0.3 }}
                  >
                    <a 
                      href="#" 
                      className="text-muted-foreground hover:text-purple-400 transition-colors duration-200 relative group"
                    >
                      {link}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300"></span>
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        
        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8 mb-8"
        >
          <div className="max-w-md mx-auto text-center md:text-left md:mx-0 md:max-w-none md:flex md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h4 className="text-foreground font-semibold mb-2">Stay Updated</h4>
              <p className="text-muted-foreground text-sm">Get notified about new events and updates.</p>
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-secondary backdrop-blur-sm border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground"
        >
          <p>&copy; 2024 FindMyEvent. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Cookies</a>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-1/4 w-px h-20 bg-gradient-to-t from-purple-500/50 to-transparent" />
      <div className="absolute bottom-0 right-1/4 w-px h-20 bg-gradient-to-t from-blue-500/50 to-transparent" />
    </footer>
  );
}