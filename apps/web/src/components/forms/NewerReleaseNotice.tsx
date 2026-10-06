import { Callout } from '@duatf/core-ui'
import type { QuestionPicker } from '@duatf/feature-compliance-api'
import Link from 'next/link'

/** Says when the open cycle's questions are older than the published question bank. */
export const NewerReleaseNotice = ({
  clientCode,
  picker,
}: {
  clientCode: string
  picker: Pick<QuestionPicker, 'cycle' | 'release' | 'newerRelease'>
}) =>
  picker.newerRelease && picker.cycle ? (
    <Callout tone="info" title={`Release ${picker.newerRelease} has newer questions`}>
      <p>
        The questions below are those of {picker.cycle.code}, which uses knowledge base release{' '}
        {picker.release.version}.{' '}
        <Link href={`/clients/${clientCode}/assessments/${picker.cycle.code}`}>
          Move {picker.cycle.code} to release {picker.newerRelease}
        </Link>{' '}
        to choose from the new questions; answers stay with their questions.
      </p>
    </Callout>
  ) : null
