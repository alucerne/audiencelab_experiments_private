'use client';

import { FormEventHandler, useCallback } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { Input } from '@kit/ui/input';

function DataTableSearch({
  query,
  itemName,
}: React.PropsWithChildren<{
  query: string;
  itemName?: string;
}>) {
  const router = useRouter();
  const pathName = usePathname();

  const onSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    (event) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const queryValue = formData.get('query') as string;

      const currentUrl = new URL(window.location.href);
      const searchParams = new URLSearchParams(currentUrl.search);
      searchParams.delete('selected');

      if (queryValue.trim() === '') {
        searchParams.delete('query');
      } else {
        searchParams.set('query', queryValue);
      }

      const newUrl = pathName + '?' + searchParams.toString();
      router.push(newUrl);
    },
    [pathName, router],
  );

  return (
    <form className={'w-full max-w-xs'} onSubmit={onSubmit}>
      <Input
        defaultValue={query}
        name={'query'}
        className={'w-full'}
        placeholder={`Search for ${itemName ?? 'row'}...`}
      />
    </form>
  );
}

export default DataTableSearch;
