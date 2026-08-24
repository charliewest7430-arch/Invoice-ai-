import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile } from '../types';
import { defaultEmailService } from '../services/emailService';

// Primary production origin for live deployments
const PRODUCTION_APP_URL = 'https://www.invoiceflowai.cloud';

/**
 * Returns the target redirect URL for auth callbacks (password reset, email verification, etc.).
 * If running on or deployed to production (or if APP_URL / VITE_APP_URL is specified), prefers
 * https://www.invoiceflowai.cloud, while gracefully supporting localhost or dev preview environments.
 */
export const getAuthRedirectUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Check explicit environment override if configured
  const envUrl = import.meta.env.VITE_APP_URL || import.meta.env.APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) {
    return `${envUrl.replace(/\/+$/, '')}${cleanPath}`;
  }

  // 2. If running on the live production domain or hostname
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (
      hostname === 'www.invoiceflowai.cloud' ||
      hostname === 'invoiceflowai.cloud'
    ) {
      return `${PRODUCTION_APP_URL}${cleanPath}`;
    }

    // If running on an AI Studio preview or cloud run container, but the live site is intended for production resets,
    // we default production resets to https://www.invoiceflowai.cloud unless explicitly running on localhost
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      return `${PRODUCTION_APP_URL}${cleanPath}`;
    }

    return `${window.location.origin}${cleanPath}`;
  }

  return `${PRODUCTION_APP_URL}${cleanPath}`;
};

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
  signUp: (email: string, pass: string, fullName: string, businessName?: string) => Promise<{ success: boolean; error?: string }>;
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
      console.info('[Auth] syncUserAndProfile: Checking active session and user...');
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
        console.info('[Auth] Auth callback tokens/parameters detected in URL');
        localStorage.removeItem('invoiceflow_demo_active');

        // Exchange PKCE authorization code if present in search query
        if (searchStr.includes('code=')) {
          const searchParams = new URLSearchParams(searchStr);
          const code = searchParams.get('code');
          if (code) {
            try {
              console.info('[Auth] Exchanging PKCE code for session...');
              await supabase.auth.exchangeCodeForSession(code);
            } catch (exErr) {
              console.warn('[Auth] PKCE exchange notice:', exErr);
            }
          }
        } else {
          // Trigger session retrieval for implicit token hash
          try {
            await supabase.auth.getSession();
          } catch (sessErr) {
            console.warn('[Auth] Session retrieval notice:', sessErr);
          }
        }
      }

      // Verify authenticated user with Supabase Auth
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (currentUser && !userError) {
        console.info('[Auth] Verified active Supabase user session:', {
          userId: currentUser.id,
          emailConfirmed: Boolean(currentUser.confirmed_at || currentUser.email_confirmed_at),
        });
        setUser(currentUser);
        setIsDemoUser(false);
        localStorage.removeItem('invoiceflow_demo_active');
        await fetchAndEnsureProfile(currentUser);

        // Clean up URL if auth parameters were present
        if (hasAuthParamsInUrl) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        const savedDemo = localStorage.getItem('invoiceflow_demo_active');
        if (savedDemo === 'true' && !hasAuthParamsInUrl) {
          console.info('[Auth] Restoring saved demo mode');
          setUser(DEMO_USER);
          setProfile(DEMO_PROFILE);
          setIsDemoUser(true);
        } else {
          console.info('[Auth] No active session found. Routing to unauthenticated state.');
          setUser(null);
          setProfile(null);
          setIsDemoUser(false);
        }
      }
    } catch (err) {
      console.error('[Auth] Error syncing auth and profile:', err);
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
        console.info(`[Auth Debug] session changed because onAuthStateChange: ${event}`, {
          hasSession: Boolean(session),
          userId: session?.user?.id,
        });

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (session?.user) {
          // Use supabase.auth.getUser() to verify identity
          const { data: { user: verifiedUser } } = await supabase.auth.getUser();
          const activeUser = verifiedUser || session.user;
          setUser(activeUser);
          setIsDemoUser(false);
          localStorage.removeItem('invoiceflow_demo_active');
          await fetchAndEnsureProfile(activeUser);

          if (
            window.location.hash.includes('access_token=') ||
            window.location.hash.includes('type=') ||
            window.location.search.includes('code=')
          ) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else if (event === 'SIGNED_OUT') {
          console.info('[Auth Debug] SIGNED_OUT received');
          console.info('[Auth Debug] clearing user because user explicitly signed out');
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
      console.warn('[Signup Debug] Supabase authentication is not configured');
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
          emailRedirectTo: getAuthRedirectUrl('/'),
        },
      });

      const hasUser = Boolean(data?.user);
      const hasSession = Boolean(data?.session);

      console.info('[Signup Debug] 3. Supabase response received');
      console.info(`[Signup Debug] 4. hasUser = ${hasUser} (id: ${data?.user?.id || 'none'})`);
      console.info(`[Signup Debug] 5. hasSession = ${hasSession}`);

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
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setLoading(false);
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }

      if (data?.user) {
        const activeUser = data.user;
        console.info('[Auth Debug] Account successfully created in Supabase. Setting user and initializing profile/business.');
        
        // Directly establish authenticated state
        setUser(activeUser);
        setIsDemoUser(false);
        localStorage.removeItem('invoiceflow_demo_active');

        // Initialize Profile
        const newProfile: Profile = {
          id: activeUser.id,
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
          console.warn('[Auth] Profiles upsert notice:', e);
        }
        setProfile(newProfile);

        // Initialize Business
        const defaultBizName = cleanBiz || (cleanName ? `${cleanName}'s Business` : 'My Business');
        try {
          await supabase.from('businesses').upsert({
            user_id: activeUser.id,
            name: defaultBizName,
            email: cleanEmail,
            default_currency: 'USD',
            invoice_prefix: 'INV-',
            next_invoice_number: 1001,
            payment_terms: 'Due on receipt',
          });
        } catch (e) {
          console.warn('[Auth] Businesses upsert notice:', e);
        }

        // Initialize default free subscription
        try {
          await supabase.from('subscriptions').upsert({
            user_id: activeUser.id,
            plan: 'free',
            status: 'active',
          });
        } catch (e) {
          console.warn('[Auth] Subscriptions upsert notice:', e);
        }

        // Initialize default reminder settings
        try {
          await supabase.from('reminder_settings').upsert({
            user_id: activeUser.id,
            enabled: true,
            first_reminder_days: 1,
            second_reminder_days: 7,
            final_reminder_days: 14,
            max_reminders: 3,
          });
        } catch (e) {
          console.warn('[Auth] Reminder settings notice:', e);
        }

        // Fire background welcome email if not already dispatched in this session
        const dedupeKey = activeUser.id || cleanEmail;
        if (!dispatchedWelcomeUserIds.has(dedupeKey)) {
          dispatchedWelcomeUserIds.add(dedupeKey);
          dispatchedWelcomeUserIds.add(cleanEmail);

          defaultEmailService.sendWelcomeEmail({
            to: { email: cleanEmail, name: cleanName },
            userId: activeUser.id,
            businessName: cleanBiz,
          }).catch((err) => {
            console.warn('[Auth] Non-blocking welcome email delivery notice:', err);
          });
        }

        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Failed to create user account. Please try again.' };
    } catch (err: any) {
      console.error('[Auth] Sign up error:', err);
      setLoading(false);
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    const cleanEmail = email.trim();
    console.info('[Auth] Sign-in initiated', { email: cleanEmail });

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

      console.info('[Auth] Supabase signIn response received', {
        hasUser: Boolean(data?.user),
        userId: data?.user?.id,
        hasSession: Boolean(data?.session),
        hasError: Boolean(error),
        errorMessage: error?.message,
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

        console.info('[Auth] Sign-in successful. Setting user session and loading profile.');
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
      console.error('[Auth] Sign in error:', err);
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
      const redirectUrl = getAuthRedirectUrl('/reset-password');
      console.info('[Auth Debug] Dispatching resetPasswordForEmail with redirectTo:', redirectUrl);
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
    if (!isSupabaseConfigured || !supabase) {
      console.warn('[Auth Debug] updatePassword: Supabase is not configured');
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.',
      };
    }

    try {
      console.info('[Auth Debug] Calling supabase.auth.updateUser with new password...');
      const { data: sessionData } = await supabase.auth.getSession();
      console.info('[Auth Debug] updatePassword session verification:', {
        hasSession: Boolean(sessionData?.session),
        hasUser: Boolean(sessionData?.session?.user),
        userId: sessionData?.session?.user?.id,
      });

      if (!sessionData?.session) {
        console.warn('[Auth Debug] updatePassword failed: No active Supabase recovery session found.');
        return {
          success: false,
          error: 'Your password reset session is missing or expired. Please click the reset link in your email again or request a new one.',
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.info('[Auth Debug] supabase.auth.updateUser response:', {
        hasUser: Boolean(data?.user),
        userId: data?.user?.id,
        hasError: Boolean(error),
        errorMessage: error?.message,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data?.user) {
        return { success: false, error: 'Password update did not return an updated user. Please try again.' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Auth Debug] updatePassword exception:', err);
      return { success: false, error: err?.message || 'An unexpected error occurred while updating your password.' };
    }
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
