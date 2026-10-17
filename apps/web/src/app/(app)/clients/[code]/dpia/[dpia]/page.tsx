import { formatDay } from '@duatf/core-utils'
import {
  Callout,
  Chip,
  DataTable,
  DescriptionList,
  Disclosure,
  PageHeader,
  Panel,
} from '@duatf/core-ui'
import { DPIA_OUTCOME_LABEL, getDpia, NotFoundError } from '@duatf/feature-compliance-api'
import { DPIA_OUTCOMES } from '@duatf/platform-db'
import { CalendarClock, Pencil, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LevelChip } from '@/components/data/LevelChip'
import { ActionButton, DpiaForm } from '@/components/forms/RegisterForms'
import { DpiaStatusChip } from '@/components/registers/RegisterBits'
import bits from '@/components/registers/RegisterBits.module.css'
import { BandChip } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import { removeDpiaAction, saveDpiaAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dpia: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).dpia),
})

export default async function Page({ params, searchParams }: Props) {
  const { code, dpia } = await params
  const justCompleted = firstValue((await searchParams).completed) === '1'
  const client = await loadClient(code)
  const item = await getDpia(await serviceContext(), client.id, decodeURIComponent(dpia)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError) notFound()
      throw error
    },
  )
  const target = {
    clientId: client.id,
    clientCode: client.code,
    dpiaId: item.id,
    dpiaCode: item.code,
  }
  const activity = item.activity
  const completed = item.status === 'completed'

  return (
    <>
      <PageHeader
        kicker={
          <span>
            <span className="code">{item.code}</span>, DPIA of{' '}
            <Link
              href={`/clients/${client.code}/data-mapping/activities/${activity.refLabel}`}
              className="code"
            >
              {activity.refLabel}
            </Link>
          </span>
        }
        title={activity.name}
        lede={`${activity.departmentName}. The assessment follows s.10(2)(c)(i): the rights of the Data Principals, the purpose, and the assessment and management of the risk to those rights.`}
      >
        <DpiaStatusChip status={item.status} />
        {activity.highestLevel ? <LevelChip level={activity.highestLevel} /> : null}
        {item.outcome ? <Chip tone="neutral">{DPIA_OUTCOME_LABEL[item.outcome]}</Chip> : null}
        {item.reviewDue ? (
          <Chip tone="warning" icon={CalendarClock}>
            Review due
          </Chip>
        ) : null}
      </PageHeader>

      {justCompleted && completed ? (
        <Callout tone="success" role="status" title="DPIA completed">
          <p>
            {item.nextReviewOn ? `Its review is due on ${formatDay(item.nextReviewOn)}.` : ''} It
            can be updated below at any time.
          </p>
        </Callout>
      ) : null}
      {item.reasons.length ? (
        <Callout tone="info" title="Why this activity should have a DPIA">
          <ul className={bits.reasons}>
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </Callout>
      ) : null}

      {completed ? (
        <div className={styles.twoColumn}>
          <Panel title="Assessment" titleId="assessment-title">
            <DescriptionList
              columns={1}
              items={[
                { label: 'The processing', value: item.description },
                { label: 'Purpose', value: item.purpose },
                { label: 'Rights of the Data Principals affected', value: item.rightsAffected },
                { label: 'Necessity and proportionality', value: item.necessity },
              ]}
            />
          </Panel>
          <Panel title="Outcome" titleId="outcome-title">
            <DescriptionList
              columns={1}
              items={[
                {
                  label: 'Outcome',
                  value: item.outcome ? DPIA_OUTCOME_LABEL[item.outcome] : null,
                },
                { label: 'Note', value: item.outcomeNote },
                { label: 'Consulted', value: item.consulted },
                { label: 'Prepared by', value: item.preparedBy },
                {
                  label: 'Completed on',
                  value: item.completedOn ? formatDay(item.completedOn) : null,
                },
                {
                  label: 'Next review',
                  value: item.nextReviewOn ? formatDay(item.nextReviewOn) : null,
                },
              ]}
            />
          </Panel>
        </div>
      ) : null}

      {item.risks.length ? (
        <Panel title="Risks to the Data Principals" titleId="risks-title" padding="flush">
          <DataTable
            plain
            rows={item.risks}
            rowKey={(row) => row.id}
            columns={[
              { key: 'risk', header: 'Risk', render: (row) => row.risk },
              {
                key: 'before',
                header: 'Before the measures',
                render: (row) => (
                  <span className={styles.personCell}>
                    <BandChip band={row.band} score={row.score} />
                    <span className={styles.muted}>
                      {row.likelihood} × {row.impact}
                    </span>
                  </span>
                ),
              },
              {
                key: 'measures',
                header: 'Measures that manage it',
                render: (row) =>
                  row.measures ?? <span className={styles.muted}>None recorded</span>,
              },
              {
                key: 'after',
                header: 'After the measures',
                render: (row) => (
                  <span className={styles.personCell}>
                    <BandChip band={row.residualBand} score={row.residualScore} />
                    <span className={styles.muted}>
                      {row.residualLikelihood} × {row.residualImpact}
                    </span>
                  </span>
                ),
              },
            ]}
          />
        </Panel>
      ) : null}

      {item.canEdit ? (
        <>
          <Disclosure
            summary={completed ? 'Review and update this DPIA' : 'The assessment'}
            icon={Pencil}
            defaultOpen={!completed}
          >
            <DpiaForm
              action={saveDpiaAction.bind(null, target)}
              initial={{
                description: item.description ?? '',
                purpose: item.purpose ?? '',
                rightsAffected: item.rightsAffected ?? '',
                necessity: item.necessity ?? '',
                consulted: item.consulted ?? '',
                outcome: item.outcome ?? '',
                outcomeNote: item.outcomeNote ?? '',
                preparedBy: item.preparedBy ?? '',
                completedOn: '',
                nextReviewOn: '',
              }}
              risks={item.risks.map((row) => ({
                risk: row.risk,
                likelihood: String(row.likelihood),
                impact: String(row.impact),
                measures: row.measures ?? '',
                residualLikelihood: String(row.residualLikelihood),
                residualImpact: String(row.residualImpact),
              }))}
              outcomes={DPIA_OUTCOMES.map((value) => ({
                value,
                label: DPIA_OUTCOME_LABEL[value],
              }))}
            />
          </Disclosure>
          <Disclosure summary="Remove this DPIA" icon={Trash2}>
            <ActionButton
              action={removeDpiaAction.bind(null, target)}
              variant="danger"
              pendingText="Removing…"
            >
              Remove {item.code}
            </ActionButton>
          </Disclosure>
        </>
      ) : null}
      <Panel title="Documents from this record" titleId="record-documents">
        <ul className={styles.documentLinks}>
          <li>
            <Link href={`/clients/${client.code}/documents/G05?record=${item.code}`}>
              <span className="code">G05</span> DPIA in the library’s template
            </Link>
          </li>
        </ul>
      </Panel>
    </>
  )
}
