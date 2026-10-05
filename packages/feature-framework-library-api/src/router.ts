import { can } from '@duatf/core-access'
import { isoDate } from '@duatf/core-utils'
import {
  createCallerFactory,
  notFound,
  authedProcedure,
  router,
  type ApiContext,
} from '@duatf/platform-trpc'
import { z } from 'zod'
import {
  currentRelease,
  getControl,
  getDomain,
  getInstrument,
  getObligation,
  getPlaybook,
  getProcess,
  getQuestion,
  getSector,
  getSummary,
  getVocabulary,
  listControls,
  listDataElements,
  listDomains,
  listLaw,
  listObligations,
  listPlaybooks,
  listProcesses,
  listQuestionnaires,
  listQuestions,
  listSection,
  listSectors,
  listVocabularies,
  search,
} from './queries'
import { EDITABLE_SECTIONS, KB_LIST_SECTIONS } from './refs'
import { openDraft, releaseReviews } from './releases'

/**
 * The release a request reads: the published one, or the open draft for an editor who asked
 * to see it (ctx.kbDraft). Everyone else always reads the published release.
 */
const releaseOf = async (ctx: ApiContext) => {
  if (ctx.kbDraft && ctx.principal && can(ctx.principal, 'kb.edit')) {
    const draft = await openDraft(ctx.db)
    if (draft) {
      return { id: draft.id, version: draft.version, publishedAt: null, source: draft.source }
    }
  }
  return (await currentRelease(ctx.db)) ?? notFound('A published framework release')
}

const byCode = z.object({ code: z.string().min(1).max(80) })
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const shortText = z.string().trim().max(200)

export const frameworkLibraryRouter = router({
  release: authedProcedure.query(async ({ ctx }) => {
    const release = await releaseOf(ctx)
    return { version: release.version, publishedAt: release.publishedAt }
  }),

  /** Entries of an editable section that were added or changed in the editor, with review status. */
  reviews: authedProcedure
    .input(z.object({ section: z.enum(EDITABLE_SECTIONS) }))
    .query(async ({ ctx, input }) =>
      (await releaseReviews(ctx.db, (await releaseOf(ctx)).id, input.section)).map((row) => ({
        code: row.code,
        status: row.status,
        origin: row.origin,
      })),
    ),

  summary: authedProcedure
    .input(z.object({ asOf: isoDateSchema.optional() }).optional())
    .query(async ({ ctx, input }) =>
      getSummary(ctx.db, await releaseOf(ctx), input?.asOf ?? isoDate(new Date())),
    ),

  obligations: authedProcedure
    .input(
      z
        .object({
          domain: z.string().max(8).optional(),
          phase: z.number().int().min(0).max(9).optional(),
          penaltyTier: z.string().max(4).optional(),
          actor: z.string().max(40).optional(),
          text: shortText.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => listObligations(ctx.db, await releaseOf(ctx), input ?? {})),

  obligation: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getObligation(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Obligation ${input.code}`),
    ),

  controls: authedProcedure
    .input(
      z
        .object({
          domain: z.string().max(8).optional(),
          controlType: z.string().max(20).optional(),
          text: shortText.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => listControls(ctx.db, await releaseOf(ctx), input ?? {})),

  control: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getControl(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Control ${input.code}`),
    ),

  questions: authedProcedure
    .input(
      z
        .object({
          domain: z.string().max(8).optional(),
          text: shortText.optional(),
          questionnaire: z.string().max(12).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => listQuestions(ctx.db, await releaseOf(ctx), input ?? {})),

  questionnaires: authedProcedure.query(async ({ ctx }) =>
    listQuestionnaires(ctx.db, await releaseOf(ctx)),
  ),

  question: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getQuestion(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Question ${input.code}`),
    ),

  section: authedProcedure
    .input(z.object({ section: z.enum(KB_LIST_SECTIONS) }))
    .query(async ({ ctx, input }) => listSection(ctx.db, await releaseOf(ctx), input.section)),

  domains: authedProcedure.query(async ({ ctx }) => listDomains(ctx.db, await releaseOf(ctx))),

  domain: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getDomain(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Domain ${input.code}`),
    ),

  law: authedProcedure.query(async ({ ctx }) => listLaw(ctx.db, await releaseOf(ctx))),

  instrument: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getInstrument(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`${input.code}`),
    ),

  sectors: authedProcedure.query(async ({ ctx }) => listSectors(ctx.db, await releaseOf(ctx))),

  sector: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getSector(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Sector ${input.code}`),
    ),

  processes: authedProcedure
    .input(z.object({ sector: z.string().max(8).optional() }).optional())
    .query(async ({ ctx, input }) => listProcesses(ctx.db, await releaseOf(ctx), input ?? {})),

  process: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getProcess(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Process ${input.code}`),
    ),

  dataElements: authedProcedure.query(async ({ ctx }) =>
    listDataElements(ctx.db, await releaseOf(ctx)),
  ),

  vocabularies: authedProcedure.query(async ({ ctx }) =>
    listVocabularies(ctx.db, await releaseOf(ctx)),
  ),

  vocabulary: authedProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getVocabulary(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Vocabulary ${input.code}`),
    ),

  playbooks: authedProcedure.query(async ({ ctx }) => listPlaybooks(ctx.db, await releaseOf(ctx))),

  playbook: authedProcedure
    .input(z.object({ slug: z.string().min(1).max(80) }))
    .query(
      async ({ ctx, input }) =>
        (await getPlaybook(ctx.db, await releaseOf(ctx), input.slug)) ??
        notFound(`Playbook ${input.slug}`),
    ),

  search: authedProcedure
    .input(z.object({ query: z.string().trim().min(1).max(200) }))
    .query(async ({ ctx, input }) => search(ctx.db, await releaseOf(ctx), input.query)),
})

export const createFrameworkLibraryApi = (ctx: ApiContext) =>
  createCallerFactory(frameworkLibraryRouter)(ctx)

export type FrameworkLibraryApi = ReturnType<typeof createFrameworkLibraryApi>
