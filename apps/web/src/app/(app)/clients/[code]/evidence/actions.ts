'use server'

import {
  linkEvidence,
  reviewEvidence,
  unlinkEvidence,
  uploadEvidence,
} from '@duatf/feature-compliance-api'
import { revalidatePath } from 'next/cache'
import { failure, formValues, serviceContext, type FormState } from '@/server/services'

type Target = { clientId: string; clientCode: string; returnPath: string }

const refresh = (target: Target) => {
  revalidatePath(target.returnPath)
  revalidatePath(`/clients/${encodeURIComponent(target.clientCode)}/evidence`, 'layout')
}

export const uploadEvidenceAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = {
    ...formValues(formData),
    requestIds: formData
      .getAll('requestIds')
      .filter((item) => typeof item === 'string')
      .join(','),
  }
  const file = formData.get('file')
  try {
    if (!(file instanceof File) || file.size === 0) {
      return {
        status: 'error',
        message: 'Choose a file to upload.',
        fieldErrors: { file: 'Choose a file.' },
        values,
      }
    }
    const uploaded = await uploadEvidence(await serviceContext(), target.clientId, values, {
      name: file.name,
      bytes: Buffer.from(await file.arrayBuffer()),
    })
    refresh(target)
    return {
      status: 'success',
      message: `Uploaded as ${uploaded.code}. SHA-256 ${uploaded.sha256.slice(0, 16)}…`,
    }
  } catch (error) {
    return failure(error, values)
  }
}

export const linkEvidenceAction = async (
  target: Target,
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    const linked = await linkEvidence(
      await serviceContext(),
      target.clientId,
      values.evidenceId ?? '',
      values,
    )
    refresh(target)
    return { status: 'success', message: linked ? 'Evidence linked.' : 'It was already linked.' }
  } catch (error) {
    return failure(error, values)
  }
}

export const unlinkEvidenceAction = async (target: Target, formData: FormData): Promise<void> => {
  const values = formValues(formData)
  await unlinkEvidence(
    await serviceContext(),
    target.clientId,
    values.evidenceId ?? '',
    values.itemId ?? '',
  )
  refresh(target)
}

export const reviewEvidenceAction = async (
  target: Target & { evidenceId: string },
  _: FormState,
  formData: FormData,
): Promise<FormState> => {
  const values = formValues(formData)
  try {
    await reviewEvidence(await serviceContext(), target.clientId, target.evidenceId, values)
    refresh(target)
    return {
      status: 'success',
      message: values.decision === 'accepted' ? 'Evidence accepted.' : 'Evidence rejected.',
    }
  } catch (error) {
    return failure(error, values)
  }
}
