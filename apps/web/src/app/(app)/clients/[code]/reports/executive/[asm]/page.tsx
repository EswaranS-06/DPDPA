import { AccessDeniedError } from '@duatf/core-access'
import { formatDay } from '@duatf/core-utils'
import { Citation, DataTable } from '@duatf/core-ui'
import { executiveReport, NotFoundError } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Legend, Metrics, ProgressBar } from '@/components/assessment/AssessmentBits'
import { PrintButton } from '@/components/PrintButton'
import { BandChip, GapChip, Heatmap } from '@/components/risk/RiskBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from './report.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Executive report ${decodeURIComponent((await params).asm)}`,
})

export default async function Page({ params }: Props) {
  const { code, asm } = await params
  const client = await loadClient(code)
  const report = await executiveReport(await serviceContext(), client.id, decodeURIComponent(asm)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
      throw error
    },
  )
  const { assessment, preparedFor } = report
  const period = assessment.periodStart
    ? `${formatDay(assessment.periodStart)}${assessment.periodEnd ? ` to ${formatDay(assessment.periodEnd)}` : ''}`
    : 'Not recorded'

  return (
    <article className={styles.report}>
      <div className={styles.toolbar}>
        <PrintButton />
      </div>

      <header className={styles.cover}>
        <p className={styles.kicker}>Executive report on a DPDP compliance assessment</p>
        <h1 className={styles.title}>{preparedFor.name}</h1>
        <p className={styles.subtitle}>
          {assessment.title} ({assessment.code})
        </p>
        <dl className={styles.facts}>
          <div>
            <dt>Legal name</dt>
            <dd>{preparedFor.legalName}</dd>
          </div>
          <div>
            <dt>Assessment period</dt>
            <dd>{period}</dd>
          </div>
          <div>
            <dt>Knowledge base release</dt>
            <dd>{assessment.releaseVersion}</dd>
          </div>
          <div>
            <dt>Report date</dt>
            <dd>{formatDay(report.generatedOn)}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="summary">
        <h2 id="summary">1. Summary</h2>
        <p>
          {preparedFor.applicability}.{preparedFor.applicabilityNote ? ` ${preparedFor.applicabilityNote}` : ''}{' '}
          {assessment.progress.answered} of {assessment.progress.total} questions are answered;{' '}
          {report.openFindingCount} findings remain open.
        </p>
        <Metrics progress={assessment.progress} />
        <ProgressBar progress={assessment.progress} label="All questions" />
        <Legend />
      </section>

      <section className={styles.section} aria-labelledby="scope">
        <h2 id="scope">2. Scope and method</h2>
        <p>
          Every question in DUATF knowledge base release {assessment.releaseVersion} was asked: one
          question per control, each traced to the provisions of the DPDP Act 2023, the DPDP Rules
          2025 and linked Indian laws it tests. Answers are Yes, Partial, No or Not applicable (with
          a reason). No is a gap and Partial a potential gap; each carries the recommendation from
          the knowledge base. Compliance is Yes plus half of Partial, over the answered questions in
          scope. Risks are scored as likelihood × impact on 1 to 5 scales, in bands{' '}
          {report.bands.map((band) => `${band.name} ${band.minScore}–${band.maxScore}`).join(', ')}.
        </p>
      </section>

      <section className={styles.section} aria-labelledby="domains">
        <h2 id="domains">3. Compliance by domain</h2>
        <DataTable
          rows={assessment.domains}
          rowKey={(row) => row.code}
          columns={[
            { key: 'domain', header: 'Domain', render: (row) => `${row.code} ${row.title}` },
            { key: 'answered', header: 'Answered', align: 'end', render: (row) => `${row.progress.answered}/${row.progress.total}` },
            { key: 'gaps', header: 'Gaps', align: 'end', render: (row) => row.progress.gap + row.progress.potentialGap },
            {
              key: 'compliance',
              header: 'Compliance',
              align: 'end',
              render: (row) => (row.progress.compliancePct === null ? '—' : `${row.progress.compliancePct}%`),
            },
          ]}
        />
      </section>

      <section className={styles.section} aria-labelledby="findings">
        <h2 id="findings">4. Key findings</h2>
        {report.keyFindings.length === 0 ? (
          <p>No open findings.</p>
        ) : (
          <ol className={styles.findings}>
            {report.keyFindings.map((row) => (
              <li key={row.id}>
                <div className={styles.findingHead}>
                  <strong>{row.title}</strong> <GapChip gapType={row.gapType} />{' '}
                  {row.band ? <BandChip band={row.band} score={row.riskScore ?? undefined} /> : null}
                </div>
                <p className={styles.small}>
                  <Citation>{row.code}</Citation>, question {row.questionCode}, control {row.controlCode}
                </p>
                <p>{row.recommendation}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className={styles.section} aria-labelledby="risks">
        <h2 id="risks">5. Risk register</h2>
        <div className={styles.riskRow}>
          <Heatmap grid={report.riskHeatmap} bands={report.bands} />
          <ul className={styles.plain}>
            {report.risksByBand.map((row) => (
              <li key={row.band.name}>
                <BandChip band={row.band} /> {row.count} open
              </li>
            ))}
            <li>{report.acceptedRisks} risks accepted by the organisation</li>
          </ul>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="remediation">
        <h2 id="remediation">6. Remediation</h2>
        {report.actionsByStatus.length === 0 ? (
          <p>No remediation actions have been planned yet.</p>
        ) : (
          <p>
            {report.actionsByStatus.map(([status, n]) => `${n} ${status.toLowerCase()}`).join(', ')}.
            {report.overdueActions ? ` ${report.overdueActions} overdue.` : ' None overdue.'}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="about">
        <h2 id="about">7. About this report</h2>
        <p className={styles.small}>
          Prepared by ComplyX Cybersecurity Services with DUATF on {report.generatedAt}. It reflects
          the answers, evidence and reviews recorded in DUATF on that date. DUATF is a working
          compliance framework, not legal advice; interpretations of the DPDP Act and Rules should
          be confirmed with counsel.
        </p>
      </section>
    </article>
  )
}
