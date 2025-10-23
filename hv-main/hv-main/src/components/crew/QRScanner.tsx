import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Camera, 
  X, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  MapPin,
  AlertTriangle,
  RefreshCw,
  Scan
} from 'lucide-react';
import { supabaseApi, Event, Ticket } from '../../utils/supabaseApi';
import { showToast } from '../../utils/toast';

// Define User interface locally to avoid import conflicts
interface User {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'organizer' | 'crew' | 'admin';
  college?: string;
  phone?: string;
  avatar?: string;
  interests?: string[];
  location?: string;
  verified: boolean;
  isOnboarded?: boolean;
  year?: string;
  createdAt: string;
  updatedAt: string;
}

interface QRScannerProps {
  onClose: () => void;
  onScanSuccess?: (ticket: Ticket, event: Event, user: User) => void;
}

interface ScanResult {
  valid: boolean;
  ticket?: Ticket;
  event?: Event;
  user?: User;
  message?: string;
}

export function QRScanner({ onClose, onScanSuccess }: QRScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Simulate camera access and show initial guidance
  useEffect(() => {
    // Show initial guidance about camera permissions
    const timer = setTimeout(() => {
      if (!scanning && !cameraError) {
        showToast.info('Click "Start Camera" to scan QR codes, or use manual input if camera access is unavailable.');
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera for QR scanning
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      streamRef.current = stream;
      setScanning(true);
      showToast.success('Camera started successfully!');
    } catch (error: any) {
      console.error('Camera access error:', error);
      setScanning(false);
      
      let errorMessage = 'Failed to access camera. ';
      let detailedError = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. ';
        detailedError = 'Please allow camera access in your browser settings and try again.';
        setCameraError('permission_denied');
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. ';
        detailedError = 'Please connect a camera or use manual QR code input.';
        setCameraError('no_camera');
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported. ';
        detailedError = 'Your browser or device doesn\'t support camera access.';
        setCameraError('not_supported');
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is busy. ';
        detailedError = 'Another application might be using the camera.';
        setCameraError('camera_busy');
      } else {
        detailedError = 'Please use manual QR code input instead.';
        setCameraError('unknown');
      }
      
      showToast.error(errorMessage + detailedError);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setCameraError(null);
  };

  const handleScan = async (qrCode: string) => {
    if (!qrCode.trim()) {
      showToast.error('Please enter a QR code');
      return;
    }

    try {
      // Verify the ticket
      const result = await supabaseApi.verifyTicket(qrCode);
      
      if (result.valid && result.ticket && result.event && result.user) {
        // Check if already used
        if (result.ticket.status === 'used') {
          const scanResult: ScanResult = {
            valid: false,
            ticket: result.ticket,
            event: result.event,
            user: result.user,
            message: 'Ticket already used'
          };
          setLastScanResult(scanResult);
          setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);
          showToast.error('Ticket has already been used!');
          return;
        }

        // Valid ticket - check it in
        const checkedIn = await supabaseApi.checkInTicket(qrCode);
        
        if (checkedIn) {
          const scanResult: ScanResult = {
            valid: true,
            ticket: result.ticket,
            event: result.event,
            user: result.user,
            message: 'Check-in successful'
          };
          
          setLastScanResult(scanResult);
          setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);
          onScanSuccess?.(result.ticket, result.event, result.user);
          showToast.success(`Welcome ${result.user.name}! Check-in successful.`);
        } else {
          showToast.error('Failed to check in ticket');
        }
      } else {
        const scanResult: ScanResult = {
          valid: false,
          message: 'Invalid or expired ticket'
        };
        setLastScanResult(scanResult);
        setScanHistory(prev => [scanResult, ...prev.slice(0, 9)]);
        showToast.error('Invalid QR code or ticket not found');
      }
    } catch (error) {
      showToast.error('Error verifying ticket');
      console.error('Scan error:', error);
    }

    setManualCode('');
  };

  const simulateScan = () => {
    // Generate a test QR code for demonstration
    const testCodes = [
      'QR_VALID123TEST',
      'QR_USED456TEST',
      'QR_INVALID789TEST'
    ];
    const randomCode = testCodes[Math.floor(Math.random() * testCodes.length)];
    setManualCode(randomCode);
    showToast.info('Simulated QR scan - click Verify to test');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Scan size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">QR Ticket Scanner</h2>
              <p className="text-sm text-muted-foreground">Scan tickets for event entry</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera size={20} />
                  <span>Camera Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Camera preview */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {scanning ? (
                    <div className="relative w-full h-full">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover rounded-lg"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-green-500 rounded-lg relative">
                          <div className="absolute inset-2 border border-green-300 rounded animate-pulse"></div>
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <Scan size={32} className="text-green-500 animate-pulse" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                        <p className="text-sm text-white bg-black/50 px-3 py-1 rounded-full">
                          Position QR code within frame
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      {cameraError ? (
                        <div className="space-y-3">
                          <AlertTriangle size={48} className="mx-auto text-orange-500" />
                          <div>
                            <p className="font-medium text-sm mb-2">Camera Access Issue</p>
                            {cameraError === 'permission_denied' && (
                              <div className="text-xs text-muted-foreground space-y-2">
                                <p>Camera permission was denied.</p>
                                <div className="text-left bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border">
                                  <p className="font-medium mb-1">To enable camera:</p>
                                  <ul className="space-y-1">
                                    <li>• Click the camera icon in your browser's address bar</li>
                                    <li>• Select "Allow" for camera access</li>
                                    <li>• Refresh the page if needed</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                            {cameraError === 'no_camera' && (
                              <p className="text-xs text-muted-foreground">No camera device found on this device.</p>
                            )}
                            {cameraError === 'not_supported' && (
                              <p className="text-xs text-muted-foreground">Camera access is not supported in this browser.</p>
                            )}
                            {cameraError === 'camera_busy' && (
                              <p className="text-xs text-muted-foreground">Camera is being used by another application.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Camera size={48} className="mx-auto mb-4 text-gray-400" />
                          <p className="text-sm text-muted-foreground">Camera not active</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {!scanning ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Camera size={16} className="mr-2" />
                      {cameraError ? 'Retry Camera' : 'Start Camera'}
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <X size={16} className="mr-2" />
                      Stop Camera
                    </Button>
                  )}
                  <Button onClick={simulateScan} variant="outline">
                    <RefreshCw size={16} className="mr-2" />
                    Simulate
                  </Button>
                </div>
                
                {cameraError === 'permission_denied' && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Camera Permission Required</p>
                        <p>For the best experience, allow camera access to scan QR codes quickly. You can still use manual input below.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Input */}
            <Card className={cameraError ? 'border-green-200 dark:border-green-800' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Manual QR Code Entry</span>
                  {cameraError && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      Recommended
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter QR code manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan(manualCode)}
                    className={cameraError ? 'border-green-300 dark:border-green-700' : ''}
                  />
                  <Button onClick={() => handleScan(manualCode)}>
                    Verify
                  </Button>
                </div>
                {cameraError ? (
                  <div className="text-xs space-y-2">
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ✓ Alternative method available
                    </p>
                    <p className="text-muted-foreground">
                      You can manually type or paste QR codes here. Ask attendees to show you their QR code text if the image scanner isn't working.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Use this if camera scanning is not available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {/* Camera Help Section */}
            {cameraError && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                    <AlertTriangle size={20} />
                    <span>Camera Troubleshooting</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium">Common solutions:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Refresh the page and try again</li>
                      <li>• Check if another tab is using the camera</li>
                      <li>• Make sure you're using HTTPS (secure connection)</li>
                      <li>• Clear browser cache and cookies</li>
                      <li>• Try a different browser (Chrome, Firefox, Safari)</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-200 font-medium text-xs">
                      💡 Manual input works just as well! Ask attendees for their QR code text.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Latest Scan Result */}
            {lastScanResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {lastScanResult.valid ? (
                      <CheckCircle size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                    <span>Scan Result</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lastScanResult.valid && lastScanResult.ticket && lastScanResult.event && lastScanResult.user ? (
                    <div className="space-y-3">
                      <Badge className="bg-green-600">Valid Ticket</Badge>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-500" />
                          <span className="font-medium">{lastScanResult.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span>{lastScanResult.event.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin size={16} className="text-gray-500" />
                          <span>{lastScanResult.event.venue}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          ✓ Check-in successful
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Badge variant="destructive">Invalid Ticket</Badge>
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle size={16} className="text-red-500" />
                          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                            {lastScanResult.message || 'Ticket verification failed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scan History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
              </CardHeader>
              <CardContent>
                {scanHistory.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {scanHistory.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                          result.valid 
                            ? 'bg-green-50 dark:bg-green-900/20' 
                            : 'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {result.valid ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : (
                            <XCircle size={14} className="text-red-500" />
                          )}
                          <span>
                            {result.user?.name || 'Unknown'} - {result.event?.title || 'Invalid'}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No scans yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {scanHistory.filter(s => s.valid).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Valid Scans</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {scanHistory.filter(s => !s.valid).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Invalid Scans</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}