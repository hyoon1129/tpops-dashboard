import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  initialSearchRows,
  initialSections,
  pageSize,
  sectionDefinitions,
} from '../constants/dashboard'
import type {
  Column,
  DashboardView,
  PageResponse,
  RelationshipDomain,
  RelationshipNode,
  SectionDefinition,
  SearchResult,
  SectionKey,
  ServerInfo,
  SortState,
  TableRow,
} from '../types/config'

export const useConfigDashboard = () => {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [activeView, setActiveView] = useState<DashboardView>('설정 조회')
  const [selectedSection, setSelectedSection] = useState<SectionKey>('SERVER')
  const [globalKeyword, setGlobalKeyword] = useState('')
  const [sectionKeyword, setSectionKeyword] = useState('')
  const [sections, setSections] = useState(initialSections)
  const [loadingServers, setLoadingServers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchRowsBySection, setSearchRowsBySection] = useState(initialSearchRows)
  const [searchLoading, setSearchLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sortState, setSortState] = useState<SortState | null>(null)
  const [expandedSearchSections, setExpandedSearchSections] = useState<Set<SectionKey>>(() => new Set())
  const [relationshipRows, setRelationshipRows] = useState(initialSearchRows)
  const [relationshipLoading, setRelationshipLoading] = useState(false)

  const currentDefinition = sectionDefinitions.find((section) => section.label === selectedSection) ?? sectionDefinitions[0]
  const currentState = sections[selectedSection]
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

  const loadAllRows = useCallback(async (
    definition: SectionDefinition,
    signal?: AbortSignal,
  ) => {
    if (selectedServerId === null) {
      return []
    }

    const rows: TableRow[] = []
    let page = 0
    let last = false

    while (!last) {
      const params = new URLSearchParams({
        page: String(page),
        size: '200',
        sort: definition.columns[0].sortKey,
        direction: 'ASC',
      })
      const response = await fetch(`/api/servers/${selectedServerId}/${definition.endpoint}/page?${params.toString()}`, { signal })
      if (!response.ok) {
        throw new Error(`${definition.title} 관계 데이터를 불러오지 못했습니다.`)
      }
      const data = (await response.json()) as PageResponse
      rows.push(...definition.toRows(data.content))
      last = data.last
      page += 1
    }

    return rows
  }, [selectedServerId])

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
        }
      } catch (caught) {
        if (!ignore) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
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

  const loadSectionPage = useCallback(async (
    sectionKey: SectionKey,
    page: number,
    append: boolean,
    nextSortState: SortState | null = null,
  ) => {
    if (selectedServerId === null) {
      return
    }

    const definition = sectionDefinitions.find((section) => section.label === sectionKey)
    if (!definition) {
      return
    }

    setSections((current) => ({
      ...current,
      [sectionKey]: { ...current[sectionKey], loading: true },
    }))

    try {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
      })
      if (nextSortState?.section === sectionKey) {
        params.set('sort', nextSortState.key)
        params.set('direction', nextSortState.direction.toUpperCase())
      }
      const response = await fetch(`/api/servers/${selectedServerId}/${definition.endpoint}/page?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`${definition.title} 설정을 불러오지 못했습니다.`)
      }
      const data = (await response.json()) as PageResponse
      const rows = definition.toRows(data.content)

      setSections((current) => ({
        ...current,
        [sectionKey]: {
          rows: append ? [...current[sectionKey].rows, ...rows] : rows,
          total: data.totalElements,
          page: data.page,
          last: data.last,
          loading: false,
        },
      }))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
      setSections((current) => ({
        ...current,
        [sectionKey]: { ...current[sectionKey], loading: false },
      }))
    }
  }, [selectedServerId])

  useEffect(() => {
    if (selectedServerId === null) {
      return
    }

    sectionDefinitions.forEach((section) => {
      loadSectionPage(section.label, 0, false)
    })
  }, [loadSectionPage, selectedServerId])

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

          const rows: TableRow[] = []
          let page = 0
          let last = false

          while (!last) {
            const sectionParams = new URLSearchParams({
              page: String(page),
              size: '200',
              sort: section.columns[0].sortKey,
              direction: 'ASC',
            })
            const sectionResponse = await fetch(`/api/servers/${selectedServerId}/${section.endpoint}/page?${sectionParams.toString()}`, {
              signal: controller.signal,
            })
            if (!sectionResponse.ok) {
              throw new Error(`${section.title} 검색 결과를 불러오지 못했습니다.`)
            }
            const data = (await sectionResponse.json()) as PageResponse
            rows.push(...section.toRows(data.content).filter((row) => matchedNames.has(String(row.NAME ?? ''))))
            last = data.last
            page += 1
          }

          nextSearchRows[section.label] = rows
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
  }, [globalKeyword, selectedServerId])

  useEffect(() => {
    if (selectedServerId === null || activeView !== '구성 관계') {
      return
    }

    const controller = new AbortController()

    async function loadRelationships() {
      try {
        setRelationshipLoading(true)
        const nextRows = initialSearchRows()
        await Promise.all(sectionDefinitions
          .map(async (section) => {
            nextRows[section.label] = await loadAllRows(section, controller.signal)
          }))
        setRelationshipRows(nextRows)
        setError(null)
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setRelationshipLoading(false)
        }
      }
    }

    loadRelationships()

    return () => controller.abort()
  }, [activeView, loadAllRows, selectedServerId])

  const filteredRows = useMemo(() => {
    const normalizedKeyword = sectionKeyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return currentState.rows
    }
    return currentState.rows.filter((row) =>
      currentDefinition.columns.some((column) =>
        String(row[column.key] ?? '').toLowerCase().includes(normalizedKeyword),
      ),
    )
  }, [currentDefinition.columns, currentState.rows, sectionKeyword])

  const loadNextPage = () => {
    if (isGlobalSearch || sectionKeyword.trim() || currentState.loading || currentState.last) {
      return
    }
    loadSectionPage(selectedSection, currentState.page + 1, true, sortState)
  }

  const handleSort = (column: Column) => {
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
      [selectedSection]: { ...current[selectedSection], rows: [], page: -1, last: false },
    }))
    loadSectionPage(selectedSection, 0, false, nextSortState)
  }

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
  }

  const handleGlobalKeywordChange = (keyword: string) => {
    setGlobalKeyword(keyword)
    if (keyword.trim()) {
      setActiveView('통합 검색')
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
    setActiveView('설정 조회')
    setSelectedSection(section)
    setGlobalKeyword('')
  }

  const selectView = (view: DashboardView) => {
    setActiveView(view)
    if (view !== '통합 검색') {
      setGlobalKeyword('')
    }
    if (view === '통합 검색') {
      setSelectedSection('SERVER')
    }
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
    loadNextPage,
    loadingServers,
    relationshipLoading,
    relationshipTree,
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
  }
}
