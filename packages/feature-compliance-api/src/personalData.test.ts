import { describe, expect, it } from 'vitest'
import {
  CATEGORY_CODES,
  defaultLevel,
  DEPARTMENT_PRESETS,
  normaliseCategory,
  PERSONAL_DATA_CATEGORIES,
  presetsFor,
  suggestFor,
  type ProcessHint,
} from './personalData'

const process = (department: string, code: string): ProcessHint => ({
  code,
  title: `${department} process`,
  department,
  dataPrincipals: ['Employee'],
  dataCategories: ['identity', 'financial'],
  typicalSystems: [`${department} system`],
  typicalThirdParties: [`${department} vendor`],
  typicalLawfulBasis: ['s7i'],
})

describe('Personal data categories and suggestions', () => {
  it('TC-C20.1-02 files each knowledge-base category under one category, and suggests by department name', () => {
    // Each knowledge-base category belongs to exactly one category of the data map.
    const kb = PERSONAL_DATA_CATEGORIES.flatMap((category) => category.kbCategories)
    expect(new Set(kb).size).toBe(kb.length)
    expect(new Set(CATEGORY_CODES).size).toBe(CATEGORY_CODES.length)

    // The corrections to the classification table: blood group is health, a postal address is
    // contact, purchase history is behavioural, a proprietor's GSTIN is a business identifier.
    expect(normaliseCategory({ code: 'DE-HLT-012', category: 'health' })).toBe('health')
    expect(normaliseCategory({ code: 'DE-CON-003', category: 'contact' })).toBe('contact')
    expect(normaliseCategory({ code: 'DE-BEH-004', category: 'transaction' })).toBe('behavioural')
    expect(normaliseCategory({ code: 'DE-GOV-010', category: 'gov_id' })).toBe('business')
    expect(normaliseCategory({ code: 'DE-XYZ-001', category: 'something_new' })).toBe('other')

    // Levels come from the category and are raised to L4 by a restricted tag.
    expect(defaultLevel({ code: 'DE-ID-001', category: 'identity', contextTags: [] })).toBe('L2')
    expect(
      defaultLevel({ code: 'DE-EMP-007', category: 'compensation', contextTags: ['financial'] }),
    ).toBe('L4')
    expect(
      defaultLevel({ code: 'DE-ID-002', category: 'identity', contextTags: ['children'] }),
    ).toBe('L2')

    // Department names point to the right kind of department.
    const keys = (name: string, code = '') => presetsFor(name, code).map((preset) => preset.key)
    expect(keys('Human Resources', 'HR')).toEqual(['hr'])
    expect(keys('Purchase & Stores', 'PUR')).toEqual(['procurement'])
    expect(keys('Accounts', 'FIN')).toEqual(['finance'])
    expect(keys('Information Technology', 'IT')).toEqual(['it'])
    expect(keys('Front Office', 'FO')).toEqual(['admin'])
    expect(keys('Academics', 'ACD')).toEqual(['education'])
    expect(keys('Hostel', 'HST')).toEqual(['education'])
    expect(keys('Polytechnic Office', 'POLY')).toEqual(['education'])
    expect(keys('College Admissions', 'ADM')).toEqual(['education'])
    expect(keys('Housekeeping', 'HK')).toEqual([])
    // Every preset lists distinct elements.
    for (const preset of DEPARTMENT_PRESETS) {
      expect(new Set(preset.elements).size, preset.key).toBe(preset.elements.length)
    }

    // Suggestions add the knowledge-base processes of the same department.
    const suggestion = suggestFor('Human Resources', 'HR', [
      process('Human Resources', 'CMN-HR-01'),
      process('Finance', 'CMN-FIN-01'),
    ])
    expect(suggestion.presets).toEqual(['Human resources'])
    expect(suggestion.processes.map((item) => item.code)).toEqual(['CMN-HR-01'])
    expect(suggestion.systems).toEqual(['Human Resources system'])
    expect(suggestion.recipients).toEqual(['Human Resources vendor'])
    expect(suggestion.categories).toEqual(['identifiers', 'financial'])
    expect(suggestion.elements).toContain('DE-FIN-001')
    // A department named after a knowledge-base department matches it even without a preset.
    expect(suggestFor('Clinical', 'CLN', [process('Clinical', 'HLT-01')]).processes).toHaveLength(1)
  })
})
