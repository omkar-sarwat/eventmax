// EventMax Checkout Page
// Complete payment flow with order summary and countdown timer

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Lock,
  Shield,
  ChevronLeft,
  Tag,
  Check,
  AlertCircle,
  User,
  Mail,
  Phone,
  Wallet,
  Smartphone
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import Spinner from '../components/atoms/Spinner';
import CountdownTimer from '../components/molecules/CountdownTimer';
import bookingService from '../services/bookingService';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatters';
import { cn } from '../utils/cn';

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    selectedSeats,
    selectedEvent,
    reservation,
    reservationToken,
    timeRemaining,
    hasReservation,
    totalPrice: contextTotalPrice,
    reserveSeats,
    confirmBooking: contextConfirmBooking,
    cancelReservation,
    clearBooking
  } = useBooking();

  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    upiId: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [isReserving, setIsReserving] = useState(false);

  // Update form data when user becomes available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || ''
      }));
    }
  }, [user]);

  // Redirect if no seats selected
  useEffect(() => {
    if (selectedSeats.length === 0 && !hasReservation) {
      navigate('/events');
    }
  }, [selectedSeats, hasReservation, navigate]);

  // Reserve seats on mount
  useEffect(() => {
    const doReservation = async () => {
      if (selectedSeats.length > 0 && !hasReservation && !isReserving) {
        setIsReserving(true);
        try {
          await reserveSeats();
        } catch (error) {
          console.error('Reservation failed:', error);
          setErrors({ submit: error.message || 'Failed to reserve seats. Please try again.' });
        } finally {
          setIsReserving(false);
        }
      }
    };
    doReservation();
  }, [selectedSeats.length, hasReservation, isReserving, reserveSeats]);

  // Confirm booking mutation
  const confirmMutation = useMutation({
    mutationFn: async (paymentData) => {
      // Split name into firstName and lastName
      const nameParts = (formData.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const customerData = {
        email: formData.email,
        firstName: firstName,
        lastName: lastName,
        phone: formData.phone,
      };
      return contextConfirmBooking(customerData, {
        method: paymentMethod,
        ...paymentData
      });
    },
    onSuccess: (data) => {
      navigate('/confirmation', { state: { booking: data } });
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Payment failed. Please try again.' });
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (paymentMethod === 'card') {
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      if (!formData.expiry) newErrors.expiry = 'Expiry date is required';
      if (!formData.cvv) newErrors.cvv = 'CVV is required';
    } else if (paymentMethod === 'upi') {
      if (!formData.upiId) newErrors.upiId = 'UPI ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep2()) {
      confirmMutation.mutate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      });
    }
  };

  const applyCoupon = () => {
    // Demo coupon logic
    if (couponCode.toUpperCase() === 'FIRST50') {
      setDiscount(50);
    } else if (couponCode.toUpperCase() === 'EVENTMAX20') {
      setDiscount(subtotal * 0.2);
    } else {
      setErrors(prev => ({ ...prev, coupon: 'Invalid coupon code' }));
    }
  };

  const handleExpiry = () => {
    cancelReservation();
    navigate('/events');
  };

  const subtotal = contextTotalPrice || selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  const convenienceFee = Math.round(subtotal * 0.02); // 2% convenience fee
  const total = subtotal + convenienceFee - discount;

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'wallet', name: 'Wallet', icon: Wallet },
  ];

  // Show loading while reserving seats
  if (isReserving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Reserving your seats...</p>
        </div>
      </div>
    );
  }

  if (selectedSeats.length === 0 && !hasReservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => step === 1 ? navigate(-1) : setStep(1)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Secure Checkout
                </h1>
                <p className="text-sm text-gray-500">
                  Step {step} of 2
                </p>
              </div>
            </div>

            {/* Countdown Timer */}
            {hasReservation && timeRemaining !== null && timeRemaining > 0 && (
              <CountdownTimer
                timeRemaining={timeRemaining}
                variant="box"
                onExpiry={handleExpiry}
              />
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom">
          <div className="flex">
            <div className={cn(
              'flex-1 py-3 text-center border-b-2 transition-colors',
              step >= 1 ? 'border-primary text-primary' : 'border-gray-200 text-gray-400'
            )}>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className={cn(
              'flex-1 py-3 text-center border-b-2 transition-colors',
              step >= 2 ? 'border-primary text-primary' : 'border-gray-200 text-gray-400'
            )}>
              <span className="text-sm font-medium">Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Contact Details */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Contact Details
                  </h2>

                  {/* Reservation Error Message */}
                  {errors.submit && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 mb-6">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {errors.submit}
                    </div>
                  )}

                  <div className="space-y-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      icon={<User className="w-5 h-5" />}
                      error={errors.name}
                      required
                    />

                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      icon={<Mail className="w-5 h-5" />}
                      error={errors.email}
                      required
                      helperText="E-tickets will be sent to this email"
                    />

                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      icon={<Phone className="w-5 h-5" />}
                      error={errors.phone}
                      required
                    />
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-6"
                    onClick={handleNext}
                  >
                    Continue to Payment
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Payment Methods */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Payment Method
                    </h2>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-center',
                            paymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <method.icon className={cn(
                            'w-6 h-6 mx-auto mb-2',
                            paymentMethod === method.id ? 'text-primary' : 'text-gray-400'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            paymentMethod === method.id ? 'text-primary' : 'text-gray-600'
                          )}>
                            {method.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Card Form */}
                    {paymentMethod === 'card' && (
                      <div className="space-y-4">
                        <Input
                          label="Card Number"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          icon={<CreditCard className="w-5 h-5" />}
                          error={errors.cardNumber}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Expiry Date"
                            name="expiry"
                            value={formData.expiry}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            error={errors.expiry}
                          />
                          <Input
                            label="CVV"
                            name="cvv"
                            type="password"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="•••"
                            error={errors.cvv}
                          />
                        </div>
                      </div>
                    )}

                    {/* UPI Form */}
                    {paymentMethod === 'upi' && (
                      <Input
                        label="UPI ID"
                        name="upiId"
                        value={formData.upiId}
                        onChange={handleInputChange}
                        placeholder="yourname@upi"
                        icon={<Smartphone className="w-5 h-5" />}
                        error={errors.upiId}
                      />
                    )}

                    {/* Wallet */}
                    {paymentMethod === 'wallet' && (
                      <div className="text-center py-8">
                        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Pay using your EventMax wallet
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Wallet balance: {formatPrice(0)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      Have a coupon?
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        error={errors.coupon}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={applyCoupon}
                      >
                        Apply
                      </Button>
                    </div>
                    {discount > 0 && (
                      <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Coupon applied! You save {formatPrice(discount)}
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {errors.submit && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {errors.submit}
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={confirmMutation.isPending}
                    leftIcon={<Lock className="w-5 h-5" />}
                  >
                    Pay {formatPrice(total)}
                  </Button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">
                      Secured by 256-bit SSL encryption
                    </span>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-32">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Event Info */}
              <div className="pb-4 border-b border-gray-100">
                <p className="font-medium text-gray-900">
                  {selectedSeats[0]?.eventTitle || 'Event'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedSeats.length} ticket(s)
                </p>
              </div>

              {/* Seats */}
              <div className="py-4 border-b border-gray-100 max-h-48 overflow-y-auto">
                {selectedSeats.map((seat) => (
                  <div key={seat.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">
                      Row {seat.row_number || seat.row}, Seat {seat.seat_number || seat.number}
                    </span>
                    <span className="text-gray-900">{formatPrice(seat.price || 0)}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Convenience Fee</span>
                  <span className="text-gray-900">{formatPrice(convenienceFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
