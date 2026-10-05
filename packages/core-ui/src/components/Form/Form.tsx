import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Form.module.css'

type Common = {
  label: ReactNode
  name: string
  error?: string
  hint?: ReactNode
  required?: boolean
  /** Spans both columns of a Fieldset. */
  wide?: boolean
}

const describedBy = (name: string, error?: string, hint?: ReactNode) =>
  [error ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(Boolean).join(' ') ||
  undefined

const Wrapper = ({
  label,
  name,
  error,
  hint,
  required,
  wide,
  children,
}: Common & { children: ReactNode }) => (
  <div className={wide ? `${styles.field} ${styles.wide}` : styles.field}>
    <label htmlFor={name} className={styles.label}>
      {label}
      {required ? <span className={styles.required}> (required)</span> : null}
    </label>
    {children}
    {hint ? (
      <p id={`${name}-hint`} className={styles.hint}>
        {hint}
      </p>
    ) : null}
    {error ? (
      <p id={`${name}-error`} className={styles.error}>
        <CircleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
        {error}
      </p>
    ) : null}
  </div>
)

type TextFieldProps = Common & {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'search' | 'password'
  defaultValue?: string | number | null
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  min?: number | string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url'
}

export const TextField = ({
  type = 'text',
  defaultValue,
  placeholder,
  autoComplete,
  maxLength,
  min,
  inputMode,
  ...common
}: TextFieldProps) => (
  <Wrapper {...common}>
    <input
      id={common.name}
      name={common.name}
      type={type}
      defaultValue={defaultValue ?? ''}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      min={min}
      inputMode={inputMode}
      required={common.required}
      aria-invalid={common.error ? true : undefined}
      aria-describedby={describedBy(common.name, common.error, common.hint)}
      className={styles.control}
    />
  </Wrapper>
)

export type SelectOption = { value: string; label: string }

type SelectFieldProps = Common & {
  options: readonly SelectOption[]
  defaultValue?: string | null
  /** Text of an empty first option, e.g. "Choose…". */
  placeholder?: string
  /** Only inside client components: called with the new value. */
  onChange?: (value: string) => void
}

export const SelectField = ({
  options,
  defaultValue,
  placeholder,
  onChange,
  ...common
}: SelectFieldProps) => (
  <Wrapper {...common}>
    <select
      id={common.name}
      name={common.name}
      defaultValue={defaultValue ?? ''}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      required={common.required}
      aria-invalid={common.error ? true : undefined}
      aria-describedby={describedBy(common.name, common.error, common.hint)}
      className={styles.control}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </Wrapper>
)

type TextAreaFieldProps = Common & {
  defaultValue?: string | null
  rows?: number
  maxLength?: number
}

export const TextAreaField = ({
  defaultValue,
  rows = 4,
  maxLength,
  ...common
}: TextAreaFieldProps) => (
  <Wrapper {...common}>
    <textarea
      id={common.name}
      name={common.name}
      rows={rows}
      maxLength={maxLength}
      defaultValue={defaultValue ?? ''}
      required={common.required}
      aria-invalid={common.error ? true : undefined}
      aria-describedby={describedBy(common.name, common.error, common.hint)}
      className={styles.control}
    />
  </Wrapper>
)

/** A titled group of fields laid out in two columns on wide screens. */
export const Fieldset = ({
  legend,
  children,
  note,
}: {
  legend: ReactNode
  note?: ReactNode
  children: ReactNode
}) => (
  <fieldset className={styles.fieldset}>
    <legend className={styles.legend}>{legend}</legend>
    {note ? <p className={styles.note}>{note}</p> : null}
    <div className={styles.grid}>{children}</div>
  </fieldset>
)

const ALERT_TONE = {
  error: { className: styles.alertError, icon: CircleAlert },
  success: { className: styles.alertSuccess, icon: CircleCheck },
  info: { className: styles.alertInfo, icon: Info },
}

/** Result of a form submission, announced to screen readers. */
export const FormAlert = ({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
}) => {
  const { className, icon: Icon } = ALERT_TONE[tone]
  return (
    <div className={`${styles.alert} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className={styles.alertIcon} size={16} strokeWidth={2.25} aria-hidden="true" />
      <div className={styles.alertBody}>{children}</div>
    </div>
  )
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * Class names for links and buttons that should look like buttons. One primary per region;
 * secondary for the rest; ghost for low-emphasis actions inside tables and toolbars.
 */
export const buttonClass = (variant: ButtonVariant = 'primary', size: 'md' | 'sm' = 'md'): string =>
  `${styles.button} ${styles[variant]}${size === 'sm' ? ` ${styles.small}` : ''}`

/** A row of form buttons. */
export const FormActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
)
