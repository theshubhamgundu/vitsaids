import { ImageWithFallback } from './figma/ImageWithFallback';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon - Use a stylized 'F' with gradient background */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">
          F
        </span>
      </div>
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
          FindMyEvent
        </span>
      )}
    </div>
  );
}