import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Shield, 
  Lock, 
  CheckCircle,
  XCircle,
  Loader2,
  QrCode,
  Wallet,
  ArrowLeft
} from 'lucide-react';

interface PaymentInterfaceProps {
  eventTitle: string;
  eventPrice: number;
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentInterface({ 
  eventTitle, 
  eventPrice, 
  eventId, 
  onSuccess,
  onCancel 
}: PaymentInterfaceProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'confirmation'>('method');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: '',
    agreeToTerms: false
  });

  const convenienceFee = Math.round(eventPrice * 0.02); // 2% convenience fee
  const totalAmount = eventPrice + convenienceFee;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
        toast.error('Please fill all card details');
        return false;
      }
      if (formData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!formData.upiId) {
        toast.error('Please enter your UPI ID');
        return false;
      }
      if (!formData.upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID');
        return false;
      }
    }

    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return false;
    }

    return true;
  };

  const processPayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    toast.loading('Processing payment...', { id: 'payment-processing' });

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock payment success (90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        toast.success('Payment successful! Your ticket has been confirmed.', { 
          id: 'payment-processing',
          duration: 5000 
        });
        setPaymentStep('confirmation');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.', { 
        id: 'payment-processing',
        duration: 5000 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  if (paymentStep === 'confirmation') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto"
      >
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Your ticket for {eventTitle} has been confirmed.
            </p>
            <Badge className="bg-green-600 mb-4">
              Transaction ID: TXN{Date.now()}
            </Badge>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>A confirmation email has been sent to your registered email.</p>
              <p>Please show your ticket QR code at the event venue.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel} className="p-0">
          <ArrowLeft size={20} className="mr-2" />
          Back to Event
        </Button>
        <div className="flex items-center space-x-2">
          <Shield size={16} className="text-green-600" />
          <span className="text-sm text-green-600 font-medium">Secure Payment</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          {paymentStep === 'method' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Choose Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center space-x-3 cursor-pointer flex-1">
                          <CreditCard size={20} className="text-blue-600" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-muted-foreground">Visa, Mastercard, RuPay</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="upi" id="upi" />
                        <Label htmlFor="upi" className="flex items-center space-x-3 cursor-pointer flex-1">
                          <Smartphone size={20} className="text-purple-600" />
                          <div>
                            <p className="font-medium">UPI</p>
                            <p className="text-sm text-muted-foreground">PhonePe, GPay, Paytm, BHIM</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                        <RadioGroupItem value="wallet" id="wallet" disabled />
                        <Label htmlFor="wallet" className="flex items-center space-x-3 cursor-pointer flex-1">
                          <Wallet size={20} className="text-orange-600" />
                          <div>
                            <p className="font-medium">Digital Wallet</p>
                            <p className="text-sm text-muted-foreground">Coming Soon</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                        <RadioGroupItem value="netbanking" id="netbanking" disabled />
                        <Label htmlFor="netbanking" className="flex items-center space-x-3 cursor-pointer flex-1">
                          <Banknote size={20} className="text-green-600" />
                          <div>
                            <p className="font-medium">Net Banking</p>
                            <p className="text-sm text-muted-foreground">Coming Soon</p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="mt-6">
                    <Button 
                      onClick={() => setPaymentStep('details')} 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payment Details */}
          {paymentStep === 'details' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {paymentMethod === 'card' ? (
                      <CreditCard size={20} className="mr-2" />
                    ) : (
                      <Smartphone size={20} className="mr-2" />
                    )}
                    {paymentMethod === 'card' ? 'Card Details' : 'UPI Details'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethod === 'card' && (
                    <>
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                          maxLength={19}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            placeholder="MM/YY"
                            value={formData.expiryDate}
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, '');
                              if (value.length >= 2) {
                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                              }
                              handleInputChange('expiryDate', value);
                            }}
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            placeholder="123"
                            type="password"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value.replace(/\D/g, ''))}
                            maxLength={3}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="cardholderName">Cardholder Name</Label>
                        <Input
                          id="cardholderName"
                          placeholder="John Doe"
                          value={formData.cardholderName}
                          onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === 'upi' && (
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="yourname@paytm"
                        value={formData.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Enter your UPI ID (e.g., yourname@paytm, yourname@okaxis)
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                      }
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the <span className="text-blue-600 underline cursor-pointer">terms and conditions</span> and <span className="text-blue-600 underline cursor-pointer">privacy policy</span>
                    </Label>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setPaymentStep('method')}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={processPayment}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock size={16} className="mr-2" />
                          Pay ₹{totalAmount}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{eventTitle}</h4>
                <p className="text-sm text-muted-foreground">Event Ticket</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Ticket Price</span>
                  <span>₹{eventPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Convenience Fee</span>
                  <span className="text-muted-foreground">₹{convenienceFee}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-600">
                  <Shield size={16} />
                  <span className="text-sm font-medium">100% Secure Payment</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Your payment information is encrypted and secure
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle size={14} className="text-green-600" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle size={14} className="text-green-600" />
                <span>PCI DSS compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CheckCircle size={14} className="text-green-600" />
                <span>Secure payment gateway</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}