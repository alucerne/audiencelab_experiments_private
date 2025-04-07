import { useMutation } from '@tanstack/react-query';

import { signupAction } from '../server/server-actions';

interface Credentials {
  email: string;
  password: string;
  code?: string;
  inviteToken?: string;
  joinTeamPath: string;
}

export function useSignUpWithEmailAndPassword() {
  const mutationKey = ['auth', 'sign-up-with-email-password'];

  const mutationFn = async (params: Credentials) => {
    const response = await signupAction(params);

    const user = response.data?.user;
    const identities = user?.identities ?? [];

    // if the user has no identities, it means that the email is taken
    if (identities.length === 0) {
      throw new Error('User already registered');
    }

    return response.data;
  };

  return useMutation({
    mutationKey,
    mutationFn,
  });
}
