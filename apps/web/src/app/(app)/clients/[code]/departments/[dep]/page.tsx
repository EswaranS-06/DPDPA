import { AccessDeniedError, can } from '@duatf/core-access'
import {
  buttonClass,
  Citation,
  DataTable,
  Disclosure,
  EmptyState,
  PageHeader,
  Panel,
  SectionHeader,
} from '@duatf/core-ui'
import { departmentDashboard, NotFoundError } from '@duatf/feature-compliance-api'
import { CircleCheck, ClipboardList, Download, FileCheck, ListChecks, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionTable } from '@/components/actions/ActionBits'
import { AssessmentStatusChip } from '@/components/assessment/AssessmentBits'
import { FigurePanels, RequirementAreas } from '@/components/dashboard/DashboardBits'
import dash from '@/components/dashboard/DashboardBits.module.css'
import { Posture } from '@/components/dashboard/Posture'
import { EvidenceTable } from '@/components/evidence/EvidenceTable'
import { BandChip, GapChip, Heatmap } from '@/components/risk/RiskBits'
import { Status } from '@/components/status'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import local from './department.module.css'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dep: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Department ${decodeURIComponent((await params).dep).toUpperCase()}`,
})

const SHOWN = 8

export default async function Page({ params }: Props) {
  const { code, dep } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const view = await departmentDashboard(ctx, client.id, decodeURIComponent(dep)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
      throw error
    },
  )
  const { department, figures, bands } = view
  const latest = figures.latestAssessment
  const base = `/clients/${client.code}`
  const titles = new Map(view.domainTitles.map((row) => [row.code, row.title]))
  const itemHref = (questionCode: string) =>
    latest ? `${base}/assessments/${latest.code}/items/${questionCode}` : base
  const attentionRow = (row: (typeof view.attention)[number]) => (
    <li key={row.questionCode} className={local.question}>
      <span className={local.questionText}>
        <Link href={itemHref(row.questionCode)} className={styles.questionLink}>
          {row.text}
        </Link>
        <span className={styles.muted}>
          <span className="code">{row.questionCode}</span>,{' '}
          {titles.get(row.domainCode) ?? row.domainCode}
          {row.reviewNote ? `. Reviewer: ${row.reviewNote}` : ''}
        </span>
      </span>
      {row.reviewState === 'returned' ? (
        <Status kind="review" value="returned" />
      ) : (
        <Status kind="answer" value="not_assessed" />
      )}
    </li>
  )

  return (
    <>
      <PageHeader
        kicker={<span className="code">{department.fullCode}</span>}
        title={department.name}
        lede={
          view.owners.length
            ? `Answered by ${view.owners.map((owner) => owner.name).join(', ')}, department owner${view.owners.length > 1 ? 's' : ''}.`
            : 'No department owner has been invited yet; the client DPO answers for this department.'
        }
        actions={
          can(ctx.principal, 'report.export', { clientId: client.id }) ? (
            <a
              href={`${base}/departments/${department.code}/workbook`}
              className={buttonClass('secondary')}
              rel="nofollow"
            >
              <Download size={16} aria-hidden="true" />
              Download department workbook
            </a>
          ) : null
        }
      >
        {department.headName ? <span>Head: {department.headName}</span> : null}
        {department.active ? null : <span>Inactive</span>}
      </PageHeader>

      <div className={dash.twoUp}>
        {latest && latest.progress.total > 0 ? (
          <Posture
            progress={latest.progress}
            source={{
              code: latest.code,
              title: `${latest.title}, ${department.name} questions`,
              href: `${base}/assessments/${latest.code}?department=${department.id}`,
              status: <AssessmentStatusChip status={latest.status} />,
            }}
            trend={[]}
          />
        ) : (
          <EmptyState icon={ClipboardList} title="No questions assigned yet">
            No question of the latest assessment belongs to this department. The audit team assigns
            questions to departments from the assessment page.
          </EmptyState>
        )}
        <Panel title={`Needs attention (${view.attention.length})`} titleId="attention-title">
          {view.attention.length === 0 ? (
            <EmptyState icon={CircleCheck} title="Nothing waiting" size="quiet">
              Every question of this department is answered and none was sent back.
            </EmptyState>
          ) : (
            <>
              <ul className={local.questions}>
                {view.attention.slice(0, SHOWN).map(attentionRow)}
              </ul>
              {view.attention.length > SHOWN ? (
                <Disclosure summary={`${view.attention.length - SHOWN} more questions`}>
                  <ul className={local.questions}>
                    {view.attention.slice(SHOWN).map(attentionRow)}
                  </ul>
                </Disclosure>
              ) : null}
            </>
          )}
        </Panel>
      </div>

      <FigurePanels
        figures={figures}
        bands={bands}
        links={{
          findings: `${base}/findings?status=open`,
          risks: `${base}/risks`,
          actions: `${base}/actions`,
          evidence: `${base}/evidence`,
        }}
      />

      <div className={dash.twoUp}>
        {latest && latest.domains.length ? (
          <Panel title="Requirement areas" titleId="areas-title">
            <RequirementAreas
              domains={latest.domains}
              titles={titles}
              href={(domain) =>
                `${base}/assessments/${latest.code}?domain=${domain}&department=${department.id}`
              }
            />
          </Panel>
        ) : (
          <div />
        )}
        <Panel title="Open risks" titleId="heatmap-title">
          <Heatmap grid={view.heatmap} bands={bands} />
        </Panel>
      </div>

      <section className={styles.section} aria-labelledby="findings-title">
        <SectionHeader id="findings-title" title="Open findings" count={view.findings.length} />
        {view.findings.length === 0 ? (
          <EmptyState icon={ListChecks} title="No open findings" size="quiet">
            Findings appear when a question of this department is answered No or Partial.
          </EmptyState>
        ) : (
          <DataTable
            rows={view.findings}
            rowKey={(row) => row.id}
            columns={[
              {
                key: 'finding',
                header: 'Finding',
                render: (row) => (
                  <span className={styles.personCell}>
                    <Link href={`${base}/findings/${row.code}`} className={styles.clientName}>
                      {row.title}
                    </Link>
                    <span className={styles.muted}>
                      <Citation>{row.code}</Citation>, question{' '}
                      <span className="code">{row.questionCode}</span> in{' '}
                      <span className="code">{row.assessmentCode}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'type', header: 'Type', render: (row) => <GapChip gapType={row.gapType} /> },
              {
                key: 'risk',
                header: 'Risk',
                render: (row) =>
                  row.band ? (
                    <BandChip band={row.band} score={row.riskScore ?? undefined} />
                  ) : (
                    <span className={styles.muted}>Not rated</span>
                  ),
              },
            ]}
          />
        )}
      </section>

      <section className={styles.section} aria-labelledby="actions-title">
        <SectionHeader id="actions-title" title="Remediation actions" count={view.actions.length} />
        {view.actions.length === 0 ? (
          <EmptyState icon={Wrench} title="No actions planned" size="quiet">
            Actions are planned from this department&apos;s findings by the audit team or the DPO.
          </EmptyState>
        ) : (
          <ActionTable rows={view.actions} clientCode={client.code} />
        )}
      </section>

      <section className={styles.section} aria-labelledby="evidence-title">
        <SectionHeader id="evidence-title" title="Evidence" count={view.evidence.length} />
        {view.evidence.length === 0 ? (
          <EmptyState icon={FileCheck} title="No evidence filed yet" size="quiet">
            Evidence uploaded against this department&apos;s questions and actions appears here.
          </EmptyState>
        ) : (
          <EvidenceTable rows={view.evidence} clientCode={client.code} />
        )}
      </section>
    </>
  )
}
