export {
  bullets,
  buildDocument,
  facts,
  heading,
  pageBreak,
  para,
  picture,
  table,
  type Block,
  type Run,
} from './src/docxKit'
export { documentText, documentMedia } from './src/docxText'
export { barsSvg, radarSvg, svgToPng, type BarsInput, type RadarInput } from './src/chartImages'
export {
  loadLibrary,
  fieldUsage,
  loadRegisterLayouts,
  libraryRoot,
  loadTemplates,
  loadBlocks,
  loadRegistry,
  loadFlags,
  splitFrontMatter,
  readLibraryText,
  TEMPLATE_DIRS,
  type LibraryData,
  type Template,
  type Registry,
  type RegistryEntry,
  type GlobalFlag,
  type DocFlag,
} from './src/library/library'
export {
  render,
  buildFlags,
  evaluateCondition,
  isTruthy,
  formatIsoDate,
  parseDurationDays,
  DOC_LEVEL_FIELDS,
  type RenderState,
  type RenderAnalysis,
  type RenderOptions,
  type FlagValue,
  type CollectionRow,
} from './src/library/engine'
export {
  parseSections,
  defaultSelection,
  buildClause,
  cleanTitle,
  sentenceCase,
  applyReplacements,
  CLAUSE_TITLES,
  CLAUSE_REPLACE,
  PACK_PRESETS,
  type Section,
  type ClauseOptions,
} from './src/library/clauses'
export {
  structureIssues,
  documentChecks,
  projectChecks,
  recommendedTemplates,
  EIGHTH_SCHEDULE,
  CONTACT_BLOCK_TEMPLATES,
  type CheckResult,
  type CheckLevel,
} from './src/library/checks'
export {
  loadChecklist,
  checklistFor,
  type ChecklistGroup,
  type CounselPoint,
} from './src/library/checklist'
export {
  importLibrary,
  verifyLibrary,
  readManifest,
  keptFile,
  sha256,
  MANIFEST,
  type Manifest,
  type ImportReport,
} from './src/library/manifest'
export { markdownBlocks, markdownHtml, decodeEntities } from './src/library/markdownDocx'
export { zipFiles } from './src/library/zip'
