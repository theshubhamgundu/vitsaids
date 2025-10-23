import { motion } from 'motion/react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface AuthStatusIndicatorProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  actions?: React.ReactNode;
}

export function AuthStatusIndicator({ type, title, message, actions }: AuthStatusIndicatorProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-800 dark:text-green-300',
          message: 'text-green-700 dark:text-green-400',
          IconComponent: CheckCircle
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-800 dark:text-red-300',
          message: 'text-red-700 dark:text-red-400',
          IconComponent: AlertCircle
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          title: 'text-amber-800 dark:text-amber-300',
          message: 'text-amber-700 dark:text-amber-400',
          IconComponent: AlertCircle
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-800 dark:text-blue-300',
          message: 'text-blue-700 dark:text-blue-400',
          IconComponent: Info
        };
    }
  };

  const styles = getStyles();
  const { IconComponent } = styles;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-lg border ${styles.container}`}
    >
      <div className="flex items-start space-x-3">
        <IconComponent className={`h-5 w-5 mt-0.5 ${styles.icon}`} />
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${styles.title}`}>{title}</h4>
          <p className={`text-sm mt-1 ${styles.message}`}>{message}</p>
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}