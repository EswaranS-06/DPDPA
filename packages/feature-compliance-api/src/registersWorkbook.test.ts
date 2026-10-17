import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { libraryRoot } from '@duatf/platform-documents'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { recordBreach } from './breaches'
import { createProcessor } from './processors'
import { buildRegistersWorkbook, REGISTER_SHEETS } from './registersWorkbook'
import { recordRightsRequest } from './rights'
import { closeWorld, newClient, openWorld, type World } from './testing'

let world: World
beforeAll(() => {
  world = openWorld()
})
afterAll(() => closeWorld(world))

/** The header row of a register layout, read straight from the library's CSV. */
const header = (file: string) =>
  (readFileSync(join(libraryRoot(), 'registers', file), 'utf8').split(/\r?\n/)[0] ?? '').split(',')

describe('registers workbook', () => {
  it('TC-C25.6-01 the registers workbook has the library’s seven registers with their columns exactly as the library lays them out, filled from DUATF’s records where it holds the data', async () => {
    const client = await newClient(world, 'Registers')
    await createProcessor(world.ctx, client.id, {
      name: 'PayFast',
      kind: 'processor',
      location: 'india',
      contract: 'yes',
      service: 'Payroll',
    })
    const created = await recordBreach(world.ctx, client.id, {
      title: 'Payroll file emailed outside',
      description: 'A payroll export was emailed to a personal address.',
      awareAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
      severity: 'medium',
      natures: 'accidental_disclosure',
      affectedPrincipals: '120',
      recordsAffected: '360',
    })
    await recordRightsRequest(world.ctx, client.id, {
      kind: 'erasure',
      receivedOn: new Date().toISOString().slice(0, 10),
      requesterRef: 'TKT-9',
      requesterRole: 'self',
      letterRef: 'L-05',
    })
    const file = await buildRegistersWorkbook(world.ctx, client.id)
    const book = new ExcelJS.Workbook()
    await book.xlsx.load(
      file.content.buffer.slice(
        file.content.byteOffset,
        file.content.byteOffset + file.content.byteLength,
      ),
    )
    expect(book.worksheets.map((sheet) => sheet.name)).toEqual(Object.values(REGISTER_SHEETS))
    // Oracle: every sheet's first row is its CSV's header, column for column.
    for (const [csv, name] of Object.entries(REGISTER_SHEETS)) {
      const row = (book.getWorksheet(name)?.getRow(1).values as unknown[]).slice(1).map(String)
      expect(row, name).toEqual(header(csv))
    }
    const cell = (sheet: string, column: string, line = 2) => {
      const ws = book.getWorksheet(sheet)
      const index = (ws?.getRow(1).values as unknown[]).indexOf(column)
      return ws?.getRow(line).getCell(index).text ?? ''
    }
    expect([
      cell('Breach register', 'Breach ID'),
      cell('Breach register', 'No. of DPs'),
      cell('Breach register', 'No. of records'),
    ]).toEqual([created.code, '120', '360'])
    expect([cell('Vendor register', 'Vendor'), cell('Vendor register', 'Service')]).toEqual([
      'PayFast',
      'Payroll',
    ])
    expect([
      cell('Rights-request log', 'Ticket no.'),
      cell('Rights-request log', 'Letter template (L-xx)'),
    ]).toEqual(['TKT-9', 'L-05'])
    expect(book.getWorksheet('Cookie register')?.rowCount).toBe(1)
  })
})
