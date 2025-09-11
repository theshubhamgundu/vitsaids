import { toast } from 'sonner';

// Global de-duplication for toasts to avoid multiples across rapid calls
const lastShownAt = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 1500;

function makeKey(kind: string, message: string, id?: string) {
  return `${kind}::${id || ''}::${message}`;
}

function canShow(kind: string, message: string, id?: string, cooldownMs: number = DEFAULT_COOLDOWN_MS) {
  const key = makeKey(kind, message, id);
  const now = Date.now();
  const last = lastShownAt.get(key) || 0;
  if (now - last < cooldownMs) return { allowed: false, key };
  lastShownAt.set(key, now);
  return { allowed: true, key };
}

// Toast utility functions with consistent styling and behavior
export const showToast = {
  success: (message: string, options?: { duration?: number; id?: string; cooldownMs?: number }) => {
    const { allowed } = canShow('success', message, options?.id, options?.cooldownMs);
    if (!allowed) return;
    return toast.success(message, {
      duration: options?.duration || 4000,
      id: options?.id || makeKey('success', message),
      style: {
        background: '#10b981',
        color: 'white',
        border: 'none'
      }
    });
  },

  error: (message: string, options?: { duration?: number; id?: string; cooldownMs?: number }) => {
    const { allowed } = canShow('error', message, options?.id, options?.cooldownMs);
    if (!allowed) return;
    return toast.error(message, {
      duration: options?.duration || 5000,
      id: options?.id || makeKey('error', message),
      style: {
        background: '#ef4444',
        color: 'white',
        border: 'none'
      }
    });
  },

  loading: (message: string, options?: { id?: string }) => {
    // Loading is keyed; do not spam if same id already present
    const key = options?.id || makeKey('loading', message);
    const { allowed } = canShow('loading', message, key, 250); // shorter cooldown
    if (!allowed) return;
    return toast.loading(message, {
      id: key,
      style: {
        background: '#6366f1',
        color: 'white',
        border: 'none'
      }
    });
  },

  info: (message: string, options?: { duration?: number; id?: string; cooldownMs?: number }) => {
    const { allowed } = canShow('info', message, options?.id, options?.cooldownMs);
    if (!allowed) return;
    return toast.info(message, {
      duration: options?.duration || 4000,
      id: options?.id || makeKey('info', message),
      style: {
        background: '#3b82f6',
        color: 'white',
        border: 'none'
      }
    });
  },

  warning: (message: string, options?: { duration?: number; id?: string; cooldownMs?: number }) => {
    const { allowed } = canShow('warning', message, options?.id, options?.cooldownMs);
    if (!allowed) return;
    return toast.warning(message, {
      duration: options?.duration || 4000,
      id: options?.id || makeKey('warning', message),
      style: {
        background: '#f59e0b',
        color: 'white',
        border: 'none'
      }
    });
  },

  // Specific toast messages for common actions
  auth: {
    loginSuccess: (name?: string) => 
      showToast.success(`Welcome back${name ? `, ${name}` : ''}! 🎉`, { id: 'auth_login_success' }),
    loginError: () => 
      showToast.error('Login failed. Please check your credentials.', { id: 'auth_login_error' }),
    signupSuccess: () => 
      showToast.success('Account created successfully! Welcome to FindMyEvent! 🎉', { id: 'auth_signup_success' }),
    signupError: (error?: string) => 
      showToast.error(error || 'Failed to create account. Please try again.', { id: 'auth_signup_error' }),
    logoutSuccess: () => 
      showToast.info('You have been logged out successfully.', { id: 'auth_logout_success' }),
    sessionExpired: () => 
      showToast.warning('Your session has expired. Please log in again.', { id: 'auth_session_expired' })
  },

  events: {
    registrationSuccess: (eventName: string) => 
      showToast.success(`Successfully registered for ${eventName}! 🎫`, { id: 'event_register_success' }),
    registrationError: () => 
      showToast.error('Failed to register for event. Please try again.', { id: 'event_register_error' }),
    createSuccess: (eventName: string) => 
      showToast.success(`Event "${eventName}" created successfully! 🎉`, { id: 'event_create_success' }),
    createError: () => 
      showToast.error('Failed to create event. Please check all required fields.', { id: 'event_create_error' }),
    updateSuccess: () => 
      showToast.success('Event updated successfully!', { id: 'event_update_success' }),
    updateError: () => 
      showToast.error('Failed to update event. Please try again.', { id: 'event_update_error' }),
    deleteSuccess: () => 
      showToast.success('Event deleted successfully.', { id: 'event_delete_success' }),
    deleteError: () => 
      showToast.error('Failed to delete event. Please try again.', { id: 'event_delete_error' })
  },

  payment: {
    processing: () => 
      showToast.loading('Processing your payment...', { id: 'payment' }),
    success: (amount: number) => 
      showToast.success(`Payment of ₹${amount} completed successfully! 💳`, { id: 'payment' }),
    failed: () => 
      showToast.error('Payment failed. Please try again or use a different payment method.', { id: 'payment' }),
    cancelled: () => 
      showToast.info('Payment cancelled.', { id: 'payment' })
  },

  profile: {
    updateSuccess: () => 
      showToast.success('Profile updated successfully!', { id: 'profile_update_success' }),
    updateError: () => 
      showToast.error('Failed to update profile. Please try again.', { id: 'profile_update_error' }),
    photoUploadSuccess: () => 
      showToast.success('Profile photo updated successfully!', { id: 'profile_photo_success' }),
    photoUploadError: () => 
      showToast.error('Failed to upload photo. Please try again.', { id: 'profile_photo_error' })
  },

  verification: {
    pending: () => 
      showToast.info('Verification submitted. We will review your documents within 24-48 hours.', { id: 'verification_pending' }),
    approved: () => 
      showToast.success('Congratulations! Your organizer account has been verified! 🎉', { id: 'verification_approved' }),
    rejected: (reason?: string) => 
      showToast.error(`Verification rejected${reason ? `: ${reason}` : '. Please resubmit with correct documents.'}`, { id: 'verification_rejected' }),
    documentsUploaded: () => 
      showToast.success('Documents uploaded successfully!', { id: 'verification_docs_uploaded' })
  },

  crew: {
    checkinSuccess: (attendeeName: string) => 
      showToast.success(`${attendeeName} checked in successfully! ✅`, { id: 'crew_checkin_success' }),
    checkinError: () => 
      showToast.error('Failed to check in attendee. Please try again.', { id: 'crew_checkin_error' }),
    scanError: () => 
      showToast.error('Invalid QR code. Please try scanning again.', { id: 'crew_scan_error' }),
    alreadyCheckedIn: (attendeeName: string) => 
      showToast.warning(`${attendeeName} is already checked in.`, { id: 'crew_already_checked_in' })
  },

  tickets: {
    generateSuccess: () => 
      showToast.success('Ticket generated successfully! 🎫', { id: 'ticket_generate_success' }),
    generateError: () => 
      showToast.error('Failed to generate ticket. Please try again.', { id: 'ticket_generate_error' }),
    downloadSuccess: () => 
      showToast.success('Ticket downloaded successfully!', { id: 'ticket_download_success' }),
    downloadError: () => 
      showToast.error('Failed to download ticket. Please try again.', { id: 'ticket_download_error' })
  },

  admin: {
    organizerApproved: (organizerName: string) => 
      showToast.success(`${organizerName} has been approved as an organizer.`, { id: 'admin_organizer_approved' }),
    organizerRejected: (organizerName: string) => 
      showToast.info(`${organizerName}'s organizer application has been rejected.`, { id: 'admin_organizer_rejected' }),
    eventModerated: (action: 'approved' | 'rejected', eventName: string) => 
      showToast.success(`Event "${eventName}" has been ${action}.`, { id: 'admin_event_moderated' })
  },

  network: {
    offline: () => 
      showToast.warning('You are offline. Some features may not work properly.', { id: 'network_offline', cooldownMs: 5000 }),
    online: () => 
      showToast.info('You are back online!', { id: 'network_online', cooldownMs: 5000 }),
    slowConnection: () => 
      showToast.warning('Slow internet connection detected. Please be patient.', { id: 'network_slow', cooldownMs: 10000 }),
    serverError: () => 
      showToast.error('Server error occurred. Please try again later.', { id: 'network_server_error', cooldownMs: 5000 })
  }
};

// Export individual toast functions for backward compatibility
export const { success, error, loading, info, warning } = showToast;

// Export raw toast for direct usage
export { toast } from 'sonner';