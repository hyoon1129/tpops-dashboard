import * as XLSX from 'xlsx'
import { sectionDefinitions } from '../constants/dashboard'
import type { SectionKey, SectionState, TableRow } from '../types/config'

function getDefinition(section: SectionKey) {
  return sectionDefinitions.find((d) => d.label === section) ?? sectionDefinitions[0]
}

function uniqueName(used: Set<string>, raw: string): string {
  const base = raw.replace(/[[\]:*?/\\]/g, '_').slice(0, 31)
  if (!used.has(base)) { used.add(base); return base }
  let i = 2
  let candidate = `${base}_${i}`.slice(0, 31)
  while (used.has(candidate)) { i++; candidate = `${base}_${i}`.slice(0, 31) }
  used.add(candidate)
  return candidate
}

function timestamp() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '_',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join('')
}

function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v)
}

function autoColWidths(aoa: string[][]): XLSX.ColInfo[] {
  const widths: number[] = []
  for (const row of aoa) {
    row.forEach((cell, c) => {
      widths[c] = Math.max(widths[c] ?? 0, cell.length)
    })
  }
  return widths.map((w) => ({ wch: Math.min(Math.max(w + 2, 8), 60) }))
}

function buildSheet(
  section: SectionKey,
  row: TableRow,
  childGroups: ExportChildGroup[],
): XLSX.WorkSheet {
  const def = getDefinition(section)
  const aoa: string[][] = [
    ['[ 설정값 ]', ''],
    ['항목', '값'],
    ...def.columns.map((col) => [col.label, str(row[col.key])]),
  ]

  if (childGroups.length > 0) {
    aoa.push(['', ''])
    aoa.push(['[ 하위 항목 ]', ''])
    for (const group of childGroups) {
      aoa.push([group.section, `${group.items.length}개`])
      for (const { row: childRow } of group.items) {
        aoa.push(['', str(childRow.NAME)])
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = autoColWidths(aoa)
  return ws
}

function getChildGroups(
  section: SectionKey,
  row: TableRow,
  sections: Record<SectionKey, SectionState>,
): ExportChildGroup[] {
  const name = String(row.NAME ?? '')
  if (section === 'DOMAIN') {
    return [{ section: 'NODE' as SectionKey, items: sections.NODE.rows.map((r) => ({ row: r })) }]
  }
  if (section === 'NODE') {
    return ([
      { section: 'SVRGROUP' as SectionKey, items: sections.SVRGROUP.rows.filter((r) => String(r.nodename ?? '') === name).map((r) => ({ row: r })) },
      { section: 'GATEWAY'  as SectionKey, items: sections.GATEWAY.rows.filter((r) => String(r.nodename ?? '') === name).map((r) => ({ row: r })) },
    ] as ExportChildGroup[]).filter((g) => g.items.length > 0)
  }
  if (section === 'SVRGROUP') {
    return [{ section: 'SERVER'  as SectionKey, items: sections.SERVER.rows.filter((r) => String(r.svgname ?? '') === name).map((r) => ({ row: r })) }]
  }
  if (section === 'SERVER') {
    return [{ section: 'SERVICE' as SectionKey, items: sections.SERVICE.rows.filter((r) => String(r.svrname ?? '') === name).map((r) => ({ row: r })) }]
  }
  return []
}

export type ExportChildGroup = {
  section: SectionKey
  items: Array<{ row: TableRow }>
}

export function exportItemToExcel(
  section: SectionKey,
  row: TableRow,
  childGroups: ExportChildGroup[],
) {
  const wb = XLSX.utils.book_new()
  const itemName = String(row.NAME ?? section).replace(/[[\]:*?/\\]/g, '_').slice(0, 31)
  XLSX.utils.book_append_sheet(wb, buildSheet(section, row, childGroups), itemName)
  XLSX.writeFile(wb, `${section}_${itemName}_${timestamp()}.xlsx`)
}

export function exportSectionToExcel(
  section: SectionKey,
  rows: TableRow[],
  sections: Record<SectionKey, SectionState>,
) {
  const wb = XLSX.utils.book_new()
  const used = new Set<string>()

  for (const row of rows) {
    const sheetName = uniqueName(used, String(row.NAME ?? '항목'))
    XLSX.utils.book_append_sheet(wb, buildSheet(section, row, getChildGroups(section, row, sections)), sheetName)
  }

  if (wb.SheetNames.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['데이터 없음']]), section)
  }

  XLSX.writeFile(wb, `${section}_${timestamp()}.xlsx`)
}
