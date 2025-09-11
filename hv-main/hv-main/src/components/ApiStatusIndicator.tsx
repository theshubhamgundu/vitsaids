import { Badge } from './ui/badge';
import { Cloud, CloudOff } from 'lucide-react';

interface ApiStatusIndicatorProps {
  usingFallback: boolean;
  className?: string;
}

export function ApiStatusIndicator({ usingFallback, className = "" }: ApiStatusIndicatorProps) {
  if (!usingFallback) {
    return null; // Don't show anything when API is working
  }

  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-2 bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 ${className}`}
    >
      <CloudOff size={14} />
      Demo Mode
    </Badge>
  );
}