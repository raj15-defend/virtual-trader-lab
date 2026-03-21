import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useOTP = () => {
  const { profile } = useAuth();
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const sendOTP = useCallback(async (phone?: string) => {
    const phoneNumber = phone || profile?.phone_number;
    if (!phoneNumber) {
      toast.error('Please add a phone number to your profile first');
      return false;
    }

    setOtpSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { action: 'send', phone: phoneNumber },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setOtpSent(true);
      toast.success('OTP sent to your phone');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
      return false;
    } finally {
      setOtpSending(false);
    }
  }, [profile]);

  const verifyOTP = useCallback(async (otp: string) => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return false;
    }

    setOtpVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { action: 'verify', otp },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.verified) {
        setOtpVerified(true);
        toast.success('OTP verified successfully');
        return true;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'OTP verification failed');
      return false;
    } finally {
      setOtpVerifying(false);
    }
  }, []);

  const resetOTP = useCallback(() => {
    setOtpSent(false);
    setOtpVerified(false);
  }, []);

  return {
    otpSending,
    otpVerifying,
    otpSent,
    otpVerified,
    sendOTP,
    verifyOTP,
    resetOTP,
  };
};
