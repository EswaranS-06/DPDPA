import { kbHref } from '@duatf/feature-framework-library-api'
import type { ObligationListItem } from '@duatf/feature-framework-library-api'
import { Chip, Citation, MarginRow } from '@duatf/core-ui'
import Link from 'next/link'
import { PenaltyChip } from '../PenaltyChip'
import { TimeStatus } from '../TimeStatus'
import styles from './ObligationRow.module.css'

type ObligationRowProps = {
  item: ObligationListItem
  today: string
  showDomain?: boolean
}

export const ObligationRow = ({ item, today, showDomain = true }: ObligationRowProps) => (
  <MarginRow
    as="li"
    margin={
      <>
        {item.actRef ? <Citation strong>{item.actRef}</Citation> : null}
        {item.ruleRef ? <Citation>{item.ruleRef}</Citation> : null}
        {!item.actRef && !item.ruleRef ? <span>{item.regime}</span> : null}
      </>
    }
  >
    <div className={styles.head}>
      <Link href={kbHref('obligations', item.code)} className={styles.title}>
        {item.title}
      </Link>
      <Citation>{item.code}</Citation>
    </div>
    <p className={styles.requirement}>{item.requirement}</p>
    <div className={styles.meta}>
      <TimeStatus inForce={item.inForce} inForceUntil={item.inForceUntil} today={today} />
      <PenaltyChip tier={item.penaltyTier} />
      {showDomain ? (
        <Chip>
          <Link href={kbHref('domains', item.domainCode)}>{item.domainCode}</Link>
        </Chip>
      ) : null}
    </div>
  </MarginRow>
)
