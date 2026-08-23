import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile } from '../types';
import { defaultEmailService } from '../services/emailService';

// In-memory set to prevent double execution within the same browser session / React lifecycle
const dispatchedWelcomeUserIds = new Set<string>();

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemoUser: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (value: boolean) => void;
  signUp: (email: string, pass: string, fullName: string, businessName?: string) => Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  enableDemoMode: () => void;
  verifySupabaseSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'usr_demo_882910',
  app_metadata: {},
  user_metadata: { full_name: 'Alex Morgan' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'alex.morgan@example.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  id: 'usr_demo_882910',
  email: 'alex.morgan@example.com',
  full_name: 'Alex Morgan',
  role: 'owner',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(
    window.location.pathname === '/reset-password' ||
    window.location.hash.includes('type=recovery') ||
    window.location.search.includes('type=recovery')
  );

  const fetchAndEnsureProfile = async (authUser: User): Promise<Profile | null> => {
    if (!supabase) return null;
    try {
      // 1. Load user's profile from profiles table using authenticated user's ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && data.full_name) {
        setProfile(data);
        return data;
      }

      // If profile record missing or full_name is empty, construct and save profile
      const fullName =
        data?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        'User';

      const newProfile: Profile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: fullName,
        role: 'owner',
        created_at: new Date().toISOString(),
      };

      const { data: upsertedData } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .maybeSingle();

      const finalProfile = upsertedData || newProfile;
      setProfile(finalProfile);
      return finalProfile;
    } catch (err) {
      console.error('Fetch profile error:', err);
      const fallbackProfile: Profile = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        role: 'owner',
        created_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const syncUserAndProfile = async () => {
    setLoading(true);
    if (!isSupabaseConfigured || !supabase) {
      const savedDemo = localStorage.getItem('invoiceflow_demo_active');
      if (savedDemo === 'true') {
        setUser(DEMO_USER);
        setProfile(DEMO_PROFILE);
        setIsDemoUser(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsDemoUser(false);
      }
      setLoading(false);
      return;
    }

    try {
      // Check if URL hash or query contains Supabase authentication callback tokens or codes
      const hashStr = window.location.hash;
      const searchStr = window.location.search;
      const hasAuthParamsInUrl =
        hashStr.includes('access_token=') ||
        hashStr.includes('refresh_token=') ||
        hashStr.includes('type=') ||
        hashStr.includes('error=') ||
        searchStr.includes('code=');

      if (hasAuthParamsInUrl) {
        localStorage.removeItem('invoiceflow_demo_active');
      }

      // Verify authenticated user with Supabase Auth
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (currentUser && !userError) {
        setUser(currentUser);
        setIsDemoUser(false);
        localStorage.removeItem('invoiceflow_demo_active');
        await fetchAndEnsureProfile(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setIsDemoUser(false);
      }
    } catch (err) {
      console.error('Error syncing auth and profile:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncUserAndProfile();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (session?.user) {
          // Requirement 1: Use supabase.auth.getUser() to verify identity
          const { data: { user: verifiedUser } } = await supabase.auth.getUser();
          const activeUser = verifiedUser || session.user;
          setUser(activeUser);
          setIsDemoUser(false);
          localStorage.removeItem('invoiceflow_demo_active');
          await fetchAndEnsureProfile(activeUser);

          if (window.location.hash.includes('access_token=') || window.location.hash.includes('type=') || window.location.search.includes('code=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsDemoUser(false);
          setIsPasswordRecovery(false);
          localStorage.removeItem('invoiceflow_demo_active');
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signUp = async (email: string, pass: string, fullName: string, businessName?: string) => {
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanName = fullName.trim();
    const cleanBiz = businessName?.trim() || '';

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: { full_name: cleanName, business_name: cleanBiz },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setLoading(false);
        const errMsg = error.message.toLowerCase();
        if (
          errMsg.includes('already registered') ||
          errMsg.includes('user already exists') ||
          errMsg.includes('already exists') ||
          error.status === 422
        ) {
          return {
            success: false,
            error: 'An account with this email already exists. Please sign in instead.',
          };
        }
        return { success: false, error: error.message };
      }

      // Supabase email-enumeration protection: If user already exists, Supabase returns data.user with empty identities array
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setLoading(false);
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }

      if (data.user) {
        const isEmailConfirmationRequired = !data.session && !data.user.confirmed_at && !data.user.email_confirmed_at;

        // If a valid session is created immediately (auto-confirm enabled)
        if (data.session || !isEmailConfirmationRequired) {
          setUser(data.user);
          setIsDemoUser(false);
          localStorage.removeItem('invoiceflow_demo_active');

          // Initialize Profile
          const newProfile: Profile = {
            id: data.user.id,
            email: cleanEmail,
            full_name: cleanName || 'User',
            role: 'owner',
            created_at: new Date().toISOString(),
            welcome_email_sent: true,
            welcome_email_sent_at: new Date().toISOString(),
          };

          try {
            await supabase.from('profiles').upsert(newProfile);
          } catch (e) {
            console.warn('Profiles upsert notice:', e);
          }
          setProfile(newProfile);

          // Initialize Business
          const defaultBizName = cleanBiz || (cleanName ? `${cleanName}'s Business` : 'My Business');
          try {
            await supabase.from('businesses').upsert({
              user_id: data.user.id,
              name: defaultBizName,
              email: cleanEmail,
              default_currency: 'USD',
              invoice_prefix: 'INV-',
              next_invoice_number: 1001,
              payment_terms: 'Due on receipt',
            });
          } catch (e) {
            console.warn('Businesses upsert notice:', e);
          }

          // Initialize default free subscription
          try {
            await supabase.from('subscriptions').upsert({
              user_id: data.user.id,
              plan: 'free',
              status: 'active',
            });
          } catch (e) {
            console.warn('Subscriptions upsert notice:', e);
          }

          // Initialize default reminder settings
          try {
            await supabase.from('reminder_settings').upsert({
              user_id: data.user.id,
              enabled: true,
              first_reminder_days: 1,
              second_reminder_days: 7,
              final_reminder_days: 14,
              max_reminders: 3,
            });
          } catch (e) {
            console.warn('Reminder settings notice:', e);
          }
        }

        // Fire background welcome email if not already dispatched in this session
        const dedupeKey = data.user.id || cleanEmail;
        if (!dispatchedWelcomeUserIds.has(dedupeKey)) {
          dispatchedWelcomeUserIds.add(dedupeKey);
          dispatchedWelcomeUserIds.add(cleanEmail);

          defaultEmailService.sendWelcomeEmail({
            to: { email: cleanEmail, name: cleanName },
            userId: data.user.id,
            businessName: cleanBiz,
          }).catch((err) => {
            console.warn('Non-blocking welcome email delivery notice:', err);
          });
        }

        setLoading(false);
        return {
          success: true,
          emailConfirmationRequired: isEmailConfirmationRequired,
        };
      }

      setLoading(false);
      return { success: false, error: 'Failed to create user account. Please try again.' };
    } catch (err: any) {
      console.error('Sign up error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim();

    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        setLoading(false);
        const errMsg = error.message.toLowerCase();
        if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid_credentials')) {
          return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
        }
        if (errMsg.includes('email not confirmed')) {
          return { success: false, error: 'Please verify your email address before signing in.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser();
        const currentUser = verifiedUser || data.user;

        setUser(currentUser);
        setIsDemoUser(false);
        localStorage.removeItem('invoiceflow_demo_active');
        await fetchAndEnsureProfile(currentUser);

        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Sign in failed. Please try again.' };
    } catch (err: any) {
      console.error('Sign in error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out:', err);
      }
    }

    // Requirement 6: Clear all user-specific React state & profile on logout
    setUser(null);
    setProfile(null);
    setIsDemoUser(false);
    setIsPasswordRecovery(false);
    localStorage.removeItem('invoiceflow_demo_active');
    setLoading(false);
  };

  const resetPasswordForEmail = async (emailToReset: string) => {
    if (isSupabaseConfigured && supabase) {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: redirectUrl,
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  };

  const updatePassword = async (newPassword: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { success: false, error: error.message };
      }
    }
    return { success: true };
  };

  const verifySupabaseSession = async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase) {
      return Boolean(user && !isDemoUser);
    }
    try {
      const { data: { user: verifiedUser }, error } = await supabase.auth.getUser();
      return Boolean(verifiedUser && !error);
    } catch {
      return false;
    }
  };

  const enableDemoMode = () => {
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
    setIsDemoUser(true);
    localStorage.setItem('invoiceflow_demo_active', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isDemoUser,
        isAuthenticated: Boolean(user && !isDemoUser),
        isPasswordRecovery,
        setIsPasswordRecovery,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        enableDemoMode,
        verifySupabaseSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
