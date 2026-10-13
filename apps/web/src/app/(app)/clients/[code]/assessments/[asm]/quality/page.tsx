import { buttonClass, EmptyState, PageHeader } from '@duatf/core-ui'
import { NotFoundError, qualityCheck } from '@duatf/feature-compliance-api'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { QualityCountChips, QualityGroups } from '@/components/assessment/Assurance'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; asm: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Quality check ${decodeURIComponent((await params).asm)}`,
})

export default async function Page({ params }: Props) {
  const { code, asm } = await params
  const client = await loadClient(code)
  const report = await qualityCheck(
    await serviceContext(),
    client.id,
    decodeURIComponent(asm),
  ).catch((error: unknown) => {
    if (error instanceof NotFoundError) notFound()
    throw error
  })
  const back = `/clients/${client.code}/assessments/${report.assessment.code}`

  return (
    <>
      <PageHeader
        kicker={<span className="code">{report.assessment.code}</span>}
        title="Quality check"
        lede="What to look at before this assessment is signed off. An error means an answer or record cannot stand as it is; a warning should be dealt with; a note is for information. The list is worked out afresh each time from the answers, evidence, findings, actions and risks."
        actions={
          <Link href={back} className={buttonClass('secondary')}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to the assessment
          </Link>
        }
      >
        <QualityCountChips counts={report.counts} />
      </PageHeader>
      {report.issues.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Nothing is flagged">
          Every answer that claims compliance has current evidence, gaps have notes, findings have
          actions and no acceptance has lapsed.
        </EmptyState>
      ) : (
        <QualityGroups report={report} clientCode={client.code} />
      )}
    </>
  )
}
