'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { useAppEvents } from '@kit/shared/events';
import { useSignUpWithEmailAndPassword } from '@kit/supabase/hooks/use-sign-up-with-email-password';

type SignUpCredentials = {
  email: string;
  password: string;
};

type UseSignUpFlowProps = {
  emailRedirectTo: string;
  onSignUp?: (userId?: string) => unknown;
  captchaToken?: string;
  resetCaptchaToken?: () => void;
  code?: string;
  inviteToken?: string;
  joinTeamPath: string;
};

/**
 * @name usePasswordSignUpFlow
 * @description
 * This hook is used to handle the sign up flow using the email and password method.
 */
export function usePasswordSignUpFlow({
  emailRedirectTo: _emailRedirectTo,
  onSignUp,
  captchaToken: _captchaToken,
  resetCaptchaToken,
  code,
  inviteToken,
  joinTeamPath,
}: UseSignUpFlowProps) {
  const router = useRouter();
  const signUpMutation = useSignUpWithEmailAndPassword();
  const appEvents = useAppEvents();

  const signUp = useCallback(
    async (credentials: SignUpCredentials) => {
      if (signUpMutation.isPending) {
        return;
      }

      try {
        const data = await signUpMutation.mutateAsync({
          ...credentials,
          code,
          inviteToken,
          joinTeamPath,
        });

        // emit event to track sign up
        appEvents.emit({
          type: 'user.signedUp',
          payload: {
            method: 'password',
          },
        });

        // Update URL with success status. This is useful for password managers
        // to understand that the form was submitted successfully.
        const url = new URL(window.location.href);
        url.searchParams.set('status', 'success');
        router.replace(url.pathname + url.search);

        if (onSignUp) {
          onSignUp(data.user?.id);
        }
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        resetCaptchaToken?.();
      }
    },
    [
      signUpMutation,
      code,
      inviteToken,
      joinTeamPath,
      appEvents,
      router,
      onSignUp,
      resetCaptchaToken,
    ],
  );

  return {
    signUp,
    loading: signUpMutation.isPending,
    error: signUpMutation.error,
    showVerifyEmailAlert: false,
  };
}
