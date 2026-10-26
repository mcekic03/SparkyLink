import { useTranslation } from 'react-i18next'
import { LanguagesIcon } from 'lucide-react'
import { Button } from '@app/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@app/ui/components/dropdown-menu'
import { logOnFail } from '#/lib/log-on-fail'
import { LOCALES, currentLocale, isLocale, setLocale } from '#/lib/i18n'
import type { Locale } from '#/lib/i18n'

/**
 * Flags live in `public/`, not in the bundle: they are decoration for a choice
 * the label already states, so they should not sit in the JavaScript that has
 * to parse before anything renders.
 */
const FLAGS: Record<Locale, string> = {
  en: '/images/uk-flag.svg',
  sr: '/images/srb-flag.svg',
}

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const active = currentLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t('language.label')}
        >
          <LanguagesIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 p-1.5">
        <DropdownMenuLabel className="px-2 pt-1 pb-2 text-xs font-medium text-muted-foreground">
          {t('language.label')}
        </DropdownMenuLabel>
        {/*
          A radio group rather than plain items: this is one choice out of a
          fixed set, and the group is what gives each row `aria-checked` and the
          check mark, instead of the active row being conveyed by background
          colour alone.
        */}
        <DropdownMenuRadioGroup
          value={active}
          onValueChange={(value) => {
            if (!isLocale(value)) return
            logOnFail(() => setLocale(value), 'Language change failed')
          }}
        >
          {LOCALES.map((locale) => (
            <DropdownMenuRadioItem
              key={locale}
              value={locale}
              // The check is the only thing distinguishing the active row at a
              // glance, so it gets the accent colour rather than blending into
              // the text. On focus the item recolours its children anyway.
              className="gap-2.5 py-2 pl-2 [&_[data-slot=dropdown-menu-radio-item-indicator]]:text-brand-deep"
            >
              <img
                src={FLAGS[locale]}
                alt=""
                width={20}
                height={20}
                // Circular, so a 3:2 flag and a square one sit at the same
                // visual weight in the row; the ring keeps the white stripe of
                // either flag off a white menu.
                className="size-5 rounded-full object-cover ring-1 ring-border"
              />
              {/* The names are endonyms — a language is easiest to find under
                  the name its own speakers use, whatever the UI is set to. */}
              <span className="font-medium">{t(`language.${locale}`)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
