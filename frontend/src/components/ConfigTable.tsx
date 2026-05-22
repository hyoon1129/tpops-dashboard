import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PAGE_SIZE } from '../constants/dashboard'
import { highlightedText } from '../utils/highlight'
import { getTooltip } from '../constants/tooltips'
import type { Column, SectionDefinition, SectionKey, SectionState, SortState, TableRow } from '../types/config'

type ConfigTableProps = {
  currentDefinition: SectionDefinition
  currentState: SectionState
  filteredRows: TableRow[]
  onLoadMore: () => void
  onNameClick: (row: TableRow) => void
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

type HeaderCellProps = {
  column: Column
  onSort: (column: Column) => void
  selectedSection: SectionKey
  sortState: SortState | null
}

function HeaderCell({ column, onSort, selectedSection, sortState }: HeaderCellProps) {
  const tooltip = getTooltip(selectedSection, column.key)

  if (column.sortable === false) {
    return (
      <span className="sort-button" data-tooltip={tooltip || undefined}>
        {column.label}
      </span>
    )
  }

  return (
    <button
      type="button"
      className="sort-button"
      data-tooltip={tooltip || undefined}
      onClick={() => onSort(column)}
    >
      <span>{column.label}</span>
      <span aria-hidden="true" className="sort-mark">
        {sortState?.section === selectedSection && sortState.key === column.sortKey
          ? sortState.direction === 'asc' ? '↑' : '↓'
          : '↕'}
      </span>
    </button>
  )
}

export const ConfigTable = memo(function ConfigTable({
  currentDefinition,
  currentState,
  filteredRows,
  onLoadMore,
  onNameClick,
  onSort,
  sectionKeyword,
  selectedSection,
  sortState,
}: ConfigTableProps) {
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [tableWidth, setTableWidth] = useState(0)
  const [columnWidths, setColumnWidths] = useState<number[]>([])

  const measureColumns = useCallback(() => {
    const table = tableRef.current
    if (!table) return

    const firstRowCells = Array.from(table.querySelectorAll<HTMLTableCellElement>('tbody tr:first-child td'))
    const nextColumnWidths = firstRowCells.map((cell) => cell.getBoundingClientRect().width)
    setColumnWidths(nextColumnWidths)
    setTableWidth(table.getBoundingClientRect().width)
  }, [])

  useLayoutEffect(() => {
    measureColumns()

    const resizeObserver = new ResizeObserver(measureColumns)
    if (tableRef.current) resizeObserver.observe(tableRef.current)
    window.addEventListener('resize', measureColumns)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measureColumns)
    }
  }, [currentDefinition.columns, filteredRows, measureColumns])

  // Keep onLoadMore in a ref so the observer never needs to reconnect when the callback changes
  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => { onLoadMoreRef.current = onLoadMore }, [onLoadMore])

  // Ref to guard against duplicate calls before React state update is committed
  const isLoadingRef = useRef(false)
  useEffect(() => { isLoadingRef.current = currentState.loading }, [currentState.loading])

  // IntersectionObserver on sentinel div — fires onLoadMore when scrolled near bottom.
  // root: null = viewport (table-scroll is overflow-y: clip, not a scroll container)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || currentState.last) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingRef.current) {
          isLoadingRef.current = true // lock synchronously before async state update
          onLoadMoreRef.current()
        }
      },
      { root: null, rootMargin: '0px 0px 300px 0px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [currentState.last]) // deps: only last — callback is stable via ref

  return (
    <div className={`table-shell table-section-${selectedSection.toLowerCase()}`}>
      <div className="sticky-table-header">
        {currentDefinition.columns[0] ? (
          <div
            className="sticky-table-header-pinned"
            style={{ width: columnWidths[0] || undefined }}
          >
            <HeaderCell
              column={currentDefinition.columns[0]}
              onSort={onSort}
              selectedSection={selectedSection}
              sortState={sortState}
            />
          </div>
        ) : null}
        <div
          className="sticky-table-header-scroll"
          style={{ marginLeft: columnWidths[0] || undefined }}
        >
          <div
            className="sticky-table-header-inner"
            style={{
              gridTemplateColumns: columnWidths.length === currentDefinition.columns.length
                ? columnWidths.slice(1).map((width) => `${width}px`).join(' ')
                : `repeat(${currentDefinition.columns.length - 1}, 1fr)`,
              transform: `translateX(${-scrollLeft}px)`,
              width: tableWidth && columnWidths[0] ? tableWidth - columnWidths[0] : undefined,
            }}
          >
            {currentDefinition.columns.slice(1).map((column) => (
              <div className="sticky-table-header-cell" key={column.key}>
                <HeaderCell
                  column={column}
                  onSort={onSort}
                  selectedSection={selectedSection}
                  sortState={sortState}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="table-scroll"
        ref={tableScrollRef}
        onScroll={(event) => {
          setScrollLeft(event.currentTarget.scrollLeft)
        }}
      >
        <table ref={tableRef}>
          <thead>
            <tr>
              {currentDefinition.columns.map((column) => (
                <th key={column.key}>
                  <span className="native-header-label">
                    {column.label}
                  </span>
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
                      ? (
                          <button
                            type="button"
                            className="name-cell-button"
                            onClick={() => onNameClick(row)}
                          >
                            <strong>{highlightedText(row[column.key], sectionKeyword)}</strong>
                          </button>
                        )
                      : highlightedText(row[column.key], sectionKeyword)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sentinel div — IntersectionObserver target for infinite scroll */}
        <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />

        {currentState.loading ? (
          <div className="empty-state infinite-scroll-loading">
            <span className="loading-spinner" />
            불러오는 중...
          </div>
        ) : null}
        {!currentState.loading && filteredRows.length === 0 ? (
          <div className="empty-state">표시할 데이터가 없습니다.</div>
        ) : null}
        {!currentState.loading && currentState.last && currentState.total > PAGE_SIZE ? (
          <div className="scroll-end-marker">
            총 {currentState.total.toLocaleString()}건
          </div>
        ) : null}
      </div>
    </div>
  )
})

