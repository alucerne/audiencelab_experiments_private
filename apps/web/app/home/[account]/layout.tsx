import { use } from 'react';

import { cookies } from 'next/headers';
import Script from 'next/script';

import { TeamAccountWorkspaceContextProvider } from '@kit/team-accounts/components';
import {
  Page,
  PageLayoutStyle,
  PageMobileNavigation,
  PageNavigation,
} from '@kit/ui/page';
import { SidebarProvider } from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { getTeamAccountSidebarConfig } from '~/config/team-account-navigation.config';
import { withI18n } from '~/lib/i18n/with-i18n';

import RestrictedDialog from './_components/restricted-dialog';
// local imports
import { TeamAccountLayoutMobileNavigation } from './_components/team-account-layout-mobile-navigation';
import { TeamAccountLayoutSidebar } from './_components/team-account-layout-sidebar';
import { TeamAccountNavigationMenu } from './_components/team-account-navigation-menu';
import { loadTeamWorkspace } from './_lib/server/team-account-workspace.loader';

type TeamWorkspaceLayoutProps = React.PropsWithChildren<{
  params: Promise<{ account: string }>;
}>;

function TeamWorkspaceLayout({ children, params }: TeamWorkspaceLayoutProps) {
  const account = use(params).account;
  const state = use(getLayoutState(account));

  if (state.style === 'sidebar') {
    return <SidebarLayout account={account}>{children}</SidebarLayout>;
  }

  return <HeaderLayout account={account}>{children}</HeaderLayout>;
}

function SidebarLayout({
  account,
  children,
}: React.PropsWithChildren<{
  account: string;
}>) {
  const data = use(loadTeamWorkspace(account));
  const state = use(getLayoutState(account));

  const accounts = data.accounts.map(({ name, slug, picture_url }) => ({
    label: name,
    value: slug,
    image: picture_url,
  }));

  return (
    <TeamAccountWorkspaceContextProvider value={data}>
      <SidebarProvider defaultOpen={state.open}>
        <Page style={'sidebar'}>
          <PageNavigation>
            <TeamAccountLayoutSidebar
              account={account}
              accountId={data.account.id}
              accounts={accounts}
              user={data.user}
              isWhiteLabelHost={data.account.is_whitelabel_host}
            />
          </PageNavigation>

          <PageMobileNavigation className={'flex items-center justify-between'}>
            <AppLogo />

            <div className={'flex space-x-4'}>
              <TeamAccountLayoutMobileNavigation
                userId={data.user.id}
                accounts={accounts}
                account={account}
              />
            </div>
          </PageMobileNavigation>

          <>
            {children}
            <RestrictedDialog restricted={data.account.restricted} />
            <Script id="crisp-chat">
              {`window.$crisp=[];
                window.CRISP_WEBSITE_ID="6517cb99-e657-430f-9db0-88e9bb65648f";
                (function(){
                  const d = document;
                  const s = d.createElement("script");
                  s.src="https://client.crisp.chat/l.js";
                  s.async=1;
                  d.getElementsByTagName("head")[0].appendChild(s);
                })();
              `}
            </Script>
          </>
        </Page>
      </SidebarProvider>
    </TeamAccountWorkspaceContextProvider>
  );
}

function HeaderLayout({
  account,
  children,
}: React.PropsWithChildren<{
  account: string;
}>) {
  const data = use(loadTeamWorkspace(account));

  const accounts = data.accounts.map(({ name, slug, picture_url }) => ({
    label: name,
    value: slug,
    image: picture_url,
  }));

  return (
    <TeamAccountWorkspaceContextProvider value={data}>
      <Page style={'header'}>
        <PageNavigation>
          <TeamAccountNavigationMenu workspace={data} />
        </PageNavigation>

        <PageMobileNavigation className={'flex items-center justify-between'}>
          <AppLogo />

          <div className={'group-data-[mobile:hidden]'}>
            <TeamAccountLayoutMobileNavigation
              userId={data.user.id}
              accounts={accounts}
              account={account}
            />
          </div>
        </PageMobileNavigation>

        {children}
      </Page>
    </TeamAccountWorkspaceContextProvider>
  );
}

async function getLayoutState(account: string) {
  const cookieStore = await cookies();
  const sidebarOpenCookie = cookieStore.get('sidebar:state');
  const layoutCookie = cookieStore.get('layout-style');

  const layoutStyle = layoutCookie?.value as PageLayoutStyle;
  const config = getTeamAccountSidebarConfig(account);

  const sidebarOpenCookieValue = sidebarOpenCookie
    ? sidebarOpenCookie.value === 'false'
    : !config.sidebarCollapsed;

  return {
    open: sidebarOpenCookieValue,
    style: layoutStyle ?? config.style,
  };
}

export default withI18n(TeamWorkspaceLayout);
