import {
  isKbSection,
  kbHref,
  KB_SECTION_LABEL,
  type FrameworkLibraryApi,
  type KbSection,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { KbBar } from './components/KbBar'
import { ControlIndexScreen } from './ControlIndexScreen'
import { ControlScreen } from './ControlScreen'
import { DataElementIndexScreen } from './DataElementIndexScreen'
import { DomainIndexScreen } from './DomainIndexScreen'
import { DomainScreen } from './DomainScreen'
import { InstrumentScreen } from './InstrumentScreen'
import { LawfulBasesScreen } from './LawfulBasesScreen'
import { LawIndexScreen } from './LawIndexScreen'
import { LibraryOverviewScreen } from './LibraryOverviewScreen'
import { ObligationIndexScreen } from './ObligationIndexScreen'
import { ObligationScreen } from './ObligationScreen'
import { PlaybookIndexScreen } from './PlaybookIndexScreen'
import { PlaybookScreen } from './PlaybookScreen'
import { ProcessIndexScreen } from './ProcessIndexScreen'
import { ProcessScreen } from './ProcessScreen'
import { QuestionIndexScreen } from './QuestionIndexScreen'
import { QuestionScreen } from './QuestionScreen'
import { SearchScreen } from './SearchScreen'
import { SectorIndexScreen } from './SectorIndexScreen'
import { SectorScreen } from './SectorScreen'
import { VocabularyIndexScreen } from './VocabularyIndexScreen'
import { VocabularyScreen } from './VocabularyScreen'
import styles from './screens.module.css'

/** Everything the knowledge-base page reads from its address, so every view can be linked to. */
export type KnowledgeBaseParams = {
  section?: string
  item?: string
  q?: string
  domain?: string
  phase?: string
  penalty?: string
  actor?: string
  type?: string
  sector?: string
  text?: string
}

type Props = { api: FrameworkLibraryApi; today: string; params: KnowledgeBaseParams }

// Sections whose items open on their own; the others are single lists.
const detailOf = (
  section: KbSection,
  item: string,
  api: FrameworkLibraryApi,
  today: string,
): ReactNode => {
  switch (section) {
    case 'law':
      return <InstrumentScreen api={api} code={item} today={today} />
    case 'obligations':
      return <ObligationScreen api={api} code={item} today={today} />
    case 'controls':
      return <ControlScreen api={api} code={item} today={today} />
    case 'questions':
      return <QuestionScreen api={api} code={item} today={today} />
    case 'domains':
      return <DomainScreen api={api} code={item} today={today} />
    case 'sectors':
      return <SectorScreen api={api} code={item} />
    case 'processes':
      return <ProcessScreen api={api} code={item} today={today} />
    case 'vocabularies':
      return <VocabularyScreen api={api} code={item} />
    case 'playbooks':
      return <PlaybookScreen api={api} slug={item} />
    default:
      return undefined
  }
}

const indexOf = (
  section: KbSection,
  api: FrameworkLibraryApi,
  today: string,
  params: KnowledgeBaseParams,
): ReactNode => {
  switch (section) {
    case 'overview':
      return <LibraryOverviewScreen api={api} today={today} />
    case 'law':
      return <LawIndexScreen api={api} today={today} />
    case 'bases':
      return <LawfulBasesScreen api={api} />
    case 'obligations':
      return <ObligationIndexScreen api={api} today={today} params={params} />
    case 'controls':
      return <ControlIndexScreen api={api} params={params} />
    case 'questions':
      return <QuestionIndexScreen api={api} params={params} />
    case 'domains':
      return <DomainIndexScreen api={api} />
    case 'sectors':
      return <SectorIndexScreen api={api} />
    case 'processes':
      return <ProcessIndexScreen api={api} sector={params.sector} />
    case 'data-elements':
      return <DataElementIndexScreen api={api} />
    case 'vocabularies':
      return <VocabularyIndexScreen api={api} />
    case 'playbooks':
      return <PlaybookIndexScreen api={api} />
  }
}

/**
 * The whole knowledge base on one page: law, obligations, controls, the question bank and the
 * reference lists. The section, the open item and any search live in the address.
 */
export const KnowledgeBaseScreen = ({ api, today, params }: Props) => {
  const query = params.q?.trim().slice(0, 200)
  const section: KbSection = isKbSection(params.section) ? params.section : 'overview'
  const item = params.item?.slice(0, 80)
  const detail = !query && item ? detailOf(section, item, api, today) : undefined
  return (
    <div className={styles.kb}>
      <KbBar section={query ? undefined : section} query={query} />
      {query ? (
        <SearchScreen api={api} query={query} />
      ) : detail ? (
        <>
          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href={kbHref(section)}>{KB_SECTION_LABEL[section]}</Link>
            <span aria-hidden="true"> / </span>
            <span>{item}</span>
          </nav>
          {detail}
        </>
      ) : (
        indexOf(section, api, today, params)
      )}
    </div>
  )
}
