
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard'); // Or intended URL
    } catch (error: any) {
      const knownAuthErrorCodes = ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'];
      if (error && typeof error.code === 'string' && knownAuthErrorCodes.includes(error.code)) {
        console.info(`Login attempt failed with code: ${error.code}`);
        toast({ title: 'Login Failed', description: 'Invalid email or password. Please try again.', variant: 'destructive' });
      } else {
        console.error('Login failed with an unexpected error:', error);
        toast({ title: 'Login Failed', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      // For OAuth providers like Google Sign-In, which use signInWithPopup:
      // 1. The `authDomain` in your Firebase config (src/lib/firebase.ts, loaded from secrets) MUST be
      //    `[YOUR_PROJECT_ID].firebaseapp.com`. For this project, it must be `nexverse-2cc70.firebaseapp.com`.
      //    Check browser console logs from `firebase.ts` to confirm this value.
      // 2. In the Firebase Console (Authentication > Sign-in method > Authorized domains),
      //    you MUST add `[YOUR_PROJECT_ID].firebaseapp.com` (i.e., `nexverse-2cc70.firebaseapp.com`) to the list.
      // 3. Your main application domain (e.g., `nexverse-2cc70.web.app` or your custom domain)
      //    MUST ALSO be in the "Authorized domains" list.
      // The `auth/unauthorized-domain` error means one of these conditions is not met.
      console.log('[NExVERSE Google Sign-In] Attempting sign-in. Using auth object with authDomain:', auth.config.authDomain);
      await signInWithPopup(auth, provider);
      toast({ title: 'Login Successful', description: 'Welcome!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This app's domain (e.g., nexverse-2cc70.web.app) OR the Firebase OAuth redirect domain (nexverse-2cc70.firebaseapp.com) is not authorized. Please check Firebase console settings under Authentication > Sign-in method > Authorized domains. Ensure BOTH domains are listed. Also verify the `authDomain` in your client-side Firebase config is `nexverse-2cc70.firebaseapp.com` (check browser console logs).";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup closed by user.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in popup request cancelled. Only one popup can be active at a time.";
      }
      toast({ title: 'Google Sign-In Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsGoogleLoading(false);
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log In
        </Button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
        )}
        Google
      </Button>
    </Form>
  );
}
