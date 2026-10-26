import { Outlet } from '@tanstack/react-router'
import { useFocusOnNavigate } from '#/lib/use-focus-on-navigate'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@app/ui/components/sidebar'
import { AppSidebar } from '#/components/sidebar/app-sidebar'
import { Separator } from '@app/ui/components/separator'
import { LanguageSwitcher } from '#/components/language-switcher'
import { ThemeToggle } from '#/components/theme-toggle'
import { CommandPalette } from '#/components/command-palette'
import { UnsavedChangesProvider } from '#/components/unsaved-changes'

export function AuthedLayout() {
  const contentRef = useFocusOnNavigate<HTMLElement>()

  return (
    <UnsavedChangesProvider>
      <div className="min-h-screen bg-background">
        <SidebarProvider>
          <CommandPalette />
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden bg-background">
            <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center gap-2 border-b bg-card">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
              </div>
              <div className="ml-auto flex items-center gap-2 px-4">
                <ThemeToggle />
                <LanguageSwitcher />
              </div>
            </header>
            <main
              ref={contentRef}
              tabIndex={-1}
              className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 outline-none sm:p-5 lg:p-6"
            >
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </UnsavedChangesProvider>
  )
}
