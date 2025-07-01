'use client';

import { useCallback } from 'react';

import type { SupabaseClient } from '@supabase/supabase-js';

import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { ImageUploader } from '@kit/ui/image-uploader';

import { updateWhiteLabelIconAction } from '~/lib/white-label/server-actions';

const LOGO_BUCKET = 'whitelabel_icon';

export function UpdateWhiteLabelSiteIcon(props: {
  id: string;
  pictureUrl: string | null;
}) {
  const client = useSupabase();

  const createToaster = useCallback((promise: () => Promise<unknown>) => {
    return toast.promise(promise, {
      success: 'White-label icon updated',
      error: 'Failed to update white-label icon',
      loading: 'Updating white-label icon...',
    });
  }, []);

  const onValueChange = useCallback(
    (file: File | null) => {
      const removeExistingStorageFile = () => {
        if (props.pictureUrl) {
          return (
            deleteProfilePhoto(client, props.pictureUrl) ?? Promise.resolve()
          );
        }

        return Promise.resolve();
      };

      if (file) {
        const promise = () =>
          removeExistingStorageFile().then(() =>
            uploadUserProfilePhoto(client, file, props.id).then((pictureUrl) =>
              updateWhiteLabelIconAction({
                accountId: props.id,
                iconUrl: pictureUrl,
              }),
            ),
          );

        createToaster(promise);
      }
    },
    [client, createToaster, props],
  );

  return (
    <ImageUploader
      value={props.pictureUrl}
      onValueChange={onValueChange}
      accept={'image/png'}
      square
    >
      <div className={'flex flex-col space-y-1'}>
        <span className={'text-sm'}>Upload an icon</span>

        <span className={'text-xs'}>Choose a 48x48 PNG for best quality.</span>
      </div>
    </ImageUploader>
  );
}

function deleteProfilePhoto(client: SupabaseClient, url: string) {
  const bucket = client.storage.from(LOGO_BUCKET);
  const fileName = url.split('/').pop()?.split('?')[0];

  if (!fileName) {
    return;
  }

  return bucket.remove([fileName]);
}

async function uploadUserProfilePhoto(
  client: SupabaseClient,
  photoFile: File,
  id: string,
) {
  const bytes = await photoFile.arrayBuffer();
  const bucket = client.storage.from(LOGO_BUCKET);
  const extension = photoFile.name.split('.').pop();
  const fileName = await getAvatarFileName(id, extension);

  const result = await bucket.upload(fileName, bytes);

  if (!result.error) {
    return bucket.getPublicUrl(fileName).data.publicUrl;
  }

  throw result.error;
}

async function getAvatarFileName(id: string, extension: string | undefined) {
  const { nanoid } = await import('nanoid');
  const uniqueId = nanoid(16);

  return `${id}.${extension}?v=${uniqueId}`;
}
