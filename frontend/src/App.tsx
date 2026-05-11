import { useMemo, useState } from 'react'
import './App.css'

type NavItem = {
  label: string
  active?: boolean
}

type Section = {
  label: string
  title: string
  count: number
  note: string
}

type SectionTable = Section & {
  columns: string[]
  rows: Array<Record<string, string | number>>
}

const navItems: NavItem[] = [
  { label: '개요', active: true },
  { label: '설정 조회' },
  { label: '구성 관계' },
  { label: '업무 매핑' },
  { label: '통합 검색' },
  { label: '관리 설정' },
]

const sectionTables: SectionTable[] = [
  {
    label: 'DOMAIN',
    title: '도메인',
    count: 1,
    note: '도메인 기본 설정',
    columns: ['Name', 'DomainId', 'MaxUser', 'TportNo', 'MaxNode'],
    rows: [{ Name: 'TPDOM01', DomainId: 1, MaxUser: 300, TportNo: 8888, MaxNode: 2 }],
  },
  {
    label: 'NODE',
    title: '노드',
    count: 2,
    note: '서버 호스트 단위',
    columns: ['Name', 'Hostname', 'TmaxDir', 'AppDir'],
    rows: [
      { Name: 'COR01', Hostname: 'tp-cor01', TmaxDir: '/app/tmax/cor01', AppDir: '/app/tmax/cor01/appbin' },
      { Name: 'COR02', Hostname: 'tp-cor02', TmaxDir: '/app/tmax/cor02', AppDir: '/app/tmax/cor02/appbin' },
    ],
  },
  {
    label: 'SVRGROUP',
    title: '서버 그룹',
    count: 5,
    note: '업무별 서버 그룹',
    columns: ['Name', 'Node', 'Cousin', 'Backup', 'Load'],
    rows: [
      { Name: 'AAA_SVG', Node: 'COR01', Cousin: 'ABA_SVG', Backup: 'AAA_BAK_SVG', Load: 1 },
      { Name: 'ABA_SVG', Node: 'COR01', Cousin: 'AAA_SVG', Backup: 'ABA_BAK_SVG', Load: 2 },
      { Name: 'ORD_SVG', Node: 'COR02', Cousin: 'PAY_SVG', Backup: 'ORD_BAK_SVG', Load: 1 },
      { Name: 'PAY_SVG', Node: 'COR02', Cousin: 'ORD_SVG', Backup: 'PAY_BAK_SVG', Load: 2 },
      { Name: 'COM_SVG', Node: 'COR01', Cousin: 'ORD_SVG', Backup: 'COM_BAK_SVG', Load: 1 },
    ],
  },
  {
    label: 'SERVER',
    title: '서버',
    count: 6,
    note: '구동 서버 설정',
    columns: ['Name', 'Business', 'Group', 'Node', 'Min', 'Max', 'Services'],
    rows: [
      { Name: 'AAA001SVR', Business: '계좌관리', Group: 'AAA_SVG', Node: 'COR01', Min: 2, Max: 5, Services: 2 },
      { Name: 'AAA002SVR', Business: '계좌관리', Group: 'AAA_SVG', Node: 'COR01', Min: 1, Max: 3, Services: 2 },
      { Name: 'ABA001SVR', Business: '고객관리', Group: 'ABA_SVG', Node: 'COR01', Min: 2, Max: 4, Services: 4 },
      { Name: 'ORD001SVR', Business: '주문관리', Group: 'ORD_SVG', Node: 'COR02', Min: 3, Max: 8, Services: 4 },
      { Name: 'PAY001SVR', Business: '결제관리', Group: 'PAY_SVG', Node: 'COR02', Min: 2, Max: 6, Services: 3 },
      { Name: 'COM001SVR', Business: '공통업무', Group: 'COM_SVG', Node: 'COR01', Min: 1, Max: 4, Services: 2 },
    ],
  },
  {
    label: 'SERVICE',
    title: '서비스',
    count: 17,
    note: '업무 서비스 코드',
    columns: ['Name', 'Business', 'Server', 'SvcTime'],
    rows: [
      { Name: 'SAAA100U', Business: '계좌관리', Server: 'AAA001SVR', SvcTime: 30 },
      { Name: 'SAAA101Q', Business: '계좌관리', Server: 'AAA001SVR', SvcTime: 20 },
      { Name: 'SABA110U', Business: '고객관리', Server: 'ABA001SVR', SvcTime: 30 },
      { Name: 'SORD200U', Business: '주문관리', Server: 'ORD001SVR', SvcTime: 40 },
      { Name: 'SPAY300U', Business: '결제관리', Server: 'PAY001SVR', SvcTime: 35 },
      { Name: 'SCOM900Q', Business: '공통업무', Server: 'COM001SVR', SvcTime: 15 },
    ],
  },
  {
    label: 'GATEWAY',
    title: '게이트웨이',
    count: 2,
    note: '외부 연동 포트',
    columns: ['Name', 'Node', 'Port', 'RemoteAddr', 'RemotePort'],
    rows: [
      { Name: 'GW_COR01', Node: 'COR01', Port: 9101, RemoteAddr: '10.10.20.11', RemotePort: 9201 },
      { Name: 'GW_COR02', Node: 'COR02', Port: 9102, RemoteAddr: '10.10.30.11', RemotePort: 9301 },
    ],
  },
]

function App() {
  const [selectedSection, setSelectedSection] = useState('SERVER')
  const currentTable = useMemo(
    () => sectionTables.find((section) => section.label === selectedSection) ?? sectionTables[0],
    [selectedSection],
  )

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
            <p className="eyebrow">TPDOM01</p>
            <h1>운영 설정 대시보드</h1>
          </div>

          <div className="header-tools" aria-label="조회 조건">
            <select defaultValue="TPDOM01">
              <option value="TPDOM01">TPDOM01</option>
              <option value="COR01">COR01</option>
              <option value="COR02">COR02</option>
            </select>
            <div className="search-box">
              <span aria-hidden="true">/</span>
              <input placeholder="전체 설정에서 검색" />
            </div>
          </div>
        </header>

        <section className="section-card-grid" aria-label="설정 섹션 요약">
          {sectionTables.map((section) => (
            <button
              key={section.label}
              type="button"
              className={section.label === selectedSection ? 'section-card active' : 'section-card'}
              onClick={() => setSelectedSection(section.label)}
            >
              <span>{section.label}</span>
              <strong>{section.count}</strong>
            </button>
          ))}
        </section>

        <section className="panel table-panel">
          <div className="panel-header table-heading">
            <div>
              <h2>{currentTable.title} 설정</h2>
              <p>
                {currentTable.label} 섹션 · 총 {currentTable.count}건
              </p>
            </div>
            <div className="table-actions">
              <button type="button">필터</button>
              <button type="button">컬럼</button>
            </div>
          </div>

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
                {currentTable.rows.map((row) => (
                  <tr key={String(row.Name)}>
                    {currentTable.columns.map((column) => (
                      <td key={column}>{column === 'Name' ? <strong>{row[column]}</strong> : row[column]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
