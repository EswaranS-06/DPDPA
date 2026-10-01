import { Chip, Citation, Disclosure } from '@duatf/core-ui'
import {
  kbHref,
  OFFICIAL_SOURCES,
  type ObligationListItem,
} from '@duatf/feature-framework-library-api'
import { ExternalLink, Scale } from 'lucide-react'
import Link from 'next/link'
import { PenaltyChip } from '../PenaltyChip'
import { TimeStatus } from '../TimeStatus'
import styles from './LegalReference.module.css'

type LegalReferenceProps = {
  /** The obligations the question or control tests. */
  obligations: ObligationListItem[]
  /** Citations recorded on the question, shown when no obligation is linked. */
  references?: string[]
  today: string
  release: string
  defaultOpen?: boolean
}

/**
 * The law behind a requirement, one click away: each provision with its citation in the Act or
 * the Rules, whether it is in force on the given day or when it starts, the penalty tier, and the
 * official texts. Kept collapsed so the page reads as work, not as a statute.
 */
export const LegalReference = ({
  obligations,
  references = [],
  today,
  release,
  defaultOpen = false,
}: LegalReferenceProps) => {
  const fromAct = obligations.some((item) => item.actRef)
  const fromRules = obligations.some((item) => item.ruleRef)
  return (
    <Disclosure
      summary="Legal reference"
      icon={Scale}
      hint={
        obligations.length
          ? `${obligations.length} ${obligations.length === 1 ? 'obligation' : 'obligations'}`
          : `${references.length} ${references.length === 1 ? 'citation' : 'citations'}`
      }
      defaultOpen={defaultOpen}
    >
      {obligations.length ? (
        <ul className={styles.list}>
          {obligations.map((item) => (
            <li key={item.code} className={styles.item}>
              <span className={styles.citations}>
                {item.actRef ? (
                  <span>
                    DPDP Act, 2023 <Citation strong>{item.actRef}</Citation>
                  </span>
                ) : null}
                {item.ruleRef ? (
                  <span>
                    DPDP Rules, 2025 <Citation strong>{item.ruleRef}</Citation>
                  </span>
                ) : null}
                {!item.actRef && !item.ruleRef ? <span>{item.regime}</span> : null}
              </span>
              <Link href={kbHref('obligations', item.code)} className={styles.title}>
                {item.title}
              </Link>
              <span className={styles.meta}>
                <TimeStatus inForce={item.inForce} inForceUntil={item.inForceUntil} today={today} />
                <PenaltyChip tier={item.penaltyTier} />
                <Chip>
                  <span className="code">{item.code}</span>
                </Chip>
              </span>
            </li>
          ))}
        </ul>
      ) : references.length ? (
        <p className={styles.flush}>
          {references.map((reference, index) => (
            <span key={reference}>
              {index ? ', ' : ''}
              <Citation strong>{reference}</Citation>
            </span>
          ))}
        </p>
      ) : (
        <p className={styles.flush}>No citation is recorded for this requirement.</p>
      )}
      <p className={styles.footer}>
        As recorded in knowledge base release {release}. Official texts:{' '}
        {fromAct || !fromRules ? (
          <a href={OFFICIAL_SOURCES.act.href} target="_blank" rel="noreferrer noopener">
            DPDP Act, 2023
            <ExternalLink size={12} aria-hidden="true" className={styles.external} />
          </a>
        ) : null}
        {fromAct || !fromRules ? ' and ' : null}
        <a href={OFFICIAL_SOURCES.framework.href} target="_blank" rel="noreferrer noopener">
          MeitY data protection framework, with the DPDP Rules, 2025
          <ExternalLink size={12} aria-hidden="true" className={styles.external} />
        </a>
        .
      </p>
    </Disclosure>
  )
}
