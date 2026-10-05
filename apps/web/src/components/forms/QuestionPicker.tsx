'use client'

import type { PickerQuestion, PickerQuestionnaire } from '@duatf/feature-compliance-api'
import { ChevronDown, Lock, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import styles from './QuestionPicker.module.css'

const ANSWER_TYPE: Record<string, string> = {
  yes_no: 'Yes / No',
  maturity: 'Maturity 0-4',
  choice: 'Choice',
  multi_choice: 'Choices',
  text: 'Free text',
}

const RISK: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

/** A checkbox that also shows "some of these" (the indeterminate state). */
const GroupBox = ({
  label,
  checked,
  partly,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  partly: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = partly && !checked
  }, [partly, checked])
  return (
    <label className={styles.groupBox}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}

const matches = (question: PickerQuestion, words: string[]) => {
  const haystack = `${question.code} ${question.title} ${question.text}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * The questions a department answers: tick them one by one, or tick a questionnaire or a
 * section to take every question in it. Answered questions stay with the department.
 * Sends one "questions" field per chosen code.
 */
export const QuestionPicker = ({
  questionnaires,
  disabled,
}: {
  questionnaires: PickerQuestionnaire[]
  disabled?: string | null
}) => {
  const all = useMemo(
    () => questionnaires.flatMap((group) => group.sections.flatMap((section) => section.questions)),
    [questionnaires],
  )
  const locked = useMemo(
    () => new Set(all.filter((question) => question.locked).map((question) => question.code)),
    [all],
  )
  const [chosen, setChosen] = useState(
    () => new Set(all.filter((question) => question.selected).map((question) => question.code)),
  )
  const [query, setQuery] = useState('')
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)

  const setMany = (codes: string[], on: boolean) =>
    setChosen((current) => {
      const next = new Set(current)
      for (const code of codes) {
        if (on) next.add(code)
        else if (!locked.has(code)) next.delete(code)
      }
      return next
    })
  const state = (codes: string[]) => {
    const count = codes.filter((code) => chosen.has(code)).length
    return { checked: codes.length > 0 && count === codes.length, partly: count > 0, count }
  }

  return (
    <section className={styles.picker} aria-labelledby="picker-title">
      <header className={styles.header}>
        <div>
          <h2 id="picker-title" className={styles.title}>
            Questions for this department
          </h2>
          <p className={styles.lede}>
            Tick a questionnaire or a section to take all of its questions, or pick them one by one.
            The same question can go to several departments; each answers it separately.
          </p>
        </div>
        <p className={styles.count} aria-live="polite">
          <strong>{chosen.size}</strong> of {all.length} chosen
        </p>
      </header>
      {disabled ? <p className={styles.closed}>{disabled}</p> : null}
      <label className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <span className="visually-hidden">Find a question</span>
        <input
          type="search"
          placeholder="Find a question by code or words, e.g. breach or C1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {[...chosen].map((code) => (
        <input key={code} type="hidden" name="questions" value={code} />
      ))}

      {questionnaires.map((group) => {
        const codes = group.sections.flatMap((section) => section.questions.map((q) => q.code))
        const groupState = state(codes)
        const visible = group.sections
          .map((section) => ({
            ...section,
            questions: section.questions.filter((question) => matches(question, words)),
          }))
          .filter((section) => section.questions.length > 0)
        if (visible.length === 0) return null
        return (
          <details
            key={group.code}
            className={styles.group}
            open={words.length > 0 || groupState.partly}
          >
            <summary className={styles.groupSummary}>
              <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
              <span className={styles.groupName}>
                <span className="code">{group.code}</span> {group.title}
              </span>
              <span className={styles.groupCount}>
                {groupState.count} of {codes.length}
              </span>
            </summary>
            <div className={styles.groupBody}>
              <div className={styles.groupBar}>
                <p className={styles.groupNote}>{group.description}</p>
                <GroupBox
                  label={`All ${codes.length} questions`}
                  checked={groupState.checked}
                  partly={groupState.partly}
                  disabled={Boolean(disabled)}
                  onChange={(on) => setMany(codes, on)}
                />
              </div>
              {visible.map((section) => {
                const sectionCodes =
                  group.sections
                    .find((entry) => entry.name === section.name)
                    ?.questions.map((question) => question.code) ?? []
                const sectionState = state(sectionCodes)
                return (
                  <fieldset key={section.name} className={styles.section}>
                    <legend className={styles.sectionLegend}>
                      <span>{section.name}</span>
                      <GroupBox
                        label={`Whole section (${sectionCodes.length})`}
                        checked={sectionState.checked}
                        partly={sectionState.partly}
                        disabled={Boolean(disabled)}
                        onChange={(on) => setMany(sectionCodes, on)}
                      />
                    </legend>
                    <ul className={styles.questions}>
                      {section.questions.map((question) => {
                        const isLocked = locked.has(question.code)
                        return (
                          <li key={question.code}>
                            <label
                              className={
                                chosen.has(question.code)
                                  ? `${styles.question} ${styles.chosen}`
                                  : styles.question
                              }
                            >
                              <input
                                type="checkbox"
                                checked={chosen.has(question.code)}
                                disabled={Boolean(disabled) || isLocked}
                                onChange={(event) => setMany([question.code], event.target.checked)}
                              />
                              <span className={styles.questionMain}>
                                <span className={styles.questionTitle}>
                                  <span className="code">{question.code}</span> {question.title}
                                </span>
                                <span className={styles.questionText}>{question.text}</span>
                              </span>
                              <span className={styles.questionMeta}>
                                <span>
                                  {ANSWER_TYPE[question.answerType] ?? question.answerType}
                                </span>
                                <span className={styles[`risk_${question.riskLevel}`]}>
                                  {RISK[question.riskLevel] ?? question.riskLevel}
                                </span>
                                {isLocked ? (
                                  <span className={styles.locked}>
                                    <Lock size={12} aria-hidden="true" /> {question.locked}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  </fieldset>
                )
              })}
            </div>
          </details>
        )
      })}
      {words.length > 0 && !all.some((question) => matches(question, words)) ? (
        <p className={styles.none}>No question matches “{query}”.</p>
      ) : null}
    </section>
  )
}
