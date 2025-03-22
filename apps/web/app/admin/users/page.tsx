import { ServerDataLoader } from '@makerkit/data-loader-supabase-nextjs';

import { AdminAccountsTable } from '@kit/admin/components/admin-accounts-table';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody, PageHeader } from '@kit/ui/page';

interface SearchParams {
  page?: string;
  query?: string;
}

interface AdminUsersPageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = {
  title: `Users`,
};

async function UsersPage(props: AdminUsersPageProps) {
  const client = getSupabaseServerAdminClient();
  const searchParams = await props.searchParams;

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const filters = getFilters(searchParams);

  return (
    <>
      <PageHeader description={<AppBreadcrumbs />} />

      <PageBody>
        <ServerDataLoader
          table={'accounts'}
          client={client}
          page={page}
          where={{ is_personal_account: { eq: true }, ...filters }}
        >
          {({ data, page, pageSize, pageCount }) => {
            return (
              <AdminAccountsTable
                page={page}
                pageSize={pageSize}
                pageCount={pageCount}
                data={data}
                isPersonal={true}
              />
            );
          }}
        </ServerDataLoader>
      </PageBody>
    </>
  );
}

function getFilters(params: SearchParams) {
  const filters: Record<
    string,
    {
      eq?: boolean | string;
      like?: string;
    }
  > = {};

  if (params.query) {
    filters.name = {
      like: `%${params.query}%`,
    };
  }

  return filters;
}

export default AdminGuard(UsersPage);
