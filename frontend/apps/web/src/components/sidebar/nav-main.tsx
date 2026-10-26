import { useTranslation } from 'react-i18next'
import { Link, useMatchRoute } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@app/ui/components/sidebar'
import type { NavGroup } from '#/lib/navigation'

export function NavMain({ groups }: { groups: readonly NavGroup[] }) {
  const { t } = useTranslation()
  const matchRoute = useMatchRoute()

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.labelKey} className="px-2 py-3">
          <SidebarGroupLabel className="px-2 text-[0.65rem] font-semibold tracking-[0.08em] text-sidebar-foreground/45 uppercase">
            {t(group.labelKey)}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {group.items.map((item) => {
              const title = t(item.titleKey)
              // Fuzzy, so a detail page keeps its section highlighted.
              const isActive = Boolean(matchRoute({ to: item.to, fuzzy: true }))

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={title}
                    className="h-8 rounded-md px-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4"
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
