import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { sectionDefinitions } from '../constants/dashboard'
import type {
  RelationshipDomain,
  RelationshipGroup,
  RelationshipNode,
  RelationshipServer,
  SectionDefinition,
  SectionKey,
  TableRow,
} from '../types/config'

type RelationshipSelection = {
  section: SectionDefinition
  row: TableRow
  path: string[]
}

type SearchHit = {
  label: string
  section: SectionKey
  path: string[]
  domainKey: string
  nodeKey: string | null
  groupKey: string | null
  serverKey: string | null
}

type RelationshipMapProps = {
  loading: boolean
  tree: RelationshipDomain[]
}

const SECTION_ORDER: Record<SectionKey, number> = {
  DOMAIN: 0,
  NODE: 1,
  SVRGROUP: 2,
  SERVER: 3,
  SERVICE: 4,
  GATEWAY: 5,
}

const definitionBySection = (section: SectionKey) =>
  sectionDefinitions.find((definition) => definition.label === section) ?? sectionDefinitions[0]

const displayValue = (value: unknown) => (value === null || value === undefined ? '-' : String(value))

const rowName = (row?: TableRow) => String(row?.NAME ?? '-')

const itemKey = (section: SectionKey, row?: TableRow) => `${section}:${rowName(row)}`

export function RelationshipMap({ loading, tree }: RelationshipMapProps) {
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null)
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [selectedServerKey, setSelectedServerKey] = useState<string | null>(null)
  const [inspectorData, setInspectorData] = useState<RelationshipSelection | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const inspectorRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [jumpId, setJumpId] = useState(0)

  const activeDomainKey = tree.some((d) => itemKey('DOMAIN', d.domain) === selectedDomainKey)
    ? selectedDomainKey
    : null
  const selectedDomain = tree.find((d) => itemKey('DOMAIN', d.domain) === activeDomainKey) ?? null
  const selectedNode =
    selectedDomain?.nodes.find((n) => itemKey('NODE', n.node) === selectedNodeKey) ?? null
  const selectedGroup =
    selectedNode?.svrgroups.find((g) => itemKey('SVRGROUP', g.svrgroup) === selectedGroupKey) ?? null
  const selectedServer =
    selectedGroup?.servers.find((s) => itemKey('SERVER', s.server) === selectedServerKey) ?? null

  const domains = useMemo(() => tree, [tree])
  const nodes = selectedDomain?.nodes ?? []
  const groups = selectedNode?.svrgroups ?? []
  const servers = selectedGroup?.servers ?? []
  const services = selectedServer?.services ?? []

  // 검색 인덱스: 섹션 계층 순 → 이름 가나다 순 정렬
  const searchHits = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const hits: SearchHit[] = []

    for (const domainEntry of tree) {
      const domainKey = itemKey('DOMAIN', domainEntry.domain)
      const domainName = rowName(domainEntry.domain)

      if (domainName.toLowerCase().includes(q)) {
        hits.push({ label: domainName, section: 'DOMAIN', path: [domainName], domainKey, nodeKey: null, groupKey: null, serverKey: null })
      }

      for (const nodeEntry of domainEntry.nodes) {
        const nodeKey = itemKey('NODE', nodeEntry.node)
        const nodeName = rowName(nodeEntry.node)

        if (nodeName.toLowerCase().includes(q)) {
          hits.push({ label: nodeName, section: 'NODE', path: [domainName, nodeName], domainKey, nodeKey, groupKey: null, serverKey: null })
        }

        for (const groupEntry of nodeEntry.svrgroups) {
          const groupKey = itemKey('SVRGROUP', groupEntry.svrgroup)
          const groupName = rowName(groupEntry.svrgroup)

          if (groupName.toLowerCase().includes(q)) {
            hits.push({ label: groupName, section: 'SVRGROUP', path: [domainName, nodeName, groupName], domainKey, nodeKey, groupKey, serverKey: null })
          }

          for (const serverEntry of groupEntry.servers) {
            const serverKey = itemKey('SERVER', serverEntry.server)
            const serverName = rowName(serverEntry.server)

            if (serverName.toLowerCase().includes(q)) {
              hits.push({ label: serverName, section: 'SERVER', path: [domainName, nodeName, groupName, serverName], domainKey, nodeKey, groupKey, serverKey })
            }

            for (const service of serverEntry.services) {
              const serviceName = rowName(service)
              if (serviceName.toLowerCase().includes(q)) {
                hits.push({ label: serviceName, section: 'SERVICE', path: [domainName, nodeName, groupName, serverName, serviceName], domainKey, nodeKey, groupKey, serverKey })
              }
            }
          }
        }
      }
    }

    return hits.sort((a, b) => {
      const orderDiff = SECTION_ORDER[a.section] - SECTION_ORDER[b.section]
      if (orderDiff !== 0) return orderDiff
      return a.label.localeCompare(b.label)
    })
  }, [searchQuery, tree])

  const closeInspector = () => {
    setInspectorOpen(false)
    closeTimerRef.current = setTimeout(() => setInspectorData(null), 260)
  }

  useEffect(() => {
    if (!inspectorOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (inspectorRef.current && !inspectorRef.current.contains(e.target as Node)) {
        closeInspector()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [inspectorOpen])

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current) }, [])

  const jumpToHit = (hit: SearchHit) => {
    setSelectedDomainKey(hit.domainKey)
    setSelectedNodeKey(hit.nodeKey)
    setSelectedGroupKey(hit.groupKey)
    setSelectedServerKey(hit.serverKey)
    setSearchQuery('')
    setSearchFocused(false)
    setJumpId((n) => n + 1)
  }

  if (loading) {
    return <div className="empty-state">구성 관계를 불러오는 중입니다.</div>
  }

  if (tree.length === 0) {
    return <div className="empty-state">표시할 구성 관계가 없습니다.</div>
  }

  // 클릭 = 탐색 전용
  const selectDomain = (domain: RelationshipDomain) => {
    const key = itemKey('DOMAIN', domain.domain)
    setSelectedDomainKey(key === activeDomainKey ? null : key)
    setSelectedNodeKey(null)
    setSelectedGroupKey(null)
    setSelectedServerKey(null)
  }

  const selectNode = (node: RelationshipNode) => {
    const key = itemKey('NODE', node.node)
    setSelectedNodeKey(key === selectedNodeKey ? null : key)
    setSelectedGroupKey(null)
    setSelectedServerKey(null)
  }

  const selectGroup = (group: RelationshipGroup) => {
    const key = itemKey('SVRGROUP', group.svrgroup)
    setSelectedGroupKey(key === selectedGroupKey ? null : key)
    setSelectedServerKey(null)
  }

  const selectServer = (server: RelationshipServer) => {
    const key = itemKey('SERVER', server.server)
    setSelectedServerKey(key === selectedServerKey ? null : key)
  }

  // ⓘ 버튼 = inspector 오픈 (토글)
  const openInspector = (section: SectionKey, row: TableRow, path: string[]) => {
    const isSame = inspectorData?.section.label === section && inspectorData?.row === row && inspectorOpen
    if (isSame) { closeInspector(); return }
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setInspectorData({ section: definitionBySection(section), row, path })
    setInspectorOpen(true)
  }

  const inspectedKey = inspectorOpen && inspectorData
    ? itemKey(inspectorData.section.label, inspectorData.row)
    : null

  const showSearchDropdown = searchFocused && searchQuery.trim().length > 0

  return (
    <div className="relationship-map">
      {/* 검색 바 */}
      <div className="map-search-bar">
        <input
          className="map-search-input"
          type="text"
          placeholder="SERVER, SERVICE, SVG, NODE 이름으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
        />
        {showSearchDropdown && (
          <div className="map-search-dropdown">
            {searchHits.length === 0 ? (
              <div className="map-search-empty">결과 없음</div>
            ) : (
              searchHits.map((hit, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="map-search-hit"
                  onMouseDown={() => jumpToHit(hit)}
                >
                  <div className="map-search-hit-top">
                    <span className={`map-search-hit-section section-${hit.section.toLowerCase()}`}>
                      {hit.section}
                    </span>
                    <span className="map-search-hit-label">{hit.label}</span>
                  </div>
                  <div className="map-search-hit-path">
                    {hit.path.slice(0, -1).join(' › ')}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 브랜치맵 */}
      <div className="map-columns" aria-label="구성 관계 브랜치맵">
        <MapColumn title="DOMAIN" count={domains.length}>
          {domains.map((domain) => (
            <MapButton
              active={itemKey('DOMAIN', domain.domain) === activeDomainKey}
              inspected={inspectedKey === itemKey('DOMAIN', domain.domain)}
              jumpId={jumpId}
              count={`${domain.nodes.length} NODE`}
              key={rowName(domain.domain)}
              label={rowName(domain.domain)}
              onClick={() => selectDomain(domain)}
              onInspect={() =>
                openInspector('DOMAIN', domain.domain, [rowName(domain.domain)])
              }
            />
          ))}
        </MapColumn>

        <MapColumn title="NODE" count={nodes.length} muted={!selectedDomain}>
          {nodes.map((node) => (
            <MapButton
              active={itemKey('NODE', node.node) === selectedNodeKey}
              inspected={inspectedKey === itemKey('NODE', node.node)}
              jumpId={jumpId}
              count={`${node.svrgroups.length} SVG`}
              key={rowName(node.node)}
              label={rowName(node.node)}
              onClick={() => selectNode(node)}
              onInspect={() =>
                openInspector('NODE', node.node, [
                  rowName(selectedDomain?.domain),
                  rowName(node.node),
                ])
              }
            />
          ))}
        </MapColumn>

        <MapColumn title="SVG" count={groups.length} muted={!selectedNode}>
          {groups.map((group) => (
            <MapButton
              active={itemKey('SVRGROUP', group.svrgroup) === selectedGroupKey}
              inspected={inspectedKey === itemKey('SVRGROUP', group.svrgroup)}
              jumpId={jumpId}
              count={`${group.servers.length} SERVER`}
              key={rowName(group.svrgroup)}
              label={rowName(group.svrgroup)}
              onClick={() => selectGroup(group)}
              onInspect={() =>
                openInspector('SVRGROUP', group.svrgroup, [
                  rowName(selectedDomain?.domain),
                  rowName(selectedNode?.node),
                  rowName(group.svrgroup),
                ])
              }
            />
          ))}
        </MapColumn>

        <MapColumn title="SERVER" count={servers.length} muted={!selectedGroup}>
          {servers.map((server) => (
            <MapButton
              active={itemKey('SERVER', server.server) === selectedServerKey}
              inspected={inspectedKey === itemKey('SERVER', server.server)}
              jumpId={jumpId}
              count={`${server.services.length} SERVICE`}
              key={rowName(server.server)}
              label={rowName(server.server)}
              onClick={() => selectServer(server)}
              onInspect={() =>
                openInspector('SERVER', server.server, [
                  rowName(selectedDomain?.domain),
                  rowName(selectedNode?.node),
                  rowName(selectedGroup?.svrgroup),
                  rowName(server.server),
                ])
              }
            />
          ))}
        </MapColumn>

        <MapColumn title="SERVICE" count={services.length} muted={!selectedServer}>
          {services.map((service) => (
            <MapButton
              active={false}
              inspected={inspectedKey === itemKey('SERVICE', service)}
              jumpId={jumpId}
              key={rowName(service)}
              label={rowName(service)}
              onClick={() =>
                openInspector('SERVICE', service, [
                  rowName(selectedDomain?.domain),
                  rowName(selectedNode?.node),
                  rowName(selectedGroup?.svrgroup),
                  rowName(selectedServer?.server),
                  rowName(service),
                ])
              }
              onInspect={() =>
                openInspector('SERVICE', service, [
                  rowName(selectedDomain?.domain),
                  rowName(selectedNode?.node),
                  rowName(selectedGroup?.svrgroup),
                  rowName(selectedServer?.server),
                  rowName(service),
                ])
              }
            />
          ))}
        </MapColumn>
      </div>

      {/* 우측 고정 inspector 패널 */}
      <div
        ref={inspectorRef}
        className={inspectorOpen ? 'relationship-inspector open' : 'relationship-inspector'}
        role="dialog"
        aria-label="설정 상세"
      >
        {inspectorData && (
          <>
            <div className="relationship-inspector-header">
              <div>
                <span className={`inspector-section-badge section-${inspectorData.section.label.toLowerCase()}`}>
                  {inspectorData.section.label}
                </span>
                <h3>{String(inspectorData.row.NAME ?? '-')}</h3>
                <p>{inspectorData.path.filter((p) => p && p !== '-').join(' / ')}</p>
              </div>
              <button type="button" aria-label="닫기" onClick={closeInspector}>
                ×
              </button>
            </div>

            <dl className="relationship-config-list">
              {inspectorData.section.columns.map((column) => (
                <div key={column.key}>
                  <dt>{column.label}</dt>
                  <dd>{displayValue(inspectorData.row[column.key])}</dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </div>
  )
}

type MapColumnProps = {
  children: ReactNode
  count: number
  muted?: boolean
  title: string
}

function MapColumn({ children, count, muted = false, title }: MapColumnProps) {
  return (
    <section className={muted ? 'map-column muted' : 'map-column'}>
      <div className="map-column-header">
        <h3>{title}</h3>
        <span>{count}</span>
      </div>
      <div className="map-column-list">
        {count > 0 ? children : <p>선택된 상위 항목이 없습니다.</p>}
      </div>
    </section>
  )
}

type MapButtonProps = {
  active: boolean
  inspected: boolean
  jumpId: number
  count?: string
  label: string
  onClick: () => void
  onInspect: () => void
}

function MapButton({ active, inspected, jumpId, count, label, onClick, onInspect }: MapButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const prevJumpId = useRef(jumpId)

  useEffect(() => {
    if (active && jumpId !== prevJumpId.current && ref.current) {
      ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    prevJumpId.current = jumpId
  }, [active, jumpId])

  return (
    <button
      ref={ref}
      type="button"
      className={['map-item', active && 'active', inspected && 'inspected', active && jumpId > 0 && 'jumped'].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className="map-item-main">
        <strong>{label}</strong>
        <button
          type="button"
          className="map-item-inspect"
          aria-label="상세 보기"
          onClick={(e) => {
            e.stopPropagation()
            onInspect()
          }}
        >
          i
        </button>
      </div>
      {count ? (
        <div className="map-item-footer">
          <span>{count}</span>
        </div>
      ) : null}
    </button>
  )
}
