import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type NavItem = {
  label: string
  active?: boolean
}

type ServerInfo = {
  serverId: number
  serverName: string
  serverIp: string
  environment: string
  description: string | null
}

type SectionKey = 'DOMAIN' | 'NODE' | 'SVRGROUP' | 'SERVER' | 'SERVICE' | 'GATEWAY'
type TableValue = string | number | null | undefined

type Column = {
  key: string
  label: string
}

type SectionDefinition = {
  label: SectionKey
  title: string
  endpoint: string
  columns: Column[]
  toRows: (items: Array<Record<string, TableValue>>) => TableRow[]
}

type TableRow = Record<string, TableValue>

type PageResponse = {
  content: Array<Record<string, TableValue>>
  page: number
  totalElements: number
  last: boolean
}

type SectionState = {
  rows: TableRow[]
  total: number
  page: number
  last: boolean
  loading: boolean
}

type SearchResult = {
  section: SectionKey
  name: string
  related: string | null
  matchedField: string
  value: string | null
}

const pageSize = 100

const navItems: NavItem[] = [
  { label: '개요', active: true },
  { label: '설정 조회' },
  { label: '구성 관계' },
  { label: '업무 매핑' },
  { label: '통합 검색' },
  { label: '관리 설정' },
]

const pick = (item: Record<string, TableValue>, keys: string[]) =>
  keys.reduce<TableRow>((row, key) => {
    row[key] = item[key]
    return row
  }, {})

const sectionDefinitions: SectionDefinition[] = [
  {
    label: 'DOMAIN',
    title: '도메인',
    endpoint: 'domains',
    columns: [
      'domainName', 'domainId', 'shmkey', 'maxuser', 'minclh', 'maxclh', 'tportno', 'racport',
      'blocktime', 'maxsvg', 'maxsvr', 'maxspr', 'maxsvc', 'maxsacall', 'maxcacall',
      'maxtotalsvg', 'maxgw', 'maxcpc', 'maxcousin', 'maxcousinsvg', 'gwchkint',
      'gwconnectTimeout', 'nclhchktime', 'nliveinq', 'ipcperm', 'maxnode', 'startLine', 'endLine',
    ].map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[0].columns.map((column) => column.key))),
  },
  {
    label: 'NODE',
    title: '노드',
    endpoint: 'nodes',
    columns: [
      'nodeName', 'hostname', 'tmaxdir', 'appdir', 'tmaxhome', 'pathdir', 'tlogdir', 'ulogdir',
      'slogdir', 'nodetype', 'autobackup', 'maxgwcpc', 'maxgwsvr', 'clhopt', 'startLine', 'endLine',
    ].map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[1].columns.map((column) => column.key))),
  },
  {
    label: 'SVRGROUP',
    title: '서버 그룹',
    endpoint: 'svrgroups',
    columns: ['svrgroupName', 'nodename', 'cousin', 'loadValue', 'backup', 'envfile', 'startLine', 'endLine']
      .map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[2].columns.map((column) => column.key))),
  },
  {
    label: 'SERVER',
    title: '서버',
    endpoint: 'server-configs',
    columns: [
      'serverName', 'svgname', 'svrtype', 'clopt', 'minValue', 'maxValue', 'target', 'schedule',
      'maxqcount', 'cpc', 'asqcount', 'restart', 'maxrstart', 'gperiod', 'startLine', 'endLine',
    ].map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[3].columns.map((column) => column.key))),
  },
  {
    label: 'SERVICE',
    title: '서비스',
    endpoint: 'services',
    columns: ['serviceName', 'svrname', 'svctime', 'businessCode', 'businessName', 'startLine', 'endLine']
      .map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[4].columns.map((column) => column.key))),
  },
  {
    label: 'GATEWAY',
    title: '게이트웨이',
    endpoint: 'gateways',
    columns: [
      'gatewayName', 'gwtype', 'nodename', 'portno', 'rgwportno', 'rgwaddr', 'cpc', 'clopt',
      'loadValue', 'backupRgwaddr', 'backupRgwportno', 'startLine', 'endLine',
    ].map((key) => ({ key, label: key })),
    toRows: (items) => items.map((item) => pick(item, sectionDefinitions[5].columns.map((column) => column.key))),
  },
]

const initialSections = () =>
  sectionDefinitions.reduce<Record<SectionKey, SectionState>>((states, section) => {
    states[section.label] = { rows: [], total: 0, page: -1, last: false, loading: false }
    return states
  }, {} as Record<SectionKey, SectionState>)

