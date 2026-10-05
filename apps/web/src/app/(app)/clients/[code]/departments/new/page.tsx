import { PageHeader } from '@duatf/core-ui'
import { departmentQuestionPicker } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { DepartmentForm } from '@/components/forms/DepartmentForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { createDepartmentAction } from '../../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Add department' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const picker = await departmentQuestionPicker(ctx, client.id, null)
  return (
    <>
      <PageHeader
        title="Add a department"
        lede={`A department of ${client.name}, or one of its vendors. Choose the questions it answers: the Data Fiduciary questions for the organisation-level owners, the internal handler module for each department, the external handler questionnaire for each vendor.`}
      />
      <DepartmentForm
        action={createDepartmentAction.bind(null, client.id, client.code)}
        questionnaires={picker.questionnaires}
        closed={picker.closed}
      />
    </>
  )
}
