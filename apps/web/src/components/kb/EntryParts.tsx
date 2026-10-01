import { buttonClass, Callout } from '@duatf/core-ui'
import { KB_DRAFT_PATH, type EditableSection } from '@duatf/feature-framework-library-api'
import Link from 'next/link'

/** What each editable section holds, shown above its add and edit forms. */
export const SECTION_GUIDE: Record<EditableSection, string> = {
  bases:
    'The codes processes and obligation triggers use for why processing is lawful: consent (s.6), the legitimate uses of s.7, and the s.17 exemptions.',
  'data-elements':
    'Kinds of personal data assessors record against processes. Sensitivity tags raise the impact score of findings; they do not change which obligations apply.',
  vocabularies:
    'Controlled lists every record uses, so two assessors describe the same thing the same way.',
  processes:
    'Templates of business processes assessors start discovery from: the usual activities, data, systems, lawful basis and the obligations they trigger.',
  sectors:
    'What changes for a sector: its regulators, the laws that run alongside DPDP, how long records must be kept and where DPDP bites.',
  playbooks:
    'Guides and references for running assessments. Written in Markdown and linked to the rest of the knowledge base.',
}

/** Shown on editor pages when no draft release is open. */
export const NoDraft = () => (
  <Callout tone="info" title="No draft release is open">
    <p>
      Changes to the knowledge base are made in a draft release, which a firm administrator
      publishes when it is ready.
    </p>
    <p>
      <Link href={KB_DRAFT_PATH} className={buttonClass('secondary', 'sm')}>
        Start a draft
      </Link>
    </p>
  </Callout>
)
