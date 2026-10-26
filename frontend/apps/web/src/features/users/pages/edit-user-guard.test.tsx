/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { renderRouter } from '#/test/router'
import userEvent from '@testing-library/user-event'
import { useForm, useStore } from '@tanstack/react-form'
import { InputField } from '@app/ui/components/fields'
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from '#/components/unsaved-changes'

/**
 * The edit form's registration, in miniature.
 *
 * The guard shipped wired to nothing: `useUnsavedChanges` had no caller outside
 * its own test, so `isDirty` was permanently false and neither the dialog nor
 * the blocker could ever fire. A test that renders a provider and a form of its
 * own would have passed throughout. This asserts the join instead — that typing
 * in a form marks the app dirty — which is the part that was missing.
 */
function EditLikeForm() {
  const form = useForm({ defaultValues: { name: 'Ada' } })
  const isDirty = useStore(form.store, (state) => state.isDirty)
  useUnsavedChanges(isDirty)

  return (
    <>
      <InputField form={form} name="name" label="Name" />
      <span data-testid="dirty">{isDirty ? 'dirty' : 'clean'}</span>
    </>
  )
}

describe('the edit form and the unsaved-changes guard', () => {
  it('reports itself dirty once a field is edited', async () => {
    // The provider mounts the blocker, which needs a router above it.
    const rootRoute = createRootRoute({
      component: () => (
        <UnsavedChangesProvider>
          <EditLikeForm />
        </UnsavedChangesProvider>
      ),
    })
    renderRouter(
      createRouter({
        routeTree: rootRoute.addChildren([
          createRoute({ getParentRoute: () => rootRoute, path: '/' }),
        ]),
        history: createMemoryHistory({ initialEntries: ['/'] }),
      }),
    )

    expect(await screen.findByTestId('dirty')).toHaveTextContent('clean')

    await userEvent.type(screen.getByLabelText('Name'), '!')
    expect(screen.getByTestId('dirty')).toHaveTextContent('dirty')
  })
})
