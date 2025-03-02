import {
  renderAccountDeleteEmail,
  renderInviteEmail,
  renderOtpEmail,
} from '@kit/email-templates';

export async function loadEmailTemplate(id: string) {
  switch (id) {
    case 'account-delete-email':
      return renderAccountDeleteEmail({
        productName: 'Audience Lab',
        userDisplayName: 'Giancarlo',
      });

    case 'invite-email':
      return renderInviteEmail({
        teamName: 'Audience Lab',
        teamLogo: '',
        inviter: 'Giancarlo',
        invitedUserEmail: 'test@audiencelab.io',
        link: 'https://audiencelab.io',
        productName: 'Audience Lab',
      });

    case 'otp-email':
      return renderOtpEmail({
        productName: 'Audience Lab',
        otp: '123456',
      });

    case 'magic-link-email':
      return loadFromFileSystem('magic-link');

    case 'reset-password-email':
      return loadFromFileSystem('reset-password');

    case 'change-email-address-email':
      return loadFromFileSystem('change-email-address');

    case 'confirm-email':
      return loadFromFileSystem('confirm-email');

    default:
      throw new Error(`Email template not found: ${id}`);
  }
}

async function loadFromFileSystem(fileName: string) {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');

  const filePath = join(
    process.cwd(),
    `../web/supabase/templates/${fileName}.html`,
  );

  return {
    html: readFileSync(filePath, 'utf8'),
  };
}
