import {
  APPLICABILITY_LABEL,
  CLIENT_STATUS_LABEL,
  getClient,
  INDIAN_STATES,
  NotFoundError,
  ORGANISATION_TYPE_LABEL,
  type ClientDetail,
} from '@duatf/feature-compliance-api'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import type { ClientFormOptions } from '@/components/forms/ClientForm'
import { libraryApi } from './api'
import { serviceContext } from './services'

/** The client for this request by its client ID; "not found" outside the user's scope. */
export const loadClient = cache(async (code: string): Promise<ClientDetail> => {
  const ctx = await serviceContext()
  try {
    return await getClient(ctx, decodeURIComponent(code))
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }
})

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

/** Choices for the client form; sector overlays come from the knowledge base. */
export const clientFormOptions = async (): Promise<ClientFormOptions> => {
  const sectors = await (await libraryApi()).sectors()
  return {
    organisationTypes: toOptions(ORGANISATION_TYPE_LABEL),
    statuses: toOptions(CLIENT_STATUS_LABEL),
    applicability: toOptions(APPLICABILITY_LABEL),
    states: INDIAN_STATES.map((state) => ({ value: state, label: state })),
    sectors: sectors.map((sector) => ({ value: sector.code, label: sector.title })),
  }
}

/** A client's stored profile as form values. */
export const clientFormValues = (client: ClientDetail): Record<string, string> => {
  const text = (value: string | number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)
  return {
    name: client.name,
    legalName: client.legalName,
    industry: client.industry,
    sectorCode: text(client.sectorCode),
    organisationType: client.organisationType,
    website: text(client.website),
    country: client.country,
    state: text(client.state),
    address: text(client.address),
    employeeCount: text(client.employeeCount),
    dataPrincipalCount: text(client.dataPrincipalCount),
    dpoName: text(client.dpoName),
    dpoEmail: text(client.dpoEmail),
    dpoPhone: text(client.dpoPhone),
    primaryContactName: client.primaryContactName,
    primaryContactEmail: client.primaryContactEmail,
    primaryContactPhone: text(client.primaryContactPhone),
    assessmentPeriodStart: text(client.assessmentPeriodStart),
    assessmentPeriodEnd: text(client.assessmentPeriodEnd),
    applicability: client.applicability,
    applicabilityNote: text(client.applicabilityNote),
    status: client.status,
  }
}
