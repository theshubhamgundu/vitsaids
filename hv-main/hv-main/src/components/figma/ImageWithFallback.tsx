import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Image failed to load:', props.src)
    setDidError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const { src, alt, style, className, ...rest } = props

  if (didError || !src) {
    return (
      <div
        className={`inline-block bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-gray-400 dark:text-gray-500">
            <svg width="48" height="48" viewBox="0 0 88 88" className="mx-auto mb-2">
              <rect x="16" y="16" width="56" height="56" rx="6" fill="none" stroke="currentColor" strokeWidth="3.7"/>
              <path d="m16 58 16-18 32 32" fill="none" stroke="currentColor" strokeWidth="3.7"/>
              <circle cx="53" cy="35" r="7" fill="none" stroke="currentColor" strokeWidth="3.7"/>
            </svg>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ''}`} style={style}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse rounded" />
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`${className ?? ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={isLoading ? {} : style}
        {...rest} 
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}
