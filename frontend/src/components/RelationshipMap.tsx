import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  RelationshipDomain,
  RelationshipGroup,
  RelationshipNode,
  RelationshipServer,
  SectionKey,
  TableRow,
} from '../types/config'

type SearchHit = {
  label: string
  section: SectionKey
  path: string[]
  domainKey: string
  nodeKey: string | null
  groupKey: string | null
  serverKey: string | null
  targetKey: string
}

type RelationshipMapProps = {
  itemToSelect?: { section: SectionKey; row: TableRow } | null
  loading: boolean
  onInspect?: (section: SectionKey, row: TableRow) => void
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

const rowName = (row?: TableRow) => String(row?.NAME ?? '-')

const itemKey = (section: SectionKey, row?: TableRow) => `${section}:${rowName(row)}`

export function RelationshipMap({ itemToSelect, loading, onInspect, tree }: RelationshipMapProps) {
  const [selectedDomainKey, setSelectedDomainKey] = useState<string | null>(null)
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [selectedServerKey, setSelectedServerKey] = useState<string | null>(null)
  const [inspectedKey, setInspectedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [jumpId, setJumpId] = useState(0)
  const [jumpTargetKey, setJumpTargetKey] = useState<string | null>(null)
  const [jumpAncestorKeys, setJumpAncestorKeys] = useState<Set<string>>(new Set())
  const jumpRafRef = useRef<number | null>(null)

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

  const searchHits = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const hits: SearchHit[] = []

    for (const domainEntry of tree) {
      const domainKey = itemKey('DOMAIN', domainEntry.domain)
      const domainName = rowName(domainEntry.domain)

      if (domainName.toLowerCase().includes(q)) {
        hits.push({ label: domainName, section: 'DOMAIN', path: [domainName], domainKey, nodeKey: null, groupKey: null, serverKey: null, targetKey: domainKey })
      }

      for (const nodeEntry of domainEntry.nodes) {
        const nodeKey = itemKey('NODE', nodeEntry.node)
        const nodeName = rowName(nodeEntry.node)

        if (nodeName.toLowerCase().includes(q)) {
          hits.push({ label: nodeName, section: 'NODE', path: [domainName, nodeName], domainKey, nodeKey, groupKey: null, serverKey: null, targetKey: nodeKey })
        }

        for (const groupEntry of nodeEntry.svrgroups) {
          const groupKey = itemKey('SVRGROUP', groupEntry.svrgroup)
          const groupName = rowName(groupEntry.svrgroup)

          if (groupName.toLowerCase().includes(q)) {
            hits.push({ label: groupName, section: 'SVRGROUP', path: [domainName, nodeName, groupName], domainKey, nodeKey, groupKey, serverKey: null, targetKey: groupKey })
          }

          for (const serverEntry of groupEntry.servers) {
            const serverKey = itemKey('SERVER', serverEntry.server)
            const serverName = rowName(serverEntry.server)

            if (serverName.toLowerCase().includes(q)) {
              hits.push({ label: serverName, section: 'SERVER', path: [domainName, nodeName, groupName, serverName], domainKey, nodeKey, groupKey, serverKey, targetKey: serverKey })
            }

            for (const service of serverEntry.services) {
              const serviceName = rowName(service)
              if (serviceName.toLowerCase().includes(q)) {
                hits.push({ label: serviceName, section: 'SERVICE', path: [domainName, nodeName, groupName, serverName, serviceName], domainKey, nodeKey, groupKey, serverKey, targetKey: itemKey('SERVICE', service) })
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

  useEffect(() => {
    if (!itemToSelect) return
    const { section, row } = itemToSelect
    const name = rowName(row)

    for (const domainEntry of tree) {
      const dk = itemKey('DOMAIN', domainEntry.domain)
      if (section === 'DOMAIN' && rowName(domainEntry.domain) === name) {
        setSelectedDomainKey(dk); setSelectedNodeKey(null); setSelectedGroupKey(null); setSelectedServerKey(null)
        setInspectedKey(dk); setJumpTargetKey(dk); setJumpAncestorKeys(new Set()); setJumpId((n) => n + 1)
        return
      }
      for (const nodeEntry of domainEntry.nodes) {
        const nk = itemKey('NODE', nodeEntry.node)
        if (section === 'NODE' && rowName(nodeEntry.node) === name) {
          setSelectedDomainKey(dk); setSelectedNodeKey(nk); setSelectedGroupKey(null); setSelectedServerKey(null)
          setInspectedKey(nk); setJumpTargetKey(nk); setJumpAncestorKeys(new Set([dk])); setJumpId((n) => n + 1)
          return
        }
        for (const groupEntry of nodeEntry.svrgroups) {
          const gk = itemKey('SVRGROUP', groupEntry.svrgroup)
          if (section === 'SVRGROUP' && rowName(groupEntry.svrgroup) === name) {
            setSelectedDomainKey(dk); setSelectedNodeKey(nk); setSelectedGroupKey(gk); setSelectedServerKey(null)
            setInspectedKey(gk); setJumpTargetKey(gk); setJumpAncestorKeys(new Set([dk, nk])); setJumpId((n) => n + 1)
            return
          }
          for (const serverEntry of groupEntry.servers) {
            const sk = itemKey('SERVER', serverEntry.server)
            if (section === 'SERVER' && rowName(serverEntry.server) === name) {
              setSelectedDomainKey(dk); setSelectedNodeKey(nk); setSelectedGroupKey(gk); setSelectedServerKey(sk)
              setInspectedKey(sk); setJumpTargetKey(sk); setJumpAncestorKeys(new Set([dk, nk, gk])); setJumpId((n) => n + 1)
              return
            }
            for (const service of serverEntry.services) {
              if (section === 'SERVICE' && rowName(service) === name) {
                const svck = itemKey('SERVICE', service)
                setSelectedDomainKey(dk); setSelectedNodeKey(nk); setSelectedGroupKey(gk); setSelectedServerKey(sk)
                setInspectedKey(svck); setJumpTargetKey(svck); setJumpAncestorKeys(new Set([dk, nk, gk, sk])); setJumpId((n) => n + 1)
                return
              }
            }
          }
        }
      }
    }
  }, [itemToSelect])

  useEffect(() => {
    if (jumpId === 0) return
    if (jumpRafRef.current) cancelAnimationFrame(jumpRafRef.current)
    jumpRafRef.current = requestAnimationFrame(() => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('.map-columns .map-item.active, .map-columns .map-item.jump-target'))
      const lowestEl = candidates.reduce<HTMLElement | null>((lowest, el) => {
        if (!lowest) return el
        return el.getBoundingClientRect().top > lowest.getBoundingClientRect().top ? el : lowest
      }, null)
      if (lowestEl) lowestEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    return () => { if (jumpRafRef.current) cancelAnimationFrame(jumpRafRef.current) }
  }, [jumpId])

  const jumpToHit = (hit: SearchHit) => {
    const ancestors = new Set<string>()
    if (hit.section !== 'DOMAIN') ancestors.add(hit.domainKey)
    if (hit.section !== 'NODE' && hit.nodeKey) ancestors.add(hit.nodeKey)
    if (hit.section !== 'SVRGROUP' && hit.groupKey) ancestors.add(hit.groupKey)
    if (hit.section !== 'SERVER' && hit.serverKey) ancestors.add(hit.serverKey)

    setJumpTargetKey(hit.targetKey)
    setJumpAncestorKeys(ancestors)
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

  const selectDomain = (domain: RelationshipDomain) => {
    const key = itemKey('DOMAIN', domain.domain)
    setSelectedDomainKey(key === activeDomainKey ? null : key)
    setSelectedNodeKey(null)
    setSelectedGroupKey(null)
    setSelectedServerKey(null)
    setJumpTargetKey(null)
    setJumpAncestorKeys(new Set())
  }

  const selectNode = (node: RelationshipNode) => {
    const key = itemKey('NODE', node.node)
    setSelectedNodeKey(key === selectedNodeKey ? null : key)
    setSelectedGroupKey(null)
    setSelectedServerKey(null)
    setJumpTargetKey(null)
    setJumpAncestorKeys(new Set())
  }

  const selectGroup = (group: RelationshipGroup) => {
    const key = itemKey('SVRGROUP', group.svrgroup)
    setSelectedGroupKey(key === selectedGroupKey ? null : key)
    setSelectedServerKey(null)
    setJumpTargetKey(null)
    setJumpAncestorKeys(new Set())
  }

  const selectServer = (server: RelationshipServer) => {
    const key = itemKey('SERVER', server.server)
    setSelectedServerKey(key === selectedServerKey ? null : key)
    setJumpTargetKey(null)
    setJumpAncestorKeys(new Set())
  }

  const openInspector = (section: SectionKey, row: TableRow) => {
    const key = itemKey(section, row)
    setInspectedKey(key === inspectedKey ? null : key)
    onInspect?.(section, row)
  }

  const showSearchDropdown = searchFocused && searchQuery.trim().length > 0

  return (
    <div className="relationship-map">
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

      <div className="map-columns" aria-label="구성 관계 브랜치맵">
        <MapColumn title="DOMAIN" count={domains.length}>
          {domains.map((domain) => {
            const key = itemKey('DOMAIN', domain.domain)
            return (
              <MapButton
                active={key === activeDomainKey}
                inspected={inspectedKey === key}
                isJumpTarget={jumpTargetKey === key}
                isJumpAncestor={jumpAncestorKeys.has(key)}
                count={`${domain.nodes.length} NODE`}
                key={rowName(domain.domain)}
                label={rowName(domain.domain)}
                onClick={() => selectDomain(domain)}
                onInspect={() => openInspector('DOMAIN', domain.domain)}
              />
            )
          })}
        </MapColumn>

        <MapColumn title="NODE" count={nodes.length} muted={!selectedDomain}>
          {nodes.map((node) => {
            const key = itemKey('NODE', node.node)
            return (
              <MapButton
                active={key === selectedNodeKey}
                inspected={inspectedKey === key}
                isJumpTarget={jumpTargetKey === key}
                isJumpAncestor={jumpAncestorKeys.has(key)}
                count={`${node.svrgroups.length} SVG`}
                key={rowName(node.node)}
                label={rowName(node.node)}
                onClick={() => selectNode(node)}
                onInspect={() => openInspector('NODE', node.node)}
              />
            )
          })}
        </MapColumn>

        <MapColumn title="SVG" count={groups.length} muted={!selectedNode}>
          {groups.map((group) => {
            const key = itemKey('SVRGROUP', group.svrgroup)
            return (
              <MapButton
                active={key === selectedGroupKey}
                inspected={inspectedKey === key}
                isJumpTarget={jumpTargetKey === key}
                isJumpAncestor={jumpAncestorKeys.has(key)}
                count={`${group.servers.length} SERVER`}
                key={rowName(group.svrgroup)}
                label={rowName(group.svrgroup)}
                onClick={() => selectGroup(group)}
                onInspect={() => openInspector('SVRGROUP', group.svrgroup)}
              />
            )
          })}
        </MapColumn>

        <MapColumn title="SERVER" count={servers.length} muted={!selectedGroup}>
          {servers.map((server) => {
            const key = itemKey('SERVER', server.server)
            return (
              <MapButton
                active={key === selectedServerKey}
                inspected={inspectedKey === key}
                isJumpTarget={jumpTargetKey === key}
                isJumpAncestor={jumpAncestorKeys.has(key)}
                count={`${server.services.length} SERVICE`}
                key={rowName(server.server)}
                label={rowName(server.server)}
                onClick={() => selectServer(server)}
                onInspect={() => openInspector('SERVER', server.server)}
              />
            )
          })}
        </MapColumn>

        <MapColumn title="SERVICE" count={services.length} muted={!selectedServer}>
          {services.map((service) => {
            const key = itemKey('SERVICE', service)
            return (
              <MapButton
                active={false}
                inspected={inspectedKey === key}
                isJumpTarget={jumpTargetKey === key}
                isJumpAncestor={false}
                key={rowName(service)}
                label={rowName(service)}
                onClick={() => openInspector('SERVICE', service)}
                onInspect={() => openInspector('SERVICE', service)}
              />
            )
          })}
        </MapColumn>
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
        {count > 0 ? children : muted ? <p>선택된 상위 항목이 없습니다.</p> : <p>항목이 없습니다.</p>}
      </div>
    </section>
  )
}

type MapButtonProps = {
  active: boolean
  inspected: boolean
  isJumpTarget: boolean
  isJumpAncestor: boolean
  count?: string
  label: string
  onClick: () => void
  onInspect: () => void
}

function MapButton({ active, inspected, isJumpTarget, isJumpAncestor, count, label, onClick, onInspect }: MapButtonProps) {
  const classes = [
    'map-item',
    active && 'active',
    inspected && 'inspected',
    isJumpTarget && 'jump-target',
    isJumpAncestor && 'jump-ancestor',
  ].filter(Boolean).join(' ')

  return (
    <div
      role="button"
      tabIndex={0}
      className={classes}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
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
    </div>
  )
}
