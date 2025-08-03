import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const CreateAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  agencyId: z.string().uuid(),
  planId: z.string().min(1), // Changed from UUID to any string (signup code)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, agencyId, planId } = CreateAccountSchema.parse(body);

    const adminClient = getSupabaseServerAdminClient();
    const client = getSupabaseServerClient();

    // Check if the signup code exists and is valid
    const { data: codeEntry, error: codeError } = await adminClient
      .from('signup_codes')
      .select('id, enabled, max_usage, expires_at, whitelabel_host_account_id')
      .eq('code', planId) // planId is actually the signup code
      .eq('enabled', true)
      .maybeSingle();

    if (!codeEntry || codeError) {
      return NextResponse.json(
        { error: 'Invalid signup code' },
        { status: 400 }
      );
    }

    // Check usage limits
    const { count, error: countError } = await adminClient
      .from('signup_code_usages')
      .select('id', { count: 'exact', head: true })
      .eq('signup_code_id', codeEntry.id);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to count signup code usage' },
        { status: 500 }
      );
    }

    if (
      codeEntry.max_usage !== null &&
      count &&
      count >= codeEntry.max_usage
    ) {
      return NextResponse.json(
        { error: 'This signup code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check expiration
    if (
      codeEntry.expires_at !== null &&
      new Date(codeEntry.expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'This signup code has expired' },
        { status: 400 }
      );
    }

    // Create the user account
    const { data: createData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    // Track signup code usage
    await adminClient.from('signup_code_usages').insert({
      signup_code_id: codeEntry.id,
      account_id: createData.user.id,
      whitelabel_host_account_id: codeEntry.whitelabel_host_account_id,
    });

    // Set the whitelabel host account
    await adminClient
      .from('accounts')
      .update({
        whitelabel_host_account_id: codeEntry.whitelabel_host_account_id,
      })
      .eq('id', createData.user.id);

    // Sign in the user
    const signInData = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData.error) {
      return NextResponse.json(
        { error: signInData.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: createData.user.id,
      session: signInData.data.session,
    });

  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
} 