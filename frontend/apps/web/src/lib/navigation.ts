import {
  Building2,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ParseKeys } from 'i18next'
import type { FileRouteTypes } from '#/routeTree.gen'

/** Static destinations only — a nav link has nothing to fill a `$param` from. */
export type NavPath = Exclude<FileRouteTypes['to'], `${string}$${string}`>

export interface NavItem {
  to: NavPath
  titleKey: ParseKeys
  icon: LucideIcon
}

export interface NavGroup {
  labelKey: ParseKeys
  items: readonly NavItem[]
}

/** Roles are deliberately absent — `canAccessPath` reads them off the routes. */
export const NAVIGATION: readonly NavGroup[] = [
  {
    labelKey: 'nav.groups.general',
    items: [
      { to: '/dashboard', titleKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/gradilista', titleKey: 'nav.sites', icon: Building2 },
      { to: '/racuni', titleKey: 'nav.receipts', icon: ReceiptText },
      { to: '/cenovnik', titleKey: 'nav.priceList', icon: Tags },
    ],
  },
  {
    labelKey: 'nav.groups.administration',
    items: [
      { to: '/podesavanja', titleKey: 'nav.settings', icon: Settings },
    ],
  },
]

export function visibleNavigation(
  groups: readonly NavGroup[],
  canAccess: (to: NavPath) => boolean,
): readonly NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(item.to)),
    }))
    .filter((group) => group.items.length > 0)
}