function App() {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<SectionKey>('SERVER')
  const [globalKeyword, setGlobalKeyword] = useState('')
  const [sectionKeyword, setSectionKeyword] = useState('')
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(initialSections)
  const [loadingServers, setLoadingServers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const currentDefinition = sectionDefinitions.find((section) => section.label === selectedSection) ?? sectionDefinitions[0]
  const currentState = sections[selectedSection]
  const selectedServer = servers.find((server) => server.serverId === selectedServerId) ?? null
  const isGlobalSearch = globalKeyword.trim().length > 0

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

  const loadSectionPage = useCallback(async (sectionKey: SectionKey, page: number, append: boolean) => {
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
      const response = await fetch(`/api/servers/${selectedServerId}/${definition.endpoint}/page?page=${page}&size=${pageSize}`)
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
        setSearchResults((await response.json()) as SearchResult[])
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
    loadSectionPage(selectedSection, currentState.page + 1, true)
  }

  const handleServerChange = (serverId: number) => {
    setSelectedServerId(serverId)
    setSections(initialSections())
    setSectionKeyword('')
    setGlobalKeyword('')
    setSearchResults([])
    setSearchLoading(false)
  }

  const handleGlobalKeywordChange = (keyword: string) => {
    setGlobalKeyword(keyword)
    if (!keyword.trim()) {
      setSearchResults([])
      setSearchLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="대시보드 메뉴">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>TPOps</strong>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <button key={item.label} type="button" className={item.active ? 'active' : ''}>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">{selectedServer?.environment ?? 'TPOPS'}</p>
            <h1>{selectedServer?.serverName ?? '운영 설정 대시보드'}</h1>
          </div>

          <div className="header-tools" aria-label="조회 조건">
            <select
              value={selectedServerId ?? ''}
              onChange={(event) => handleServerChange(Number(event.target.value))}
            >
              {servers.map((server) => (
                <option key={server.serverId} value={server.serverId}>
                  {server.serverName}
                </option>
              ))}
            </select>
            <div className="search-box">
              <span aria-hidden="true">/</span>
              <input
                value={globalKeyword}
                onChange={(event) => handleGlobalKeywordChange(event.target.value)}
                placeholder="전체 설정에서 검색"
              />
            </div>
          </div>
        </header>

        <section className="section-card-grid" aria-label="설정 섹션 요약">
          {sectionDefinitions.map((section) => (
            <button
              key={section.label}
              type="button"
              className={section.label === selectedSection && !isGlobalSearch ? 'section-card active' : 'section-card'}
              onClick={() => {
                setSelectedSection(section.label)
                setGlobalKeyword('')
              }}
            >
              <span>{section.label}</span>
              <strong>{sections[section.label].total}</strong>
            </button>
          ))}
        </section>

        <section className="panel table-panel">
          <div className="panel-header table-heading">
            <div>
              <h2>{isGlobalSearch ? '전체 검색 결과' : `${currentDefinition.title} 설정`}</h2>
              <p>
                {isGlobalSearch
                  ? `전체 섹션 · 검색 결과 ${searchResults.length}건`
                  : `${currentDefinition.label} 섹션 · 총 ${currentState.total}건 · 표시 ${filteredRows.length}건`}
              </p>
            </div>
            {!isGlobalSearch ? (
              <div className="table-actions">
                <div className="table-search">
                  <span aria-hidden="true">/</span>
                  <input
                    value={sectionKeyword}
                    onChange={(event) => setSectionKeyword(event.target.value)}
                    placeholder="현재 섹션 검색"
                  />
                </div>
                <button type="button">필터</button>
                <button type="button">컬럼</button>
              </div>
            ) : null}
          </div>

          {error ? <div className="empty-state">{error}</div> : null}
          {loadingServers || searchLoading ? <div className="empty-state">데이터를 불러오는 중입니다.</div> : null}

          {!error && !loadingServers && isGlobalSearch ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>section</th>
                    <th>name</th>
                    <th>related</th>
                    <th>matchedField</th>
                    <th>value</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, index) => (
                    <tr key={`${result.section}-${result.name}-${result.matchedField}-${index}`}>
                      <td>{result.section}</td>
                      <td><strong>{result.name}</strong></td>
                      <td>{result.related ?? '-'}</td>
                      <td>{result.matchedField}</td>
                      <td>{result.value ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!searchLoading && searchResults.length === 0 ? <div className="empty-state">검색 결과가 없습니다.</div> : null}
            </div>
          ) : null}

          {!error && !loadingServers && !isGlobalSearch ? (
            <div
              className="table-scroll"
              onScroll={(event) => {
                const target = event.currentTarget
                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 80) {
                  loadNextPage()
                }
              }}
            >
              <table>
                <thead>
                  <tr>
                    {currentDefinition.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, rowIndex) => (
                    <tr key={`${String(row[currentDefinition.columns[0].key])}-${rowIndex}`}>
                      {currentDefinition.columns.map((column, columnIndex) => (
                        <td key={column.key}>
                          {columnIndex === 0 ? <strong>{row[column.key] ?? '-'}</strong> : row[column.key] ?? '-'}
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
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default App
