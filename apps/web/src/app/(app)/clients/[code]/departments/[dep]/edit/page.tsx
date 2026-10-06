import { PageHeader } from '@duatf/core-ui'
import { departmentQuestionPicker, listDepartments } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DepartmentForm } from '@/components/forms/DepartmentForms'
import { NewerReleaseNotice } from '@/components/forms/NewerReleaseNotice'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { updateDepartmentAction } from '../../../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit department' }

type Props = { params: Promise<{ code: string; dep: string }> }

export default async function Page({ params }: Props) {
  const { code, dep } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const found = (await listDepartments(ctx, client.id)).find(
    (row) => row.code === decodeURIComponent(dep).toUpperCase(),
  )
  if (!found) notFound()
  const picker = await departmentQuestionPicker(ctx, client.id, found.id)
  const inactive = found.active
    ? null
    : 'This department is inactive. Reactivate it from the department list to give it questions.'
  return (
    <>
      <PageHeader
        kicker={<span className="code">{found.fullCode}</span>}
        title={`Edit ${found.name}`}
        lede={
          picker.cycle
            ? `Questions are changed in ${picker.cycle.code}. Answered questions, and those with evidence or a finding, stay with the department.`
            : 'The questions you choose open the first assessment cycle of this client.'
        }
      />
      <NewerReleaseNotice clientCode={client.code} picker={picker} />
      <DepartmentForm
        action={updateDepartmentAction.bind(null, {
          clientId: client.id,
          clientCode: client.code,
          departmentId: found.id,
          departmentCode: found.code,
          active: found.active,
        })}
        questionnaires={picker.questionnaires}
        closed={inactive ?? picker.closed}
        defaults={found}
        editing
      />
    </>
  )
}
