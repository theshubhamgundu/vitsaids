import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AuthLayout } from './AuthLayout';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Users } from 'lucide-react';

export function CrewLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleCrewLogin = () => {
    // Mock crew login - would verify credentials
    navigate('/crew-dashboard');
  };

  return (
    <AuthLayout 
      title="Crew Member Login" 
      subtitle="Access your assigned events"
    >


      {/* Crew Icon */}
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
          <Users size={32} className="text-blue-600" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <Input
            type="text"
            placeholder="Enter username provided by organizer"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={16} className="text-gray-400" />
              ) : (
                <Eye size={16} className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <Button 
          onClick={handleCrewLogin}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled={!username || !password}
        >
          Access Dashboard
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </motion.div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Crew credentials are provided by your event organizer. 
          Contact them if you need access or have forgotten your login details.
        </p>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Not a crew member?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Go to main login
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Need help? Contact your organizer or{' '}
          <button className="text-blue-600 hover:underline">
            support team
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}