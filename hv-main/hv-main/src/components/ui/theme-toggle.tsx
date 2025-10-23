import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'floating';
}

export function ThemeToggle({ className = '', variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
      >
        <Button
          onClick={toggleTheme}
          size="lg"
          className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
          variant="outline"
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-blue-600" />
            )}
          </motion.div>
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className={`flex items-center space-x-2 ${className}`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Sun size={16} className="text-yellow-500" />
        ) : (
          <Moon size={16} className="text-blue-600" />
        )}
      </motion.div>
      <span className="hidden sm:inline">
        {theme === 'dark' ? 'Light' : 'Dark'} Mode
      </span>
    </Button>
  );
}