/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import {
  InputField,
  MultiSelectField,
  RadioGroupField,
  SelectField,
  SwitchField,
  TextareaField,
} from '@app/ui/components/fields'

const OPTIONS = [
  { label: 'Admin', value: '2' },
  { label: 'User', value: '3' },
]

interface BoundHarnessValues {
  bio: string
  email: string
  role: string
}

function useBoundHarnessForm(defaultValues: Partial<BoundHarnessValues>) {
  return useForm({
    defaultValues: { bio: '', email: '', role: '', ...defaultValues },
  })
}

type BoundHarnessForm = ReturnType<typeof useBoundHarnessForm>

/** Renders a field bound to a real form and exposes the live values. */
function BoundHarness({
  children,
  defaultValues,
}: {
  defaultValues: Partial<BoundHarnessValues>
  children: (form: BoundHarnessForm) => ReactNode
}) {
  const form = useBoundHarnessForm(defaultValues)
  return (
    <>
      {children(form)}
      {/* form.state is not reactive in a parent; Subscribe is how it re-renders. */}
      <form.Subscribe selector={(state) => state.values}>
        {(values) => (
          <output data-testid="values">{JSON.stringify(values)}</output>
        )}
      </form.Subscribe>
    </>
  )
}

describe('field wrappers — standalone mode', () => {
  it('renders a label bound to the control', () => {
    render(<InputField label="Email" value="" onChange={() => undefined} />)
    expect(screen.getByLabelText('Email')).toBeVisible()
  })

  it('reports typing through onChange', async () => {
    const onChange = vi.fn()
    render(<InputField label="Email" value="" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Email'), 'a')

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('shows an error when given one', () => {
    render(
      <InputField
        label="Email"
        value=""
        onChange={() => undefined}
        error="Already taken"
      />,
    )
    expect(screen.getByText('Already taken')).toBeVisible()
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  // Without a form there is no field name to derive an id from, so the label
  // would stop pointing at anything.
  it('generates an id when no name is given', () => {
    render(<InputField label="Email" value="" onChange={() => undefined} />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('id')
  })

  it('toggles a switch', async () => {
    const onChange = vi.fn()
    render(<SwitchField label="Active" value={false} onChange={onChange} />)

    await userEvent.click(screen.getByRole('switch'))

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('selects a radio option', async () => {
    const onChange = vi.fn()
    render(
      <RadioGroupField
        label="Role"
        options={OPTIONS}
        value=""
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByLabelText('Admin'))

    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('opens a select and reports the chosen option', async () => {
    const onChange = vi.fn()
    render(
      <SelectField
        label="Role"
        options={OPTIONS}
        value=""
        onChange={onChange}
      />,
    )

    await userEvent.click(screen.getByRole('combobox', { name: 'Role' }))
    await userEvent.click(screen.getByRole('option', { name: 'Admin' }))

    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('keeps a multi-select open while toggling options', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <MultiSelectField
        label="Roles"
        options={OPTIONS}
        value={[]}
        onChange={onChange}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: 'Roles' })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('option', { name: 'Admin' }))

    expect(onChange).toHaveBeenCalledWith(['2'])
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    rerender(
      <MultiSelectField
        label="Roles"
        options={OPTIONS}
        value={['2']}
        onChange={onChange}
      />,
    )
    expect(within(trigger).getByText('Admin')).toBeVisible()
  })
})

describe('field wrappers — bound to a form', () => {
  it('writes typing back into form state', async () => {
    render(
      <BoundHarness defaultValues={{ email: '' }}>
        {(form) => <InputField form={form} name="email" label="Email" />}
      </BoundHarness>,
    )

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')

    expect(screen.getByTestId('values')).toHaveTextContent('ada@example.com')
  })

  it('writes textarea input back into form state', async () => {
    render(
      <BoundHarness defaultValues={{ bio: '' }}>
        {(form) => <TextareaField form={form} name="bio" label="Bio" />}
      </BoundHarness>,
    )

    await userEvent.type(screen.getByLabelText('Bio'), 'hello')

    expect(screen.getByTestId('values')).toHaveTextContent('hello')
  })

  it('reflects the form value rather than local state', () => {
    render(
      <BoundHarness defaultValues={{ email: 'seed@example.com' }}>
        {(form) => <InputField form={form} name="email" label="Email" />}
      </BoundHarness>,
    )

    expect(screen.getByLabelText('Email')).toHaveValue('seed@example.com')
  })

  it('drives a select from form state', () => {
    render(
      <BoundHarness defaultValues={{ role: '2' }}>
        {(form) => (
          <SelectField form={form} name="role" label="Role" options={OPTIONS} />
        )}
      </BoundHarness>,
    )

    expect(screen.getByLabelText('Role')).toHaveTextContent('Admin')
  })
})

describe('input kinds', () => {
  it.each([
    ['text', 'text'],
    ['password', 'password'],
    ['email', 'email'],
    ['number', 'number'],
    // `phone` is not a DOM input type; it renders tel.
    ['phone', 'tel'],
  ] as const)('renders type=%s as DOM type=%s', (type, expected) => {
    render(
      <InputField
        label="Value"
        type={type}
        value=""
        onChange={() => undefined}
      />,
    )
    expect(screen.getByLabelText('Value')).toHaveAttribute('type', expected)
  })

  it('keeps the value a string for type=number', async () => {
    const onChange = vi.fn()
    render(
      <InputField label="Age" type="number" value="" onChange={onChange} />,
    )

    await userEvent.type(screen.getByLabelText('Age'), '4')

    expect(onChange).toHaveBeenCalledWith('4')
  })
})
