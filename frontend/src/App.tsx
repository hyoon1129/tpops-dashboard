import { useEffect, useMemo, useState } from 'react'
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

type SectionTable = {
  label: SectionKey
  title: string
  endpoint: string
  columns: string[]
  rows: Array<Record<string, TableValue>>
}

type ApiState = {
  loading: boolean
  error: string | null
}

const navItems: NavItem[] = [
  { label: '개요', active: true },
  { label: '설정 조회' },
  { label: '구성 관계' },
  { label: '업무 매핑' },
  { label: '통합 검색' },
  { label: '관리 설정' },
]

const sectionDefinitions: Array<Omit<SectionTable, 'rows'>> = [
  {
    label: 'DOMAIN',
    title: '도메인',
    endpoint: 'domains',
    columns: ['Name', 'DomainId', 'MaxUser', 'TportNo', 'MaxNode'],
  },
  {
    label: 'NODE',
    title: '노드',
    endpoint: 'nodes',
    columns: ['Name', 'Hostname', 'TmaxDir', 'AppDir', 'NodeType', 'MaxGwCpc'],
  },
  {
    label: 'SVRGROUP',
    title: '서버 그룹',
    endpoint: 'svrgroups',
    columns: ['Name', 'Node', 'Cousin', 'Backup', 'Load', 'EnvFile'],
  },
  {
    label: 'SERVER',
    title: '서버',
    endpoint: 'server-configs',
    columns: ['Name', 'Group', 'Type', 'Min', 'Max', 'Restart', 'MaxRestart', 'GPeriod'],
  },
  {
    label: 'SERVICE',
    title: '서비스',
    endpoint: 'services',
    columns: ['Name', 'Business', 'Server', 'SvcTime'],
  },
  {
    label: 'GATEWAY',
    title: '게이트웨이',
    endpoint: 'gateways',
    columns: ['Name', 'Type', 'Node', 'Port', 'RemoteAddr', 'RemotePort'],
  },
]

const toTableRows: Record<SectionKey, (items: Array<Record<string, TableValue>>) => SectionTable['rows']> = {
  DOMAIN: (items) =>
    items.map((item) => ({
      Name: item.domainName,
      DomainId: item.domainId,
      MaxUser: item.maxuser,
      TportNo: item.tportno,
      MaxNode: item.maxnode,
    })),
  NODE: (items) =>
    items.map((item) => ({
      Name: item.nodeName,
      Hostname: item.hostname,
      TmaxDir: item.tmaxdir,
      AppDir: item.appdir,
      NodeType: item.nodetype,
      MaxGwCpc: item.maxgwcpc,
    })),
  SVRGROUP: (items) =>
    items.map((item) => ({
      Name: item.svrgroupName,
      Node: item.nodename,
      Cousin: item.cousin,
      Backup: item.backup,
      Load: item.loadValue,
      EnvFile: item.envfile,
    })),
  SERVER: (items) =>
    items.map((item) => ({
      Name: item.serverName,
      Group: item.svgname,
      Type: item.svrtype,
      Min: item.minValue,
      Max: item.maxValue,
      Restart: item.restart,
      MaxRestart: item.maxrstart,
      GPeriod: item.gperiod,
    })),
  SERVICE: (items) =>
    items.map((item) => ({
      Name: item.serviceName,
      Business: item.businessName ?? item.businessCode,
      Server: item.svrname,
      SvcTime: item.svctime,
    })),
  GATEWAY: (items) =>
    items.map((item) => ({
      Name: item.gatewayName,
      Type: item.gwtype,
      Node: item.nodename,
      Port: item.portno,
      RemoteAddr: item.rgwaddr,
      RemotePort: item.rgwportno,
    })),
}

function App() {
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<SectionKey>('SERVER')
  const [keyword, setKeyword] = useState('')
  const [tables, setTables] = useState<SectionTable[]>(
    sectionDefinitions.map((section) => ({ ...section, rows: [] })),
  )
  const [apiState, setApiState] = useState<ApiState>({ loading: true, error: null })

  useEffect(() => {
    let ignore = false

    async function loadServers() {
      try {
        setApiState({ loading: true, error: null })
        const response = await fetch('/api/servers')
        if (!response.ok) {
          throw new Error('서버 목록을 불러오지 못했습니다.')
        }
        const data = (await response.json()) as ServerInfo[]
        if (ignore) {
          return
        }
        setServers(data)
        setSelectedServerId((currentServerId) => currentServerId ?? data[0]?.serverId ?? null)
        if (data.length === 0) {
          setApiState({ loading: false, error: '조회할 서버가 없습니다.' })
        }
      } catch (error) {
        if (!ignore) {
          setApiState({ loading: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' })
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

    let ignore = false

    async function loadSectionTables() {
      try {
        setApiState({ loading: true, error: null })
        const nextTables = await Promise.all(
          sectionDefinitions.map(async (section) => {
            const response = await fetch(`/api/servers/${selectedServerId}/${section.endpoint}`)
            if (!response.ok) {
              throw new Error(`${section.title} 설정을 불러오지 못했습니다.`)
            }
            const items = (await response.json()) as Array<Record<string, TableValue>>
            return {
              ...section,
              rows: toTableRows[section.label](items),
            }
          }),
        )
        if (!ignore) {
          setTables(nextTables)
          setApiState({ loading: false, error: null })
        }
      } catch (error) {
        if (!ignore) {
          setApiState({ loading: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' })
        }
      }
    }

    loadSectionTables()

    return () => {
      ignore = true
    }
  }, [selectedServerId])

  const selectedServer = servers.find((server) => server.serverId === selectedServerId) ?? null
  const currentTable = useMemo(
    () => tables.find((section) => section.label === selectedSection) ?? tables[0],
    [selectedSection, tables],
  )
  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) {
      return currentTable.rows
    }
    return currentTable.rows.filter((row) =>
      currentTable.columns.some((column) =>
        String(row[column] ?? '').toLowerCase().includes(normalizedKeyword),
      ),
    )
  }, [currentTable, keyword])

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
              onChange={(event) => setSelectedServerId(Number(event.target.value))}
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
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="현재 섹션에서 검색"
              />
            </div>
          </div>
        </header>

        <section className="section-card-grid" aria-label="설정 섹션 요약">
          {tables.map((section) => (
            <button
              key={section.label}
              type="button"
              className={section.label === selectedSection ? 'section-card active' : 'section-card'}
              onClick={() => setSelectedSection(section.label)}
            >
              <span>{section.label}</span>
              <strong>{section.rows.length}</strong>
            </button>
          ))}
        </section>

        <section className="panel table-panel">
          <div className="panel-header table-heading">
            <div>
              <h2>{currentTable.title} 설정</h2>
              <p>
                {currentTable.label} 섹션 · 총 {currentTable.rows.length}건
                {keyword.trim() ? ` · 검색 결과 ${filteredRows.length}건` : ''}
              </p>
            </div>
            <div className="table-actions">
              <button type="button">필터</button>
              <button type="button">컬럼</button>
            </div>
          </div>

          {apiState.error ? <div className="empty-state">{apiState.error}</div> : null}
          {apiState.loading ? <div className="empty-state">설정 데이터를 불러오는 중입니다.</div> : null}

          {!apiState.error && !apiState.loading ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {currentTable.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, rowIndex) => (
                    <tr key={`${String(row.Name)}-${rowIndex}`}>
                      {currentTable.columns.map((column) => (
                        <td key={column}>{column === 'Name' ? <strong>{row[column] ?? '-'}</strong> : row[column] ?? '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length === 0 ? <div className="empty-state">표시할 데이터가 없습니다.</div> : null}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

export default App
