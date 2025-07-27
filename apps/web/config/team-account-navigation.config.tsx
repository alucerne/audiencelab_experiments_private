import {
  Activity,
  BookUser,
  CodeXml,
  CreditCard,
  FileChartColumn,
  House,
  KeyRound,
  LayoutTemplate,
  Plug,
  Settings,
  UserSearch,
  Users,
} from 'lucide-react';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import featureFlagsConfig from '~/config/feature-flags.config';
import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const getRoutes = (account: string, isWhiteLabelHost: boolean) => [
  {
    label: 'Audience',
    children: [
      {
        label: 'Audience Lists',
        path: pathsConfig.app.accountHome.replace('[account]', account),
        Icon: <BookUser className={iconClasses} />,
        end: true,
      },
      {
        label: 'Enrichment',
        path: pathsConfig.app.accountEnrichment.replace('[account]', account),
        Icon: <UserSearch className={iconClasses} />,
      },
    ],
  },
  {
    label: 'Integrations',
    children: [
      {
        label: 'Pixel',
        path: pathsConfig.app.accountPixel.replace('[account]', account),
        Icon: <CodeXml className={iconClasses} />,
      },
      {
        label: 'Sync',
        path: pathsConfig.app.accountSync.replace('[account]', account),
        Icon: <Plug className={iconClasses} />,
      },
    ],
  },
  ...(isWhiteLabelHost
    ? [
        {
          label: 'White-label',
          children: [
            {
              label: 'Credits',
              path: pathsConfig.app.accountWhiteLabel.replace(
                '[account]',
                account,
              ),
              Icon: <House className={iconClasses} />,
              end: true,
            },
            {
              label: 'Teams',
              path: pathsConfig.app.accountWhiteLabelTeams.replace(
                '[account]',
                account,
              ),
              Icon: <FileChartColumn className={iconClasses} />,
            },
            {
              label: 'Branding',
              path: pathsConfig.app.accountWhiteLabelBranding.replace(
                '[account]',
                account,
              ),
              Icon: <LayoutTemplate className={iconClasses} />,
            },
          ],
        },
      ]
    : []),
  {
    label: 'common:routes.settings',
    collapsible: false,
    children: [
      {
        label: 'Usage',
        path: createPath(pathsConfig.app.accountUsage, account),
        Icon: <Activity className={iconClasses} />,
      },
      {
        label: 'common:routes.settings',
        path: createPath(pathsConfig.app.accountSettings, account),
        Icon: <Settings className={iconClasses} />,
      },
      {
        label: 'common:routes.members',
        path: createPath(pathsConfig.app.accountMembers, account),
        Icon: <Users className={iconClasses} />,
      },
      featureFlagsConfig.enableTeamAccountBilling
        ? {
            label: 'common:routes.billing',
            path: createPath(pathsConfig.app.accountBilling, account),
            Icon: <CreditCard className={iconClasses} />,
          }
        : undefined,
      {
        label: 'API Keys',
        path: createPath(pathsConfig.app.accountApiKeys, account),
        Icon: <KeyRound className={iconClasses} />,
      },
    ].filter(Boolean),
  },
];

export function getTeamAccountSidebarConfig(
  account: string,
  isWhiteLabelHost = false,
) {
  return NavigationConfigSchema.parse({
    routes: getRoutes(account, isWhiteLabelHost),
    style: process.env.NEXT_PUBLIC_TEAM_NAVIGATION_STYLE,
    sidebarCollapsed: process.env.NEXT_PUBLIC_TEAM_SIDEBAR_COLLAPSED,
    sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSED_STYLE,
  });
}

function createPath(path: string, account: string) {
  return path.replace('[account]', account);
}
