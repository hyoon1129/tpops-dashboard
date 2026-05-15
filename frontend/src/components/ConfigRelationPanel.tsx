import { useCallback, useEffect, useMemo, useState } from 'react'
import { sectionDefinitions } from '../constants/dashboard'
import { getTooltip } from '../constants/tooltips'
import type { SectionDefinition, SectionKey, SectionState, TableRow, TableValue } from '../types/config'
import { exportItemToExcel } from '../utils/exportExcel'

export type ConfigRelationSelection = {
  row: TableRow
  section: SectionKey
}

type RelationItem = {
  row: TableRow
  section: SectionKey
}

type RelationGroup = {
  items: RelationItem[]
  section: SectionKey
}

type ConfigRelationPanelProps = {
  onClose: () => void
  onSelectRelated: (item: RelationItem) => void
  open: boolean
  sections: Record<SectionKey, SectionState>
  selection: ConfigRelationSelection | null
}

type RelationPanelTab = 'details' | 'responseTime'

type ServiceResponseMetric = {
  avgResponseTimeMs: number | null
  avgResponseTimeSec: number | null
  businessName: string | null
  documentCount: number
  serverName: string | null
  serviceName: string
}

type ResponseTimeRange = '1시간' | '1일' | '1주' | '직접'

const responseTimeRanges: ResponseTimeRange[] = ['1시간', '1일', '1주', '직접']

const definitionBySection = (section: SectionKey): SectionDefinition =>
  sectionDefinitions.find((definition) => definition.label === section) ?? sectionDefinitions[0]

const displayValue = (value: TableValue) => (value === null || value === undefined || value === '' ? '-' : String(value))

const rowName = (row?: TableRow | null) => String(row?.NAME ?? '-')

const formatNumber = (value: number | null, maximumFractionDigits = 1) =>
  value === null
    ? '-'
    : value.toLocaleString('ko-KR', { maximumFractionDigits, minimumFractionDigits: 0 })

const pad = (value: number) => String(value).padStart(2, '0')

const rangeToMilliseconds = (range: ResponseTimeRange) => {
  if (range === '1시간') {
    return 60 * 60 * 1000
  }
  if (range === '1주') {
    return 7 * 24 * 60 * 60 * 1000
  }
  return 24 * 60 * 60 * 1000
}

