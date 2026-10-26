import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@app/ui/components/command'
import { useVisibleNavigation } from './sidebar/use-navigation'
import { logOnFail } from '#/lib/log-on-fail'
import type { NavPath } from '#/lib/navigation'

/** Opens on ⌘K / Ctrl+K, over the same registry the sidebar renders. */
export function CommandPalette() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const groups = useVisibleNavigation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return

      event.preventDefault()
      setOpen((previous) => !previous)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(to: NavPath) {
    setOpen(false)
    logOnFail(() => navigate({ to }), 'Command palette navigation failed', {
      to,
    })
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('nav.commandPalette.title')}
      description={t('nav.commandPalette.description')}
    >
      {/* This CommandDialog renders children straight into DialogContent, so
          cmdk's context has to come from here. */}
      <Command>
        <CommandInput placeholder={t('nav.commandPalette.placeholder')} />
        <CommandList>
          <CommandEmpty>{t('nav.commandPalette.empty')}</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group.labelKey} heading={t(group.labelKey)}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.to}
                  // cmdk filters on `value`; the path is in it so "/users" hits.
                  value={`${t(item.titleKey)} ${item.to}`}
                  onSelect={() => go(item.to)}
                >
                  <item.icon />
                  <span>{t(item.titleKey)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
