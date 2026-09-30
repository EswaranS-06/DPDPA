import { randomUUID } from 'node:crypto'
import type { Principal } from '@duatf/core-access'
import {
  acceptRisk,
  answerItem,
  assignItems,
  changeAssessmentStatus,
  createAction,
  createAssessment,
  createClient,
  createDepartment,
  createReassessment,
  inviteClientUser,
  inviteFirmStaff,
  linkActionEvidence,
  linkEvidence,
  listFindings,
  listItems,
  reviewEvidence,
  reviewItem,
  transitionAction,
  updateRisk,
  uploadEvidence,
  type EvidenceStorage,
  type ItemRow,
  type ServiceContext,
} from '@duatf/feature-compliance-api'
import {
  appUser,
  clientProfile,
  eq,
  evidence,
  ilike,
  inArray,
  tenant,
  withTenants,
  type Database,
} from '@duatf/platform-db'
import { loadPrincipal } from '@duatf/platform-identity'
import { demoClock, type DemoClock } from './clock'
import { renderDocument, type DocumentSpec } from './files'
import {
  DEMO_STAFF,
  DEMO_STORIES,
  LOADER,
  type ClientStory,
  type CycleSpec,
  type EvidenceSpec,
} from './story'

export type DemoDependencies = {
  /** The application connection (row-level security applies); all changes go through services. */
  db: Database
  /** The owner connection, used only to date the demo events and to remove old demo data. */
  ownerDb: Database
  storage: EvidenceStorage
}

export type DemoSummary = {
  clients: { code: string; name: string; assessments: number; findings: number; actions: number }[]
  people: string[]
}

// Demo people get no sign-in account; an administrator can issue one from a client's People page.
const PENDING_ACCOUNT = 'demo-pending-'
const provisioner = {
  provision: () => Promise.resolve(`${PENDING_ACCOUNT}${randomUUID()}`),
  setEnabled: () => Promise.resolve(),
}

const serviceFor =
  (deps: DemoDependencies) =>
  (principal: Principal): ServiceContext => ({
    db: deps.db,
    principal,
    provisioner,
    storage: deps.storage,
  })

/** A demo client is recognisable by its contact addresses on the reserved .example domain. */
const isDemoClient = (primaryContactEmail: string) => primaryContactEmail.endsWith('.example')

const demoEmails = () => [
  ...Object.values(DEMO_STAFF).map((person) => person.email),
  ...DEMO_STORIES.flatMap((story) => story.people.map((person) => person.email)),
]

/**
 * Removes the demo clients (and their evidence files). Refuses to touch a client that uses a
 * demo client ID but is not demo data. Demo people are kept, so any sign-in accounts made for
 * them keep working.
 */
export const removeDemo = async (deps: DemoDependencies): Promise<string[]> => {
  const codes = DEMO_STORIES.map((story) => story.profile.code)
  const found = await withTenants(deps.ownerDb, 'all', (tx) =>
    tx
      .select({ id: tenant.id, code: tenant.code, contact: clientProfile.primaryContactEmail })
      .from(tenant)
      .leftJoin(clientProfile, eq(clientProfile.tenantId, tenant.id))
      .where(inArray(tenant.code, codes)),
  )
  const foreign = found.filter((row) => !isDemoClient(row.contact ?? ''))
  if (foreign.length) {
    throw new Error(
      `Client ${foreign.map((row) => row.code).join(', ')} exists and is not demo data; the demo was not loaded. Rename that client's ID first.`,
    )
  }
  if (found.length === 0) return []
  const ids = found.map((row) => row.id)
  const keys = await withTenants(deps.ownerDb, 'all', (tx) =>
    tx.select({ key: evidence.storageKey }).from(evidence).where(inArray(evidence.tenantId, ids)),
  )
  for (const { key } of keys) await deps.storage.remove(key).catch(() => undefined)
  await withTenants(deps.ownerDb, 'all', (tx) => tx.delete(tenant).where(inArray(tenant.id, ids)))
  return found.map((row) => row.code)
}

