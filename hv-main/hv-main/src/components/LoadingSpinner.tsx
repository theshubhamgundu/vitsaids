import { motion } from 'motion/react';
import { Loader2, Calendar, Users, Ticket } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'default' | 'page' | 'inline';
  icon?: 'spinner' | 'calendar' | 'users' | 'ticket';
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  variant = 'default',
  icon = 'spinner'
}: LoadingSpinnerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  const getIcon = () => {
    const iconClass = `${getSizeClasses()} animate-spin`;
    
    switch (icon) {
      case 'calendar':
        return <Calendar className={iconClass} />;
      case 'users':
        return <Users className={iconClass} />;
      case 'ticket':
        return <Ticket className={iconClass} />;
      default:
        return <Loader2 className={iconClass} />;
    }
  };

  if (variant === 'page') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading FindMyEvent</h3>
            <p className="text-muted-foreground">
              {text || 'Please wait while we prepare your experience...'}
            </p>
          </div>
          
          {/* Loading animation */}
          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        {getIcon()}
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 space-y-4"
    >
      <div className="flex justify-center">
        {getIcon()}
      </div>
      {text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </motion.div>
  );
}

// Skeleton loading components for better UX
export function EventCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div className="h-48 bg-gray-300 dark:bg-gray-600" />
        <div className="p-4 space-y-3">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
          </div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}