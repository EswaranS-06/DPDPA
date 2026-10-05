import type {
  Answer,
  AnswerOption,
  AnswerOutcome,
  AnswerType,
  ItemResponse,
} from '@duatf/platform-db'
import { ValidationError } from './errors'

/** The parts of a question that decide how it is answered. */
export type AnswerShape = { answerType: AnswerType; options: AnswerOption[] }

/** What the answer form sends: one option, several options, free text, or Not applicable. */
export type ResponseInput = {
  choice?: string
  choices?: string[]
  text?: string
  notApplicable?: boolean
  clear?: boolean
}

const ANSWER_OF: Record<AnswerOutcome, Answer> = {
  compliant: 'yes',
  potential_gap: 'partial',
  gap: 'no',
  informational: 'recorded',
}

const MAX_TEXT = 4000

/**
 * Turns a response into the stored answer: the scored meaning of the chosen option (Yes,
 * maturity 3-4 and compliant choices are "yes"), "recorded" for questions that only record
 * facts, or Not applicable. Clearing withdraws the answer.
 */
export const evaluateResponse = (
  shape: AnswerShape,
  input: ResponseInput,
): { answer: Answer; response: ItemResponse | null } => {
  if (input.clear) return { answer: 'not_assessed', response: null }
  if (input.notApplicable) return { answer: 'not_applicable', response: null }
  const pick = (value: string | undefined) => shape.options.find((item) => item.value === value)
  switch (shape.answerType) {
    case 'yes_no':
    case 'maturity':
    case 'choice': {
      const chosen = pick(input.choice)
      if (!chosen) throw new ValidationError({ answer: 'Choose an answer.' })
      return { answer: ANSWER_OF[chosen.outcome], response: { values: [chosen.value] } }
    }
    case 'multi_choice': {
      const values = [...new Set(input.choices ?? [])]
      const chosen = values.map(pick)
      if (values.length === 0) throw new ValidationError({ answer: 'Tick at least one option.' })
      if (chosen.some((item) => !item)) throw new ValidationError({ answer: 'Unknown option.' })
      const order = shape.options.map((item) => item.value)
      return {
        answer: 'recorded',
        response: { values: values.sort((a, b) => order.indexOf(a) - order.indexOf(b)) },
      }
    }
    case 'text': {
      const text = input.text?.trim() ?? ''
      if (text.length === 0) throw new ValidationError({ answer: 'Write the answer.' })
      if (text.length > MAX_TEXT) {
        throw new ValidationError({ answer: `Keep the answer under ${MAX_TEXT} characters.` })
      }
      return { answer: 'recorded', response: { text } }
    }
  }
}

/** The chosen option values of a response (empty for free text or no response). */
export const responseValues = (response: ItemResponse | null): string[] =>
  response && 'values' in response ? response.values : []

/** How a response reads: "Yes", "3 · Defined", "≤48 hours", "HR, Education" or the text. */
export const describeResponse = (
  shape: AnswerShape,
  item: { answer: Answer; response: ItemResponse | null },
): string => {
  if (item.answer === 'not_assessed') return 'Not answered'
  if (item.answer === 'not_applicable') return 'Not applicable'
  if (item.response && 'text' in item.response) return item.response.text
  const labels = responseValues(item.response).map(
    (value) => shape.options.find((option) => option.value === value)?.label ?? value,
  )
  return labels.join(', ') || 'Answered'
}

/** The maturity level (0-4) of a maturity answer, or null. */
export const maturityOf = (
  shape: Pick<AnswerShape, 'answerType'>,
  response: ItemResponse | null,
): number | null => {
  if (shape.answerType !== 'maturity') return null
  const [value] = responseValues(response)
  return value === undefined ? null : Number(value)
}

export const ANSWER_TYPE_LABEL: Record<AnswerType, string> = {
  yes_no: 'Yes / No',
  maturity: 'Maturity 0-4',
  choice: 'Choice',
  multi_choice: 'Several choices',
  text: 'Free text',
}
