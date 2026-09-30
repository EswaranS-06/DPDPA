import { isoDate } from '@duatf/core-utils'
import {
  createCallerFactory,
  notFound,
  publicProcedure,
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
  listSectors,
  listVocabularies,
  search,
} from './queries'

const releaseOf = async (ctx: ApiContext) =>
  (await currentRelease(ctx.db)) ?? notFound('A published framework release')

const byCode = z.object({ code: z.string().min(1).max(80) })
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const shortText = z.string().trim().max(200)

export const frameworkLibraryRouter = router({
  release: publicProcedure.query(async ({ ctx }) => {
    const release = await releaseOf(ctx)
    return { version: release.version, publishedAt: release.publishedAt }
  }),

  summary: publicProcedure
    .input(z.object({ asOf: isoDateSchema.optional() }).optional())
    .query(async ({ ctx, input }) =>
      getSummary(ctx.db, await releaseOf(ctx), input?.asOf ?? isoDate(new Date())),
    ),

  obligations: publicProcedure
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

  obligation: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getObligation(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Obligation ${input.code}`),
    ),

  controls: publicProcedure
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

  control: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getControl(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Control ${input.code}`),
    ),

  domains: publicProcedure.query(async ({ ctx }) => listDomains(ctx.db, await releaseOf(ctx))),

  domain: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getDomain(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Domain ${input.code}`),
    ),

  law: publicProcedure.query(async ({ ctx }) => listLaw(ctx.db, await releaseOf(ctx))),

  instrument: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getInstrument(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`${input.code}`),
    ),

  sectors: publicProcedure.query(async ({ ctx }) => listSectors(ctx.db, await releaseOf(ctx))),

  sector: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getSector(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Sector ${input.code}`),
    ),

  processes: publicProcedure
    .input(z.object({ sector: z.string().max(8).optional() }).optional())
    .query(async ({ ctx, input }) => listProcesses(ctx.db, await releaseOf(ctx), input ?? {})),

  process: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getProcess(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Process ${input.code}`),
    ),

  dataElements: publicProcedure.query(async ({ ctx }) =>
    listDataElements(ctx.db, await releaseOf(ctx)),
  ),

  vocabularies: publicProcedure.query(async ({ ctx }) =>
    listVocabularies(ctx.db, await releaseOf(ctx)),
  ),

  vocabulary: publicProcedure
    .input(byCode)
    .query(
      async ({ ctx, input }) =>
        (await getVocabulary(ctx.db, await releaseOf(ctx), input.code)) ??
        notFound(`Vocabulary ${input.code}`),
    ),

  playbooks: publicProcedure.query(async ({ ctx }) => listPlaybooks(ctx.db, await releaseOf(ctx))),

  playbook: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(80) }))
    .query(
      async ({ ctx, input }) =>
        (await getPlaybook(ctx.db, await releaseOf(ctx), input.slug)) ??
        notFound(`Playbook ${input.slug}`),
    ),

  search: publicProcedure
    .input(z.object({ query: z.string().trim().min(1).max(200) }))
    .query(async ({ ctx, input }) => search(ctx.db, await releaseOf(ctx), input.query)),
})

export const createFrameworkLibraryApi = (ctx: ApiContext) =>
  createCallerFactory(frameworkLibraryRouter)(ctx)

export type FrameworkLibraryApi = ReturnType<typeof createFrameworkLibraryApi>
