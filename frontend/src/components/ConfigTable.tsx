import { highlightedText } from '../utils/highlight'
import type { Column, SectionDefinition, SectionKey, SectionState, SortState, TableRow } from '../types/config'

type ConfigTableProps = {
  currentDefinition: SectionDefinition
  currentState: SectionState
  filteredRows: TableRow[]
  onLoadNextPage: () => void
  onSort: (column: Column) => void
  sectionKeyword: string
  selectedSection: SectionKey
  sortState: SortState | null
}

const BADGE_COLOR_COUNT = 6

function badgeColorIndex(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  return hash % BADGE_COLOR_COUNT
}

export function ConfigTable({
  currentDefinition,
  currentState,
  filteredRows,
  onLoadNextPage,
  onSort,
  sectionKeyword,
  selectedSection,
  sortState,
}: ConfigTableProps) {
  return (
    <div
      className="table-scroll"
      onScroll={(event) => {
        const target = event.currentTarget
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 80) {
          onLoadNextPage()
        }
      }}
    >
      <table>
        <thead>
          <tr>
            {currentDefinition.columns.map((column) => (
              <th key={column.key}>
                {column.sortable === false ? (
                  <span className="sort-button">{column.label}</span>
                ) : (
                  <button
                    type="button"
                    className="sort-button"
                    onClick={() => onSort(column)}
                  >
                    <span>{column.label}</span>
                    <span aria-hidden="true" className="sort-mark">
                      {sortState?.section === selectedSection && sortState.key === column.sortKey
                        ? sortState.direction === 'asc' ? '↑' : '↓'
                        : '↕'}
                    </span>
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, rowIndex) => (
            <tr key={`${String(row[currentDefinition.columns[0].key])}-${rowIndex}`}>
              {currentDefinition.columns.map((column, columnIndex) => (
                <td key={column.key}>
                  {column.badge
                    ? row[column.key]
                      ? <span className="db-badge" data-color={badgeColorIndex(String(row[column.key]))}>{String(row[column.key])}</span>
                      : <span className="cell-null">-</span>
                    : row[column.key] == null || row[column.key] === ''
                    ? <span className="cell-null">-</span>
                    : columnIndex === 0
                    ? <strong>{highlightedText(row[column.key], sectionKeyword)}</strong>
                    : highlightedText(row[column.key], sectionKeyword)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {currentState.loading ? <div className="empty-state">다음 데이터를 불러오는 중입니다.</div> : null}
      {!currentState.loading && filteredRows.length === 0 ? <div className="empty-state">표시할 데이터가 없습니다.</div> : null}
      {!currentState.loading && currentState.last && currentState.rows.length > 0 ? (
        <div className="empty-state">마지막 데이터입니다.</div>
      ) : null}
    </div>
  )
}
