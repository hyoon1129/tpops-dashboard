import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  initialSearchRows,
  initialSections,
  sectionDefinitions,
} from '../constants/dashboard'
import type {
  Column,
  DashboardView,
  RelationshipDomain,
  RelationshipNode,
  SectionDefinition,
  SearchResult,
  SectionKey,
  ServerInfo,
  SortState,
  TableRow,
  TableValue,
} from '../types/config'

export const useConfigDashboard = () => {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<DashboardView>(() =>
    location.pathname.endsWith('/tree')
      ? '구성 트리'
      : location.pathname.endsWith('/metrics')
      ? '서비스 응답시간'
      : location.pathname.endsWith('/upload')
      ? '설정 파일'
      : '설정 목록'
  )
  const [selectedSection, setSelectedSection] = useState<SectionKey>('SERVER')
  const [globalKeyword, setGlobalKeyword] = useState('')
  const [sectionKeyword, setSectionKeyword] = useState('')
  const [sections, setSections] = useState(initialSections)
  const [initialDataLoading, setInitialDataLoading] = useState(true)
  const [loadingServers, setLoadingServers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchRowsBySection, setSearchRowsBySection] = useState(initialSearchRows)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sortState, setSortState] = useState<SortState | null>(null)
  const [expandedSearchSections, setExpandedSearchSections] = useState<Set<SectionKey>>(() => new Set())
  const [relationshipRows, setRelationshipRows] = useState(initialSearchRows)

  const currentDefinition = sectionDefinitions.find((section) => section.label === selectedSection) ?? sectionDefinitions[0]
  const currentState = sections[selectedSection]
  const deferredSectionKeyword = useDeferredValue(sectionKeyword)
  const selectedServer = servers.find((server) => server.serverId === selectedServerId) ?? null
  const isGlobalSearch = globalKeyword.trim().length > 0
  const globalSearchRowTotal = Object.values(searchRowsBySection).reduce((total, rows) => total + rows.length, 0)
  const searchResultsBySection = useMemo(() =>
    sectionDefinitions.map((section) => ({
      section,
      rows: searchRowsBySection[section.label],
    })).filter((group) => group.rows.length > 0),
  [searchRowsBySection])

  const relationshipTree = useMemo<RelationshipDomain[]>(() => {
    const domains = relationshipRows.DOMAIN
    const nodes = relationshipRows.NODE
    const svrgroups = relationshipRows.SVRGROUP
    const servers = relationshipRows.SERVER
    const services = relationshipRows.SERVICE
    const gateways = relationshipRows.GATEWAY

    const nodeTree = nodes.map<RelationshipNode>((node) => {
      const nodeName = String(node.NAME ?? '')
      const nodeSvrgroups = svrgroups
        .filter((svrgroup) => String(svrgroup.nodename ?? '') === nodeName)
        .map((svrgroup) => {
          const svrgroupName = String(svrgroup.NAME ?? '')
          const groupServers = servers
            .filter((server) => String(server.svgname ?? '') === svrgroupName)
            .map((server) => {
              const serverName = String(server.NAME ?? '')
              return {
                server,
                services: services.filter((service) => String(service.svrname ?? '') === serverName),
              }
            })
          return { svrgroup, servers: groupServers }
        })
      return {
        node,
        svrgroups: nodeSvrgroups,
        gateways: gateways.filter((gateway) => String(gateway.nodename ?? '') === nodeName),
      }
    })

    return domains.map((domain) => ({
      domain,
      nodes: nodeTree,
    }))
  }, [relationshipRows])

  const loadSectionRows = useCallback(async (
    definition: SectionDefinition,
    signal?: AbortSignal,
  ) => {
    if (selectedServerId === null) {
      return []
    }

    const response = await fetch(`/api/servers/${selectedServerId}/${definition.endpoint}`, { signal })
    if (!response.ok) {
      throw new Error(`${definition.title} 설정을 불러오지 못했습니다.`)
    }
    const data = (await response.json()) as Array<Record<string, TableValue>>

    return definition.toRows(data)
  }, [selectedServerId])

  const reloadDashboard = useCallback(async (signal?: AbortSignal) => {
    if (selectedServerId === null) {
      return
    }

    setInitialDataLoading(true)
    setSections((current) =>
      sectionDefinitions.reduce((next, section) => {
        next[section.label] = { ...current[section.label], loading: true }
        return next
      }, { ...current }),
    )

    const nextRows = initialSearchRows()
    const nextSections = initialSections()
    await Promise.all(sectionDefinitions.map(async (section) => {
      const rows = await loadSectionRows(section, signal)
      nextRows[section.label] = rows
      nextSections[section.label] = {
        rows,
        total: rows.length,
        page: 0,
        last: true,
        loading: false,
      }
    }))

    setSections(nextSections)
    setRelationshipRows(nextRows)
    setSearchResults([])
    setSearchRowsBySection(initialSearchRows())
    setExpandedSearchSections(new Set())
    setSortState(null)
    setError(null)
    setInitialDataLoading(false)
  }, [loadSectionRows, selectedServerId])

  const compareRows = useCallback((column: Column, direction: SortState['direction']) => (left: TableRow, right: TableRow) => {
    const leftValue = left[column.key]
    const rightValue = right[column.key]

    if (leftValue == null && rightValue == null) {
      return 0
    }
    if (leftValue == null) {
      return direction === 'asc' ? 1 : -1
    }
    if (rightValue == null) {
      return direction === 'asc' ? -1 : 1
    }

    const result = typeof leftValue === 'number' && typeof rightValue === 'number'
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), 'ko', { numeric: true, sensitivity: 'base' })

    return direction === 'asc' ? result : -result
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadServers() {
      try {
        setLoadingServers(true)
        const response = await fetch('/api/servers')
        if (!response.ok) {
          throw new Error('서버 목록을 불러오지 못했습니다.')
        }
        const data = (await response.json()) as ServerInfo[]
        if (!ignore) {
          setServers(data)
          setSelectedServerId((serverId) => serverId ?? data[0]?.serverId ?? null)
          setError(data.length === 0 ? '조회할 서버가 없습니다.' : null)
          if (data.length === 0) {
            setInitialDataLoading(false)
          }
        }
      } catch (caught) {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
          setInitialDataLoading(false)
        }
      } finally {
        if (!ignore) {
          setLoadingServers(false)
        }
      }
    }

    loadServers()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (selectedServerId === null) {
      return
    }

    const controller = new AbortController()

    async function loadSections() {
      try {
        await reloadDashboard(controller.signal)
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
          setSections((current) =>
            sectionDefinitions.reduce((next, section) => {
              next[section.label] = { ...current[section.label], loading: false }
              return next
            }, { ...current }),
          )
          setInitialDataLoading(false)
        }
      }
    }

    loadSections()

    return () => controller.abort()
  }, [reloadDashboard, selectedServerId])

  useEffect(() => {
    if (selectedServerId === null || !globalKeyword.trim()) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        const params = new URLSearchParams({ keyword: globalKeyword.trim() })
        const response = await fetch(`/api/servers/${selectedServerId}/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error('검색 결과를 불러오지 못했습니다.')
        }
        const results = (await response.json()) as SearchResult[]
        const nextSearchRows = initialSearchRows()

        await Promise.all(sectionDefinitions.map(async (section) => {
          const matchedNames = new Set(
            results
              .filter((result) => result.section === section.label)
              .map((result) => result.name),
          )
          if (matchedNames.size === 0) {
            return
          }

          nextSearchRows[section.label] = sections[section.label].rows
            .filter((row) => matchedNames.has(String(row.NAME ?? '')))
        }))

        setSearchResults(results)
        setSearchRowsBySection(nextSearchRows)
        setExpandedSearchSections(new Set())
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [globalKeyword, sections, selectedServerId])

  const filteredRows = useMemo(() => {
    const normalizedKeyword = deferredSectionKeyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return currentState.rows
    }
    return currentState.rows.filter((row) =>
      currentDefinition.columns.some((column) =>
        String(row[column.key] ?? '').toLowerCase().includes(normalizedKeyword),
      ),
    )
  }, [currentDefinition.columns, currentState.rows, deferredSectionKeyword])

  const handleSort = useCallback((column: Column) => {
    const nextDirection = sortState?.section === selectedSection && sortState.key === column.sortKey && sortState.direction === 'asc'
      ? 'desc'
      : 'asc'
    const nextSortState: SortState = {
      section: selectedSection,
      key: column.sortKey,
      direction: nextDirection,
    }
    setSortState(nextSortState)
    setSectionKeyword('')
    setSections((current) => ({
      ...current,
      [selectedSection]: {
        ...current[selectedSection],
        rows: [...current[selectedSection].rows].sort(compareRows(column, nextDirection)),
      },
    }))
  }, [compareRows, selectedSection, sortState])

  const handleServerChange = (serverId: number) => {
    setSelectedServerId(serverId)
    setSections(initialSections())
    setSectionKeyword('')
    setGlobalKeyword('')
    setSearchResults([])
    setSearchRowsBySection(initialSearchRows())
    setSearchLoading(false)
    setSortState(null)
    setRelationshipRows(initialSearchRows())
    setInitialDataLoading(true)
  }

  const handleGlobalKeywordChange = (keyword: string) => {
    setGlobalKeyword(keyword)
    if (keyword.trim() && activeView === '구성 트리') {
      setActiveView('설정 목록')
      history.pushState(null, '', '/list')
    }
    if (!keyword.trim()) {
      setSearchResults([])
      setSearchRowsBySection(initialSearchRows())
      setSearchLoading(false)
      setExpandedSearchSections(new Set())
    }
  }

  const toggleSearchSection = (section: SectionKey) => {
    setExpandedSearchSections((current) => {
      const next = new Set(current)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const selectSection = (section: SectionKey) => {
    setActiveView('설정 목록')
    history.pushState(null, '', '/list')
    setSelectedSection(section)
    setSectionKeyword('')
    setGlobalKeyword('')
  }

  const selectView = (view: DashboardView) => {
    setActiveView(view)
    history.pushState(null, '', view === '구성 트리' ? '/tree' : view === '서비스 응답시간' ? '/metrics' : view === '설정 파일' ? '/upload' : '/list')
    setGlobalKeyword('')
  }

  const updateSelectedServer = (server: ServerInfo) => {
    setServers((current) => current.map((item) => item.serverId === server.serverId ? server : item))
  }

  return {
    activeView,
    currentDefinition,
    currentState,
    error,
    expandedSearchSections,
    filteredRows,
    globalKeyword,
    globalSearchRowTotal,
    handleGlobalKeywordChange,
    handleServerChange,
    handleSort,
    isGlobalSearch,
    initialDataLoading,
    loadingServers,
    relationshipLoading: false,
    relationshipTree,
    reloadDashboard,
    searchLoading,
    searchResults,
    searchResultsBySection,
    deferredSectionKeyword,
    sectionKeyword,
    sections,
    selectSection,
    selectView,
    selectedSection,
    selectedServer,
    selectedServerId,
    servers,
    setSectionKeyword,
    setSidebarCollapsed,
    sidebarCollapsed,
    sortState,
    toggleSearchSection,
    updateSelectedServer,
  }
}