/** The loader acts as a firm administrator only to onboard the clients and invite people. */
const loaderPrincipal = async (deps: DemoDependencies): Promise<Principal> => {
  await deps.ownerDb
    .insert(appUser)
    .values({ email: LOADER.email, displayName: LOADER.name, kind: 'firm', status: 'disabled' })
    .onConflictDoNothing({ target: appUser.email })
  const [row] = await deps.ownerDb
    .select({ id: appUser.id })
    .from(appUser)
    .where(eq(appUser.email, LOADER.email))
  return {
    userId: row?.id ?? '',
    email: LOADER.email,
    displayName: LOADER.name,
    assignments: [{ role: 'firm_admin', clientId: null, departmentId: null }],
  }
}

type Event = { day: number; order: number; label: string; run: () => Promise<void> }

/** Everything learned while a client's story runs: ids of what was created, by key. */
type Run = {
  story: ClientStory
  clientId: string
  departments: Map<string, string>
  people: Map<string, Principal>
  cycles: Map<string, { id: string; code: string; items: Map<string, ItemRow> }>
  evidence: Map<string, string>
  actions: Map<string, string>
}

const byDomainIndex = (domainCode: string) => Number(domainCode.slice(1)) - 1

/** Runs one client's story through the services, event by event in date order. */
const tellStory = async (
  deps: DemoDependencies,
  clock: DemoClock,
  story: ClientStory,
  loader: Principal,
): Promise<Run> => {
  const as = serviceFor(deps)
  const events: Event[] = []
  const schedule = (day: number, label: string, run: () => Promise<void>) =>
    events.push({ day, order: events.length, label, run })

  const state: Run = {
    story,
    clientId: '',
    departments: new Map(),
    people: new Map(),
    cycles: new Map(),
    evidence: new Map(),
    actions: new Map(),
  }
  const person = (key: string) => {
    const found = state.people.get(key)
    if (!found) throw new Error(`Demo person ${key} is not loaded.`)
    return found
  }
  const department = (code: string) => {
    const found = state.departments.get(code)
    if (!found) throw new Error(`Demo department ${code} is not loaded.`)
    return found
  }
  const cycle = (key: string) => {
    const found = state.cycles.get(key)
    if (!found) throw new Error(`Demo cycle ${key} is not loaded.`)
    return found
  }
  const item = (cycleKey: string, question: string) => {
    const found = cycle(cycleKey).items.get(question)
    if (!found) throw new Error(`Question ${question} is not in ${cycleKey}.`)
    return found
  }
  const departmentOf = (question: string, domainCode: string) =>
    story.questionDepartment[question] ?? story.domainDepartment[domainCode] ?? 'ADM'
  const answererOf = (question: string, domainCode: string) => {
    if (story.scoping.includes(question)) return person('lead')
    const code = departmentOf(question, domainCode)
    const owner = story.people.find(
      (entry) => entry.role === 'department_owner' && entry.department === code,
    )
    return person(owner?.key ?? 'dpo')
  }
  const refreshItems = async (key: string) => {
    const entry = cycle(key)
    const rows = await listItems(as(person('lead')), state.clientId, entry.id)
    entry.items = new Map(rows.map((row) => [row.questionCode, row]))
  }
  const findingOf = async (cycleKey: string, question: string) => {
    const rows = await listFindings(as(person('lead')), state.clientId, {
      assessmentId: cycle(cycleKey).id,
    })
    const found = rows.find((row) => row.questionCode === question)
    if (!found) throw new Error(`No finding for ${question} in ${cycleKey}.`)
    return found
  }
  const upload = async (
    by: Principal,
    input: {
      key: string
      title: string
      description?: string
      departmentId: string
      itemIds: string[]
      validUntil?: string
      document: DocumentSpec
    },
  ) => {
    const file = await renderDocument(input.document)
    const created = await uploadEvidence(
      as(by),
      state.clientId,
      {
        title: input.title,
        description: input.description,
        departmentId: input.departmentId,
        itemIds: input.itemIds.join(','),
        validUntil: input.validUntil,
      },
      file,
    )
    state.evidence.set(input.key, created.id)
    return created.id
  }
  const scheduleEvidenceReview = (key: string, review: EvidenceSpec['review']) => {
    if (!review) return
    schedule(review.day, `review evidence ${key}`, async () => {
      await reviewEvidence(as(person('auditor')), state.clientId, state.evidence.get(key) ?? '', {
        decision: review.decision,
        note: review.note,
      })
    })
  }

  // Onboarding: the client, its departments, its people and the ComplyX team.
  schedule(story.onboardDay, 'onboard', async () => {
    const created = await createClient(as(loader), {
      ...story.profile,
      assessmentPeriodStart: clock.date(story.periodStart),
      assessmentPeriodEnd: clock.date(story.periodEnd),
    })
    state.clientId = created.id
    for (const spec of story.departments) {
      const made = await createDepartment(as(loader), created.id, {
        code: spec.code,
        name: spec.name,
        headName: spec.head,
        headEmail: spec.headEmail,
        description: spec.description,
      })
      state.departments.set(spec.code, made.id)
    }
    const invited: [string, string][] = []
    for (const spec of story.people) {
      const result = await inviteClientUser(as(loader), created.id, {
        email: spec.email,
        displayName: spec.name,
        role: spec.role,
        departmentId: spec.department ? department(spec.department) : undefined,
      })
      invited.push([spec.key, result.userId])
    }
    for (const [key, spec] of Object.entries(DEMO_STAFF)) {
      const result = await inviteFirmStaff(as(loader), {
        email: spec.email,
        displayName: spec.name,
        role: spec.role,
        clientId: created.id,
      })
      invited.push([key, result.userId])
    }
    await withTenants(deps.ownerDb, 'all', (tx) =>
      tx
        .update(appUser)
        .set({ keycloakId: null })
        .where(ilike(appUser.keycloakId, `${PENDING_ACCOUNT}%`)),
    )
    for (const [key, userId] of invited) {
      const [row] = await deps.ownerDb
        .select({ email: appUser.email, name: appUser.displayName })
        .from(appUser)
        .where(eq(appUser.id, userId))
      state.people.set(
        key,
        await withTenants(deps.ownerDb, 'all', (tx) =>
          loadPrincipal(tx, { userId, email: row?.email ?? '', displayName: row?.name ?? key }),
        ),
      )
    }
  })

  const scheduleCycle = (spec: CycleSpec) => {
    const previous = story.cycles[story.cycles.indexOf(spec) - 1]
    schedule(spec.createDay, `create ${spec.key}`, async () => {
      const input = {
        title: spec.title,
        periodStart: clock.date(spec.periodStart),
        periodEnd: clock.date(spec.periodEnd),
        dueDate: clock.date(spec.dueIn),
      }
      const lead = as(person('lead'))
      const created = previous
        ? await createReassessment(lead, state.clientId, cycle(previous.key).id, input)
        : await createAssessment(lead, state.clientId, input)
      state.cycles.set(spec.key, { id: created.id, code: created.code, items: new Map() })
      await refreshItems(spec.key)
      if (!previous) {
        const byDepartment = new Map<string, string[]>()
        for (const row of cycle(spec.key).items.values()) {
          const code = departmentOf(row.questionCode, row.domainCode)
          byDepartment.set(code, [...(byDepartment.get(code) ?? []), row.id])
        }
        for (const [code, itemIds] of byDepartment) {
          await assignItems(lead, state.clientId, created.id, {
            departmentId: department(code),
            itemIds: itemIds.join(','),
          })
        }
        await refreshItems(spec.key)
      }
    })

    // Answers, one domain per event, spread over the answering days.
    const [first, last] = spec.answerDays
    for (let index = 0; index < 18; index += 1) {
      const domainCode = `D${String(index + 1).padStart(2, '0')}`
      const day = first + Math.round((index * (last - first)) / 17)
      schedule(day, `answer ${spec.key} ${domainCode}`, async () => {
        for (const row of cycle(spec.key).items.values()) {
          if (byDomainIndex(row.domainCode) !== index) continue
          const answer = spec.answers[row.questionCode]
          if (!answer) continue
          await answerItem(
            as(answererOf(row.questionCode, row.domainCode)),
            state.clientId,
            row.id,
            {
              answer: answer[0],
              comment: answer[0] === 'not_applicable' ? undefined : answer[1],
              naReason: answer[0] === 'not_applicable' ? answer[1] : undefined,
            },
          )
        }
      })
    }

    for (const evidenceSpec of spec.evidence) {
      schedule(evidenceSpec.day, `evidence ${evidenceSpec.key}`, async () => {
        await upload(person(evidenceSpec.by), {
          key: evidenceSpec.key,
          title: evidenceSpec.title,
          description: evidenceSpec.description,
          departmentId: department(evidenceSpec.department),
          itemIds: evidenceSpec.questions.map((question) => item(spec.key, question).id),
          validUntil:
            evidenceSpec.validUntilIn === undefined
              ? undefined
              : clock.date(evidenceSpec.validUntilIn),
          document: evidenceSpec.document,
        })
      })
      scheduleEvidenceReview(evidenceSpec.key, evidenceSpec.review)
    }

    for (const link of spec.links) {
      schedule(link.day, `link ${link.evidence}`, async () => {
        await linkEvidence(
          as(person(link.by)),
          state.clientId,
          state.evidence.get(link.evidence) ?? '',
          {
            itemIds: link.questions.map((question) => item(spec.key, question).id).join(','),
          },
        )
      })
    }

    for (const back of spec.returned) {
      schedule(back.day, `return ${back.question}`, async () => {
        const row = item(spec.key, back.question)
        await reviewItem(as(person('auditor')), state.clientId, row.id, {
          decision: 'returned',
          note: back.note,
        })
      })
      const fix = back.fix
      if (fix) {
        schedule(fix.day, `fix ${back.question}`, async () => {
          const row = item(spec.key, back.question)
          await answerItem(
            as(answererOf(row.questionCode, row.domainCode)),
            state.clientId,
            row.id,
            {
              answer: fix.answer,
              comment: fix.comment,
            },
          )
        })
      }
    }

    // The auditor accepts answers domain by domain; questions sent back and not fixed wait.
    const reviewDomains =
      spec.review.domains === 'all'
        ? Array.from({ length: 18 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`)
        : spec.review.domains
    const waiting = new Set(spec.returned.filter((back) => !back.fix).map((back) => back.question))
    const [reviewFrom, reviewTo] = spec.review.days
    reviewDomains.forEach((domainCode, index) => {
      const day =
        reviewDomains.length > 1
          ? reviewFrom + Math.round((index * (reviewTo - reviewFrom)) / (reviewDomains.length - 1))
          : reviewFrom
      schedule(day, `review ${spec.key} ${domainCode}`, async () => {
        await refreshItems(spec.key)
        for (const row of cycle(spec.key).items.values()) {
          if (row.domainCode !== domainCode || waiting.has(row.questionCode)) continue
          if (row.answer === 'not_assessed' || row.reviewState === 'accepted') continue
          await reviewItem(as(person('auditor')), state.clientId, row.id, { decision: 'accepted' })
        }
      })
    })

    const complete = spec.complete
    if (complete) {
      schedule(complete.submitDay, `submit ${spec.key}`, async () => {
        await changeAssessmentStatus(
          as(person('lead')),
          state.clientId,
          cycle(spec.key).id,
          'in_review',
        )
      })
      schedule(complete.completeDay, `complete ${spec.key}`, async () => {
        await changeAssessmentStatus(
          as(person('lead')),
          state.clientId,
          cycle(spec.key).id,
          'completed',
        )
      })
    }

    for (const rating of spec.risks) {
      schedule(rating.day, `rate ${rating.question}`, async () => {
        const found = await findingOf(spec.key, rating.question)
        await updateRisk(as(person('auditor')), state.clientId, found.riskId ?? '', {
          likelihood: rating.likelihood,
          impact: rating.impact,
          treatment: 'mitigate',
          status: 'open',
          ownerName: rating.owner,
          description: rating.description,
        })
      })
    }

    for (const action of spec.actions) {
      schedule(action.createdDay, `plan ${action.key}`, async () => {
        const found = await findingOf(spec.key, action.question)
        const created = await createAction(as(person('lead')), state.clientId, found.id, {
          title: action.title,
          description: action.description,
          ownerUserId: action.owner ? person(action.owner).userId : undefined,
          departmentId: department(action.department),
          dueDate: clock.date(action.dueIn),
        })
        state.actions.set(action.key, created.id)
      })
      for (const step of action.steps) {
        const actionId = () => state.actions.get(action.key) ?? ''
        const owner = () => person(action.owner ?? 'dpo')
        const move = (to: string, by: Principal, note?: string) =>
          transitionAction(as(by), state.clientId, actionId(), { to, note })
        if (step.step === 'evidence') {
          const key = `${action.key}-evidence`
          schedule(step.day, `action evidence ${key}`, async () => {
            const evidenceId = await upload(owner(), {
              key,
              title: step.title,
              departmentId: department(action.department),
              itemIds: [],
              document: step.document,
            })
            await linkActionEvidence(as(owner()), state.clientId, actionId(), evidenceId)
          })
          scheduleEvidenceReview(key, step.review)
          continue
        }
        schedule(step.day, `${step.step} ${action.key}`, async () => {
          if (step.step === 'reject') await move('rejected', person('auditor'), step.note)
          else if (step.step === 'start') await move('in_progress', owner())
          else if (step.step === 'wait') await move('pending_evidence', owner())
          else if (step.step === 'submit') await move('under_review', owner())
          else if (step.step === 'verify') await move('remediated', person('auditor'))
          else await move('closed', person('lead'))
        })
      }
    }

    for (const acceptance of spec.acceptances) {
      schedule(acceptance.day, `accept ${acceptance.question}`, async () => {
        const found = await findingOf(spec.key, acceptance.question)
        await acceptRisk(as(person('dpo')), state.clientId, found.riskId ?? '', {
          note: acceptance.note,
        })
      })
    }
  }

  for (const spec of story.cycles) scheduleCycle(spec)

  const emails = demoEmails()
  const scope = () => ({ clientIds: state.clientId ? [state.clientId] : [], emails })
  for (const event of [...events].sort((a, b) => a.day - b.day || a.order - b.order)) {
    try {
      await clock.at(event.day, scope, event.run)
    } catch (error) {
      throw new Error(
        `Demo step "${event.label}" (${story.profile.code}, day ${event.day}) failed`,
        {
          cause: error,
        },
      )
    }
  }
  return state
}

/**
 * Loads the demo: removes any earlier demo clients, then tells the Nadall (hospital) and AMMA
 * (school) stories through the services, dated over the past months.
 */
export const loadDemo = async (deps: DemoDependencies): Promise<DemoSummary> => {
  await removeDemo(deps)
  const clock = demoClock(deps.ownerDb)
  const loader = await loaderPrincipal(deps)
  const clients: DemoSummary['clients'] = []
  for (const story of DEMO_STORIES) {
    const run = await tellStory(deps, clock, story, loader)
    clients.push({
      code: story.profile.code,
      name: story.profile.name,
      assessments: run.cycles.size,
      findings: (await listFindings(serviceFor(deps)(loader), run.clientId)).length,
      actions: run.actions.size,
    })
  }
  return { clients, people: demoEmails() }
}
