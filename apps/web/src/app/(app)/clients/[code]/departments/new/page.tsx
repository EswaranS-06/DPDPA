import { PageHeader } from '@duatf/core-ui'
import { dataElementPicker, departmentQuestionPicker } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { DepartmentForm } from '@/components/forms/DepartmentForms'
import { NewerReleaseNotice } from '@/components/forms/NewerReleaseNotice'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { createDepartmentAction } from '../../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Add department' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const [picker, data] = await Promise.all([
    departmentQuestionPicker(ctx, client.id, null),
    dataElementPicker(ctx, client.id),
  ])
  return (
    <>
      <PageHeader
        title="Add a department"
        lede={`A department of ${client.name}, or one of its vendors. Say what personal data it handles, then choose the questions it answers: the Data Fiduciary questions for the organisation-level owners, the internal handler modules for each department, the external handler questionnaire for each vendor.`}
      />
      <NewerReleaseNotice clientCode={client.code} picker={picker} />
      <DepartmentForm
        action={createDepartmentAction.bind(null, client.id, client.code)}
        questionnaires={picker.questionnaires}
        closed={picker.closed}
        personalData={{
          elements: data.catalogue.elements.map((row) => ({
            code: row.code,
            title: row.title,
            category: row.category,
            level: row.level,
            note: row.note,
            personalData: row.personalData,
          })),
          processes: data.catalogue.processes,
        }}
      />
    </>
  )
}
