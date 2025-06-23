import Link from 'next/link';

import { Menu } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';

export function AdminMobileNavigation() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Menu className={'h-8 w-8'} />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem>
          <Link href={'/admin'}>Teams</Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href={'/admin/users'}>Accounts</Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href={'/admin/signup-links'}>Signup Links</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
