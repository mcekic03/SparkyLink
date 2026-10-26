import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from '@tanstack/react-router'
import { Button } from '@app/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@app/ui/components/dialog'
import type { ReactNode } from 'react'

interface UnsavedChangesContext {
  register: (id: string) => void
  unregister: (id: string) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContext | null>(null)

/** A set rather than a boolean, so two dirty forms don't clear each other. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [dirtyCount, setDirtyCount] = useState(0)
  const dirty = useRef(new Set<string>())

  const register = useCallback((id: string) => {
    if (dirty.current.has(id)) return
    dirty.current.add(id)
    setDirtyCount(dirty.current.size)
  }, [])

  const unregister = useCallback((id: string) => {
    if (!dirty.current.delete(id)) return
    setDirtyCount(dirty.current.size)
  }, [])

  const value = useMemo(
    () => ({ register, unregister }),
    [register, unregister],
  )

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <UnsavedChangesDialog isDirty={dirtyCount > 0} />
    </UnsavedChangesContext.Provider>
  )
}

/** Blocks navigation away from a form with pending edits. */
export function useUnsavedChanges(isDirty: boolean) {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error(
      'useUnsavedChanges must be used within an UnsavedChangesProvider',
    )
  }

  const { register, unregister } = context
  const id = useId()

  useEffect(() => {
    if (isDirty) register(id)

    // Unconditional: flipping isDirty to false runs this before the next
    // effect, so a form that saves stops blocking without unmounting.
    return () => unregister(id)
  }, [id, isDirty, register, unregister])
}

function UnsavedChangesDialog({ isDirty }: { isDirty: boolean }) {
  const { t } = useTranslation()

  const { status, proceed, reset } = useBlocker({
    shouldBlockFn: () => isDirty,
    // Ruter ga podrazumevano uključuje za svaki postavljeni blokator, a ovaj je
    // uvek postavljen, pa bi pregledač pitao „Napustiti sajt?“ pri svakom
    // osvežavanju, i bez nesačuvanih izmena.
    enableBeforeUnload: false,
    withResolver: true,
  })

  // Deliberately no `beforeunload`. It is the one prompt an app cannot own:
  // browsers ignore the message and forbid custom UI, so a reload or a tab
  // close would put a grey system dialog in front of an app that otherwise
  // asks for itself. The trade is real — leaving by reload, back, or closing
  // the tab drops pending edits without a word — and it is the trade this
  // project has chosen by ruling browser dialogs out.

  return (
    <Dialog
      open={status === 'blocked'}
      onOpenChange={(open) => {
        if (!open) reset?.()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('unsavedChanges.title')}</DialogTitle>
          <DialogDescription>
            {t('unsavedChanges.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => reset?.()}>
            {t('unsavedChanges.stay')}
          </Button>
          <Button variant="destructive" onClick={() => proceed?.()}>
            {t('unsavedChanges.leave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