function toDatetimeLocal(date: Date) {
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

function customRangeFromNow() {
  const to = new Date()
  const from = new Date(to.getTime() - rangeToMilliseconds('1일'))
  return {
    from: toDatetimeLocal(from),
    to: toDatetimeLocal(to),
  }
}

const byName = (rows: TableRow[], name: TableValue) =>
  rows.find((row) => rowName(row) === String(name ?? '')) ?? null

const compact = (items: Array<RelationItem | null | undefined>) =>
  items.filter((item): item is RelationItem => Boolean(item))

function childGroup(section: SectionKey, items: TableRow[]): RelationGroup | null {
  return items.length > 0 ? { section, items: items.map((row) => ({ section, row })) } : null
}

function buildRelationContext(selection: ConfigRelationSelection, sections: Record<SectionKey, SectionState>) {
  const domains = sections.DOMAIN.rows
  const nodes = sections.NODE.rows
  const groups = sections.SVRGROUP.rows
  const servers = sections.SERVER.rows
  const services = sections.SERVICE.rows
  const gateways = sections.GATEWAY.rows
  const domain = domains[0] ?? null
  const { row, section } = selection

  const nodeFor = (name: TableValue) => byName(nodes, name)
  const groupFor = (name: TableValue) => byName(groups, name)
  const serverFor = (name: TableValue) => byName(servers, name)

  const selectedServer = section === 'SERVICE' ? serverFor(row.svrname) : section === 'SERVER' ? row : null
  const selectedGroup = section === 'SVRGROUP'
    ? row
    : selectedServer
    ? groupFor(selectedServer.svgname)
    : null
  const selectedNode = section === 'NODE'
    ? row
    : section === 'GATEWAY'
    ? nodeFor(row.nodename)
    : selectedGroup
    ? nodeFor(selectedGroup.nodename)
    : null

  const path = compact([
    domain ? { section: 'DOMAIN', row: domain } : null,
    selectedNode ? { section: 'NODE', row: selectedNode } : null,
    selectedGroup ? { section: 'SVRGROUP', row: selectedGroup } : null,
    selectedServer ? { section: 'SERVER', row: selectedServer } : null,
    section === 'SERVICE' ? { section: 'SERVICE', row } : null,
    section === 'GATEWAY' ? { section: 'GATEWAY', row } : null,
  ])

  let childGroups: Array<RelationGroup | null> = []
  if (section === 'DOMAIN') {
    childGroups = [childGroup('NODE', nodes)]
  } else if (section === 'NODE') {
    const currentName = rowName(row)
    childGroups = [
      childGroup('SVRGROUP', groups.filter((child) => String(child.nodename ?? '') === currentName)),
      childGroup('GATEWAY', gateways.filter((child) => String(child.nodename ?? '') === currentName)),
    ]
  } else if (section === 'SVRGROUP') {
    const currentName = rowName(row)
    childGroups = [childGroup('SERVER', servers.filter((child) => String(child.svgname ?? '') === currentName))]
  } else if (section === 'SERVER') {
    const currentName = rowName(row)
    childGroups = [childGroup('SERVICE', services.filter((child) => String(child.svrname ?? '') === currentName))]
  }

  return {
    childGroups: childGroups.filter((group): group is RelationGroup => Boolean(group)),
    path,
  }
}

function PathSection({
  childGroups,
  current,
  onSelectRelated,
  path,
}: {
  childGroups: RelationGroup[]
  current: ConfigRelationSelection
  onSelectRelated: (item: RelationItem) => void
  path: RelationItem[]
}) {
  const [childrenOpen, setChildrenOpen] = useState(false)
  const totalChildren = childGroups.reduce((count, group) => count + group.items.length, 0)

  return (
    <section className="config-relation-section">
      <div className="config-relation-section-header">
        <h4>연결 경로</h4>
      </div>
      <div className="config-relation-path">
        {path.map((item) => {
          const active = item.section === current.section && item.row === current.row
          return (
            <div className="config-relation-path-step" key={`${item.section}:${rowName(item.row)}`}>
              <button
                type="button"
                className={active ? 'active' : ''}
                onClick={() => {
                  if (active) {
                    setChildrenOpen((currentOpen) => !currentOpen)
                    return
                  }
                  onSelectRelated(item)
                }}
              >
                <span className={`inspector-section-badge section-${item.section.toLowerCase()}`}>
                  {item.section}
                </span>
                <strong>{rowName(item.row)}</strong>
                {active && totalChildren > 0 ? <em>{totalChildren}</em> : null}
              </button>
              {active && childrenOpen && totalChildren > 0 ? (
                <ChildGroups
                  groups={childGroups}
                  onSelectRelated={onSelectRelated}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ChildGroups({
  groups,
  onSelectRelated,
}: {
  groups: RelationGroup[]
  onSelectRelated: (item: RelationItem) => void
}) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)

  return (
    <div className="config-relation-groups">
      {groups.map((group) => (
        <div className="config-relation-group" key={group.section}>
          <button
            type="button"
            className="config-relation-group-title"
            onClick={() => setOpenSection((current) => current === group.section ? null : group.section)}
          >
            <span className={`inspector-section-badge section-${group.section.toLowerCase()}`}>
              {group.section}
            </span>
            <strong>{group.items.length}</strong>
          </button>
          {openSection === group.section ? (
            <div className="config-relation-links">
              {group.items.map((item) => (
                <button
                  type="button"
                  key={`${item.section}:${rowName(item.row)}`}
                  onClick={() => onSelectRelated(item)}
                >
                  <strong>{rowName(item.row)}</strong>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function ServiceResponseTimeTab({ fileId, serviceName }: { fileId: number | null; serviceName: string }) {
  const [range, setRange] = useState<ResponseTimeRange>('1일')
  const [customRange] = useState(customRangeFromNow)
  const [customFrom, setCustomFrom] = useState(customRange.from)
  const [customTo, setCustomTo] = useState(customRange.to)
  const [customApplied, setCustomApplied] = useState(false)
  const [metric, setMetric] = useState<ServiceResponseMetric | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetric = useCallback(async (from: Date, to: Date, signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      })
      if (fileId !== null) {
        params.set('fileId', String(fileId))
      }
      const response = await fetch(
        `/api/dashboard/services/${encodeURIComponent(serviceName)}/response-time?${params.toString()}`,
        { signal },
      )
      if (!response.ok) {
        throw new Error(await response.text())
      }
      setMetric((await response.json()) as ServiceResponseMetric)
    } catch (caught) {
      if (!signal?.aborted) {
        setMetric(null)
        setError(caught instanceof Error ? caught.message : '응답시간을 불러오지 못했습니다.')
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }, [fileId, serviceName])

  useEffect(() => {
    if (range === '직접') {
      return
    }
    const controller = new AbortController()
    const to = new Date()
    const from = new Date(to.getTime() - rangeToMilliseconds(range))
    const timer = window.setTimeout(() => {
      fetchMetric(from, to, controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [fetchMetric, range])

  const applyCustomRange = () => {
    const from = new Date(customFrom)
    const to = new Date(customTo)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      setError('조회 기간 형식이 올바르지 않습니다.')
      return
    }
    if (from >= to) {
      setError('시작 시간은 종료 시간보다 이전이어야 합니다.')
      return
    }
    setCustomApplied(true)
    fetchMetric(from, to)
  }
  const appliedLabel = range === '직접'
    ? customApplied ? '직접 선택' : '기간 선택'
    : `최근 ${range}`

  return (
    <section className="config-relation-section">
      <div className="config-relation-section-header">
        <h4>서비스 응답시간 요약</h4>
        <span>{appliedLabel}</span>
      </div>

      <div className="service-response-ranges" aria-label="응답시간 조회 기간">
        {responseTimeRanges.map((item) => (
          <button
            key={item}
            type="button"
            className={range === item ? 'active' : ''}
            onClick={() => {
              setRange(item)
              setError(null)
              if (item !== '직접') {
                setCustomApplied(false)
              }
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {range === '직접' ? (
        <div className="service-response-custom-range">
          <label>
            <span>시작</span>
            <input
              type="datetime-local"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
          </label>
          <label>
            <span>종료</span>
            <input
              type="datetime-local"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </label>
          <button type="button" onClick={applyCustomRange} disabled={loading}>
            조회
          </button>
        </div>
      ) : null}

      {loading ? <div className="config-relation-empty">응답시간을 조회하는 중입니다.</div> : null}
      {error ? <div className="config-relation-error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="service-response-summary">
            <div>
              <span>평균 응답시간</span>
              <strong>{formatNumber(metric?.avgResponseTimeMs ?? null)} ms</strong>
            </div>
            <div>
              <span>로그 수</span>
              <strong>{metric ? metric.documentCount.toLocaleString('ko-KR') : '-'}건</strong>
            </div>
            <div>
              <span>SERVER</span>
              <strong>{metric?.serverName ?? '-'}</strong>
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}

export function ConfigRelationPanel({
  onClose,
  onSelectRelated,
  open,
  sections,
  selection,
}: ConfigRelationPanelProps) {
  const [tabState, setTabState] = useState<{ activeTab: RelationPanelTab; selectionKey: string }>({
    activeTab: 'details',
    selectionKey: '',
  })
  const context = useMemo(() => {
    if (!selection) {
      return null
    }
    return buildRelationContext(selection, sections)
  }, [sections, selection])

  if (!selection || !context) {
    return null
  }

  const definition = definitionBySection(selection.section)
  const selectionKey = `${selection.section}:${rowName(selection.row)}`
  const activeTab = tabState.selectionKey === selectionKey ? tabState.activeTab : 'details'
  const showTabs = selection.section === 'SERVICE'
  const tabs: Array<{ key: RelationPanelTab; label: string }> = [
    { key: 'details', label: '기본 정보' },
    { key: 'responseTime', label: '응답시간' },
  ]
  const selectedFileId = typeof selection.row.fileId === 'number' ? selection.row.fileId : null

  return (
    <aside className={open ? 'config-relation-panel open' : 'config-relation-panel'} role="dialog" aria-label="설정 관계 상세">
      <div className="config-relation-header">
        <div>
          <span className={`inspector-section-badge section-${selection.section.toLowerCase()}`}>
            {selection.section}
          </span>
          <h3>{rowName(selection.row)}</h3>
        </div>
        <div className="config-relation-header-actions">
          <button
            type="button"
            className="export-btn"
            aria-label="엑셀로 내보내기"
            onClick={() =>
              exportItemToExcel(
                selection.section,
                selection.row,
                context.childGroups.map((group) => ({ section: group.section, items: group.items })),
              )
            }
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 13V3M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 15h14v2H3v-2z" fill="currentColor" />
            </svg>
            내보내기
          </button>
          <button type="button" aria-label="닫기" onClick={onClose}>
            x
          </button>
        </div>
      </div>

      {showTabs ? (
        <div className="config-relation-tabs" role="tablist" aria-label="설정 상세 탭">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setTabState({ activeTab: tab.key, selectionKey })}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="config-relation-body">
        {activeTab === 'details' ? (
          <>
            <PathSection
              childGroups={context.childGroups}
              current={selection}
              onSelectRelated={onSelectRelated}
              path={context.path}
            />

            <section className="config-relation-section">
              <div className="config-relation-section-header">
                <h4>설정값</h4>
              </div>
              <dl className="relationship-config-list">
                {definition.columns.map((column) => (
                  <div key={column.key}>
                    <dt data-tooltip={getTooltip(selection.section, column.key) || undefined}>
                      {column.label}
                    </dt>
                    <dd>{displayValue(selection.row[column.key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        ) : null}

        {activeTab === 'responseTime' && selection.section === 'SERVICE' ? (
          <ServiceResponseTimeTab fileId={selectedFileId} serviceName={rowName(selection.row)} />
        ) : null}
      </div>
    </aside>
  )
}
