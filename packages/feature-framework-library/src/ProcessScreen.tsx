import { Chip, Citation, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  basisLabel,
  flagLabel,
  type FrameworkLibraryApi,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ObligationRow } from './components/ObligationRow'
import { sentence } from './consts/labels'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

const ChipList = ({
  items,
  render = (item) => item,
}: {
  items: string[]
  render?: (item: string) => ReactNode
}) =>
  items.length ? (
    <div className={styles.chips}>
      {items.map((item) => (
        <Chip key={item}>{render(item)}</Chip>
      ))}
    </div>
  ) : (
    <span className={styles.muted}>None recorded</span>
  )

export const ProcessScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.process({ code }))
  return (
    <div className={styles.page}>
      <PageHeader kicker={<Citation>{item.code}</Citation>} title={item.title}>
        <Chip>{item.sectorName}</Chip>
        <Chip>{item.department}</Chip>
      </PageHeader>

      {item.assessorNote ? <p className={styles.note}>{item.assessorNote}</p> : null}

      <div>
        <MarginRow margin="Typical activities">
          <ul className={styles.bullets}>
            {item.activities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
          </ul>
          <p className={`${styles.muted} ${styles.flush}`}>
            Record one processing activity for each of these that exists at the client.
          </p>
        </MarginRow>
        <MarginRow margin="Whose data">
          <ChipList items={item.dataPrincipals} />
        </MarginRow>
        <MarginRow margin="What data">
          <ChipList items={item.dataCategories} render={sentence} />
        </MarginRow>
        <MarginRow margin="Systems">
          <ChipList items={item.typicalSystems} />
        </MarginRow>
        <MarginRow margin="Third parties">
          <ChipList items={item.typicalThirdParties} />
        </MarginRow>
        <MarginRow margin="Usual lawful basis">
          <ChipList
            items={item.typicalLawfulBasis}
            render={(basis) => (
              <Link href={`/library/law/bases#${basis}`}>{basisLabel(basis)}</Link>
            )}
          />
        </MarginRow>
        <MarginRow margin="Facts to confirm">
          <ChipList items={item.flags} render={(flag) => sentence(flagLabel(flag))} />
        </MarginRow>
        <MarginRow margin="Sensitivity">
          <ChipList items={item.contextTags} render={sentence} />
        </MarginRow>
      </div>

      <section className={styles.section} aria-labelledby="obligations-title">
        <h2 id="obligations-title" className={styles.sectionTitle}>
          Obligations this process usually triggers
        </h2>
        <p className={styles.sectionIntro}>
          In addition to the baseline that applies to every activity: governance, security (Rule 6),
          breach (Rule 7), retention (Rule 8), grievance (Rule 14) and the linked CERT-In duties.
        </p>
        <ul className={styles.plainList}>
          {item.obligations.map((obligation) => (
            <ObligationRow key={obligation.code} item={obligation} today={today} />
          ))}
        </ul>
      </section>
    </div>
  )
}
