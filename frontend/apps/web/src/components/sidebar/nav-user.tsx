import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { ChevronsUpDown, LogOut } from 'lucide-react'

import { Avatar, AvatarFallback } from '@app/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@app/ui/components/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@app/ui/components/sidebar'
import { useAuth } from '#/lib/auth-context'
import { logOnFail } from '#/lib/log-on-fail'
import { logger } from '#/lib/logger'
import { revokeSession } from '#/lib/auth-logout'

export function NavUser() {
  const { t } = useTranslation()
  const { isMobile } = useSidebar()
  const auth = useAuth()
  const router = useRouter()

  const name = auth.user?.name ?? ''
  const email = auth.user?.email ?? ''
  const initials = name.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    // Best effort: the token is revoked on the server, but a failed call must
    // not keep the user signed in locally.
    try {
      await revokeSession()
    } catch (err) {
      logger.warn({ err }, 'Server-side logout failed; clearing local session')
    }
    auth.logout()
    await router.invalidate()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-11 rounded-md px-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-xs font-medium text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/55">
                  {email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logOnFail(handleLogout, 'Logout failed')}
            >
              <LogOut />
              {t('common.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
