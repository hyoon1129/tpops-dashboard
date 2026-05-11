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
  onToggleSection: (section: SectionKey) => void
}

export function SearchResults({
  expandedSections,
  groups,
  keyword,
  resultCount,
  searchLoading,
  onToggleSection,
}: SearchResultsProps) {
  return (
    <div className="search-results">
      {groups.map(({ section, rows }) => {
        const expanded = expandedSections.has(section.label)
        const visibleRows = expanded ? rows : rows.slice(0, collapsedSearchLimit)
        const hiddenCount = rows.length - visibleRows.length

        return (
          <section className="search-section" key={section.label}>
            <div className="search-section-header">
              <div>
                <h3>{section.title}</h3>
                <p>{section.label} 섹션 · {rows.length}건</p>
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
                          {columnIndex === 0
                            ? <strong>{highlightedText(row[column.key], keyword)}</strong>
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
