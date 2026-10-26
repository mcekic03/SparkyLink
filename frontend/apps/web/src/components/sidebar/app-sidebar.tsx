import { Link } from '@tanstack/react-router'
import type { ComponentProps } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@app/ui/components/sidebar'
import { NavMain } from './nav-main'
import { NavUser } from './nav-user'
import { useVisibleNavigation } from './use-navigation'
import { environment } from '#/config/environment'
import { useTranslation } from 'react-i18next'

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const groups = useVisibleNavigation()
  const { t } = useTranslation()

  return (
    <Sidebar
      variant="sidebar"
      className="border-r border-sidebar-border"
      {...props}
    >
      <SidebarHeader className="border-b px-3 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-11 rounded-md px-2 hover:bg-sidebar-accent/50"
              asChild
            >
              <Link to="/">
                <img src="/icons/icon-192.png" alt="" className="size-8 rounded-md" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {environment.appName}
                  </span>
                  <span className="truncate text-[0.65rem] text-sidebar-foreground/50">
                    {t('nav.workspace')}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} />
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
