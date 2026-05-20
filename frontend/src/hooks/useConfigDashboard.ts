import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  TableValue,
} from '../types/config'

const PAGE_SIZE = 200

export const useConfigDashboard = () => {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<DashboardView>(() =>
    location.pathname.endsWith('/tree')
      ? '구성 트리'
      : location.pathname.endsWith('/metrics')
      ? '서비스 응답시간'
      : location.pathname.endsWith('/settings')
      ? '설정 관리'
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

  const keywordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentDefinition = sectionDefinitions.find((section) => section.label === selectedSection) ?? sectionDefinitions[0]
  const currentState = sections[selectedSection]
  const selectedServer = servers.find((server) => server.serverId === selectedServerId) ?? null
  const isGlobalSearch = globalKeyword.trim().length > 0
  const searchResultsBySection = useMemo(() =>
    sectionDefinitions.map((section) => ({
      section,
      rows: searchRowsBySection[section.label],
    })).filter((group) => group.rows.length > 0),
  [searchRowsBySection])
  const globalSearchRowTotal = Object.values(searchRowsBySection).reduce((total, rows) => total + rows.length, 0)

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

  // Load full (non-paginated) rows — used for relationshipRows, tree, global search
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

  // Fetch one page from the server
  const fetchPage = useCallback(async (
    definition: SectionDefinition,
    page: number,
    sort: string,
    direction: 'asc' | 'desc',
    keyword: string,
    signal?: AbortSignal,
  ) => {
    if (selectedServerId === null) return null

    const params = new URLSearchParams({
      page: String(page),
      size: String(PAGE_SIZE),
      sort,
      direction: direction.toUpperCase(),
    })
    if (keyword.trim()) {
      params.set('keyword', keyword.trim())
    }

    const response = await fetch(
      `/api/servers/${selectedServerId}/${definition.pageEndpoint}?${params.toString()}`,
      { signal },
    )
    if (!response.ok) {
      throw new Error(`${definition.title} 설정을 불러오지 못했습니다.`)
    }

    const data = (await response.json()) as {
      content: Array<Record<string, TableValue>>
      page: number
      size: number
      totalElements: number
      totalPages: number
      first: boolean
      last: boolean
    }

    return {
      rows: definition.toRows(data.content),
      total: data.totalElements,
      page: data.page,
      totalPages: data.totalPages,
      last: data.last,
    }
  }, [selectedServerId])

  const reloadDashboard = useCallback(async (signal?: AbortSignal) => {
    if (selectedServerId === null) return

    setInitialDataLoading(true)
    setSections((current) =>
      sectionDefinitions.reduce((next, section) => {
        next[section.label] = { ...current[section.label], loading: true }
        return next
      }, { ...current }),
    )

    const nextRelationshipRows = initialSearchRows()
    const nextSections = initialSections()

    await Promise.all(sectionDefinitions.map(async (section) => {
      const [allRows, pageResult] = await Promise.all([
        loadSectionRows(section, signal),
        fetchPage(section, 0, 'id', 'asc', '', signal),
      ])
      nextRelationshipRows[section.label] = allRows

      if (pageResult) {
        nextSections[section.label] = {
          rows: pageResult.rows,
          total: pageResult.total,
          page: pageResult.page,
          totalPages: pageResult.totalPages,
          last: pageResult.last,
          loading: false,
        }
      } else {
        nextSections[section.label] = {
          rows: allRows,
          total: allRows.length,
          page: 0,
          totalPages: 1,
          last: true,
          loading: false,
        }
      }
    }))

    setSections(nextSections)
    setRelationshipRows(nextRelationshipRows)
    setSearchResults([])
    setSearchRowsBySection(initialSearchRows())
    setExpandedSearchSections(new Set())
    setSortState(null)
    setError(null)
    setInitialDataLoading(false)
  }, [loadSectionRows, fetchPage, selectedServerId])

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
          if (data.length === 0) setInitialDataLoading(false)
        }
      } catch (caught) {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
          setInitialDataLoading(false)
        }
      } finally {
        if (!ignore) setLoadingServers(false)
      }
    }

    loadServers()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (selectedServerId === null) return

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

  // Global keyword search
  useEffect(() => {
    if (selectedServerId === null || !globalKeyword.trim()) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        const params = new URLSearchParams({ keyword: globalKeyword.trim() })
        const response = await fetch(`/api/servers/${selectedServerId}/search?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('검색 결과를 불러오지 못했습니다.')

        const results = (await response.json()) as SearchResult[]
        const nextSearchRows = initialSearchRows()

        await Promise.all(sectionDefinitions.map(async (section) => {
          const matchedNames = new Set(
            results
              .filter((result) => result.section === section.label)
              .map((result) => result.name),
          )
          if (matchedNames.size === 0) return

          nextSearchRows[section.label] = relationshipRows[section.label]
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
        if (!controller.signal.aborted) setSearchLoading(false)
      }
    }, 300)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [globalKeyword, relationshipRows, selectedServerId])

  // Debounced section keyword → reset rows and load page 0 from server
  useEffect(() => {
    if (selectedServerId === null) return

    if (keywordTimerRef.current !== null) clearTimeout(keywordTimerRef.current)

    const controller = new AbortController()

    keywordTimerRef.current = setTimeout(async () => {
      const currentSort = sortState?.section === selectedSection ? sortState : null
      setSections((current) => ({
        ...current,
        [selectedSection]: { ...current[selectedSection], rows: [], page: -1, loading: true },
      }))
      try {
        const result = await fetchPage(
          currentDefinition,
          0,
          currentSort?.key ?? 'id',
          currentSort?.direction ?? 'asc',
          sectionKeyword,
          controller.signal,
        )
        if (result && !controller.signal.aborted) {
          setSections((current) => ({
            ...current,
            [selectedSection]: {
              ...current[selectedSection],
              rows: result.rows,
              total: result.total,
              page: result.page,
              totalPages: result.totalPages,
              last: result.last,
              loading: false,
            },
          }))
        }
      } catch {
        if (!controller.signal.aborted) {
          setSections((current) => ({
            ...current,
            [selectedSection]: { ...current[selectedSection], loading: false },
          }))
        }
      }
    }, 300)

    return () => {
      if (keywordTimerRef.current !== null) clearTimeout(keywordTimerRef.current)
      controller.abort()
    }
  }, [sectionKeyword, selectedSection, selectedServerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Append next page (called by infinite scroll sentinel).
  // Reads page/last from functional setter to avoid stale closure — sections not in deps.
  const loadMoreRows = useCallback(async () => {
    let nextPage = -1
    let alreadyLast = false
    let currentSortKey = 'id'
    let currentSortDir: 'asc' | 'desc' = 'asc'

    setSections((current) => {
      const state = current[selectedSection]
      if (state.loading || state.last) {
        alreadyLast = true
        return current
      }
      nextPage = state.page + 1
      return { ...current, [selectedSection]: { ...state, loading: true } }
    })

    if (alreadyLast || nextPage < 0) return

    const currentSort = sortState?.section === selectedSection ? sortState : null
    currentSortKey = currentSort?.key ?? 'id'
    currentSortDir = currentSort?.direction ?? 'asc'

    try {
      const result = await fetchPage(
        currentDefinition,
        nextPage,
        currentSortKey,
        currentSortDir,
        sectionKeyword,
      )
      if (result) {
        setSections((current) => ({
          ...current,
          [selectedSection]: {
            ...current[selectedSection],
            rows: [...current[selectedSection].rows, ...result.rows],
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            last: result.last,
            loading: false,
          },
        }))
      }
    } catch {
      setSections((current) => ({
        ...current,
        [selectedSection]: { ...current[selectedSection], loading: false },
      }))
    }
  }, [currentDefinition, fetchPage, sectionKeyword, selectedSection, sortState])

  const handleSort = useCallback(async (column: Column) => {
    const nextDirection = sortState?.section === selectedSection && sortState.key === column.sortKey && sortState.direction === 'asc'
      ? 'desc'
      : 'asc'
    const nextSortState: SortState = {
      section: selectedSection,
      key: column.sortKey,
      direction: nextDirection,
    }
    setSortState(nextSortState)
    if (selectedServerId === null) return

    // Reset rows and load page 0 with new sort
    setSections((current) => ({
      ...current,
      [selectedSection]: { ...current[selectedSection], rows: [], page: -1, loading: true },
    }))

    try {
      const result = await fetchPage(
        currentDefinition,
        0,
        column.sortKey,
        nextDirection,
        sectionKeyword,
      )
      if (result) {
        setSections((current) => ({
          ...current,
          [selectedSection]: {
            ...current[selectedSection],
            rows: result.rows,
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            last: result.last,
            loading: false,
          },
        }))
      }
    } catch {
      setSections((current) => ({
        ...current,
        [selectedSection]: { ...current[selectedSection], loading: false },
      }))
    }
  }, [currentDefinition, fetchPage, sectionKeyword, selectedSection, selectedServerId, sortState])

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
      if (next.has(section)) next.delete(section)
      else next.add(section)
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
    history.pushState(null, '', view === '구성 트리' ? '/tree' : view === '서비스 응답시간' ? '/metrics' : view === '설정 관리' ? '/settings' : '/list')
    setGlobalKeyword('')
  }

  const updateSelectedServer = (server: ServerInfo) => {
    setServers((current) => current.map((item) => item.serverId === server.serverId ? server : item))
  }

  const createServer = (server: ServerInfo) => {
    setServers((current) => [...current, server])
    setSelectedServerId(server.serverId)
    setError(null)
  }

  return {
    activeView,
    currentDefinition,
    currentState,
    error,
    expandedSearchSections,
    filteredRows: currentState.rows,
    globalKeyword,
    globalSearchRowTotal,
    handleGlobalKeywordChange,
    handleServerChange,
    handleSort,
    isGlobalSearch,
    initialDataLoading,
    loadingServers,
    loadMoreRows,
    relationshipLoading: false,
    relationshipRows,
    relationshipTree,
    reloadDashboard,
    searchLoading,
    searchResults,
    searchResultsBySection,
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
    createServer,
  }
}
