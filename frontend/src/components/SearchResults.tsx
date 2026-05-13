import { collapsedSearchLimit } from '../constants/dashboard'
import { highlightedText } from '../utils/highlight'
import type { SectionDefinition, SectionKey, TableRow } from '../types/config'

type SearchResultGroup = {
  section: SectionDefinition
  rows: TableRow[]
}

type SearchResultsProps = {
  expandedSections: Set<SectionKey>
  groups: SearchResultGroup[]
  keyword: string
  resultCount: number
  searchLoading: boolean
  onNameClick: (section: SectionKey, row: TableRow) => void
  onToggleSection: (section: SectionKey) => void
}

const BADGE_COLOR_COUNT = 6

function badgeColorIndex(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash % BADGE_COLOR_COUNT
}

export function SearchResults({
  expandedSections,
  groups,
  keyword,
  resultCount,
  searchLoading,
  onNameClick,
  onToggleSection,
}: SearchResultsProps) {
  return (
    <div className="search-results">
      {groups.map(({ section, rows }) => {
        const expanded = expandedSections.has(section.label)
        const visibleRows = expanded ? rows : rows.slice(0, collapsedSearchLimit)
        const hiddenCount = rows.length - visibleRows.length

        return (
          <section className={`search-section search-section-${section.label.toLowerCase()}`} key={section.label}>
            <div className="search-section-header">
              <div>
                <span className="search-section-name">{section.label}</span>
                <p>검색 결과 {rows.length}건</p>
              </div>
              {rows.length > collapsedSearchLimit ? (
                <button type="button" onClick={() => onToggleSection(section.label)}>
                  {expanded ? '접기' : `${hiddenCount}건 더 보기`}
                </button>
              ) : null}
            </div>
            <div className="search-table-scroll">
              <table>
                <thead>
                  <tr>
                    {section.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIndex) => (
                    <tr key={`${String(row[section.columns[0].key])}-${rowIndex}`}>
                      {section.columns.map((column, columnIndex) => (
                        <td key={column.key}>
                          {column.badge
                            ? row[column.key]
                              ? <span className="db-badge" data-color={badgeColorIndex(String(row[column.key]))}>{String(row[column.key])}</span>
                              : <span className="cell-null">-</span>
                            : row[column.key] == null || row[column.key] === ''
                            ? <span className="cell-null">-</span>
                            : columnIndex === 0
                            ? (
                                <button
                                  type="button"
                                  className="name-cell-button"
                                  onClick={() => onNameClick(section.label, row)}
                                >
                                  <strong>{highlightedText(row[column.key], keyword)}</strong>
                                </button>
                              )
                            : highlightedText(row[column.key], keyword)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
      {!searchLoading && resultCount === 0 ? <div className="empty-state">검색 결과가 없습니다.</div> : null}
    </div>
  )
}
