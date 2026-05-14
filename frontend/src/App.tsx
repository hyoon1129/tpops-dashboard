import './App.css'
import { useEffect, useRef, useState } from 'react'
import { exportSectionToExcel } from './utils/exportExcel'
import { ConfigUploadPage } from './components/ConfigUploadPage'
import { ConfigRelationPanel, type ConfigRelationSelection } from './components/ConfigRelationPanel'
import { ConfigTable } from './components/ConfigTable'
import { RelationshipMap } from './components/RelationshipMap'
import { SearchResults } from './components/SearchResults'
import { SectionCards } from './components/SectionCards'
import { ServiceMetricsPage } from './components/ServiceMetricsPage'
import { Sidebar } from './components/Sidebar'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useConfigDashboard } from './hooks/useConfigDashboard'

function App() {
  const dashboard = useConfigDashboard()
  const [showTop, setShowTop] = useState(false)
  const [sectionCardsCompact, setSectionCardsCompact] = useState(false)
  const [relationSelection, setRelationSelection] = useState<ConfigRelationSelection | null>(null)
  const [relationPanelOpen, setRelationPanelOpen] = useState(false)
  const sectionCardsCompactRef = useRef(false)
  const relationOpenRafRef = useRef<number | null>(null)
  const tableHeadingDescription = dashboard.activeView === '구성 트리'
    ? 'NODE → SVRGROUP → SERVER → SERVICE 연결 구조'
    : dashboard.isGlobalSearch
    ? `전체 섹션 · 검색 결과 ${dashboard.globalSearchRowTotal}건`
    : null

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 400)
      const shouldCompact = sectionCardsCompactRef.current
        ? window.scrollY > 80
        : window.scrollY > 220
      if (shouldCompact !== sectionCardsCompactRef.current) {
        sectionCardsCompactRef.current = shouldCompact
        setSectionCardsCompact(shouldCompact)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => () => {
    if (relationOpenRafRef.current) {
      cancelAnimationFrame(relationOpenRafRef.current)
    }
  }, [])

  const openRelationPanel = (selection: ConfigRelationSelection) => {
    setRelationSelection(selection)
    if (relationPanelOpen) {
      return
    }

    if (relationOpenRafRef.current) {
      cancelAnimationFrame(relationOpenRafRef.current)
    }
    relationOpenRafRef.current = requestAnimationFrame(() => {
      setRelationPanelOpen(true)
      relationOpenRafRef.current = null
    })
  }

  const handleSectionSelect = (section: Parameters<typeof dashboard.selectSection>[0]) => {
    dashboard.selectSection(section)
    setRelationPanelOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleRelationSelect = (selection: ConfigRelationSelection) => {
    dashboard.selectSection(selection.section)
    openRelationPanel(selection)
  }

  const handleViewChange = (view: Parameters<typeof dashboard.selectView>[0]) => {
    dashboard.selectView(view)
    if (view !== '설정 목록') {
      setRelationPanelOpen(false)
    }
  }

  const handleGlobalKeywordChange = (keyword: string) => {
    dashboard.handleGlobalKeywordChange(keyword)
    if (keyword.trim()) {
      setRelationPanelOpen(false)
    }
  }

  return (
    <main
      className={[
        'app-shell',
        dashboard.sidebarCollapsed ? 'sidebar-collapsed' : '',
        dashboard.initialDataLoading && !dashboard.error ? 'is-loading' : '',
      ].filter(Boolean).join(' ')}
      aria-busy={dashboard.initialDataLoading && !dashboard.error}
    >
      <Sidebar
        activeView={dashboard.activeView}
        collapsed={dashboard.sidebarCollapsed}
        onViewChange={handleViewChange}
        onCollapsedChange={dashboard.setSidebarCollapsed}
      />

      <section className="workspace">
        <WorkspaceHeader
          globalKeyword={dashboard.globalKeyword}
          onGlobalKeywordChange={handleGlobalKeywordChange}
          selectedServer={dashboard.selectedServer}
        />

        {dashboard.activeView === '설정 목록' && !dashboard.isGlobalSearch ? (
          <SectionCards
            compact={sectionCardsCompact}
            isGlobalSearch={dashboard.isGlobalSearch}
            onSectionSelect={handleSectionSelect}
            sections={dashboard.sections}
            selectedSection={dashboard.selectedSection}
          />
        ) : null}

        <section
          className={`panel table-panel${dashboard.activeView === '구성 트리' ? ' relationship-panel' : ''}`}
        >
          <div className="panel-header table-heading">
            <div>
              <h2>
                {dashboard.activeView === '구성 트리'
                  ? '구성 트리'
                  : dashboard.activeView === '서비스 응답시간'
                  ? '서비스 응답시간'
                  : dashboard.activeView === '설정 관리'
                  ? '설정 관리'
                  : dashboard.isGlobalSearch ? '전체 검색 결과' : `${dashboard.currentDefinition.label} 설정`}
              </h2>
              {tableHeadingDescription ? <p>{tableHeadingDescription}</p> : null}
            </div>
            {!dashboard.isGlobalSearch && dashboard.activeView === '설정 목록' ? (
              <div className="table-actions">
                <div className="table-search">
                  <span aria-hidden="true">/</span>
                  <input
                    value={dashboard.sectionKeyword}
                    onChange={(event) => dashboard.setSectionKeyword(event.target.value)}
                    placeholder={`${dashboard.selectedSection} 내 검색`}
                  />
                  {dashboard.sectionKeyword ? (
                    <button
                      type="button"
                      className="table-search-clear"
                      aria-label="섹션 검색어 지우기"
                      onClick={() => dashboard.setSectionKeyword('')}
                    >
                      x
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="export-btn"
                  aria-label="섹션 전체 엑셀로 내보내기"
                  disabled={dashboard.filteredRows.length === 0}
                  onClick={() => exportSectionToExcel(dashboard.selectedSection, dashboard.filteredRows, dashboard.sections)}
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 13V3M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 15h14v2H3v-2z" fill="currentColor" />
                  </svg>
                  내보내기
                </button>
              </div>
            ) : null}
          </div>

          {dashboard.error && dashboard.activeView !== '서비스 응답시간' ? <div className="empty-state">{dashboard.error}</div> : null}
          {dashboard.activeView !== '서비스 응답시간' && (dashboard.loadingServers || dashboard.searchLoading) ? <div className="empty-state">데이터를 불러오는 중입니다.</div> : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView === '구성 트리' ? (
            <RelationshipMap
              loading={dashboard.relationshipLoading}
              tree={dashboard.relationshipTree}
            />
          ) : null}

          {dashboard.activeView === '서비스 응답시간' ? (
            <ServiceMetricsPage />
          ) : null}

          {dashboard.activeView === '설정 관리' ? (
            <ConfigUploadPage
              key={dashboard.selectedServerId ?? 'no-server'}
              onParsed={dashboard.reloadDashboard}
              onServerUpdate={dashboard.updateSelectedServer}
              selectedServer={dashboard.selectedServer}
            />
          ) : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView === '설정 목록' && dashboard.isGlobalSearch ? (
            <SearchResults
              expandedSections={dashboard.expandedSearchSections}
              groups={dashboard.searchResultsBySection}
              keyword={dashboard.globalKeyword}
              resultCount={dashboard.globalSearchRowTotal}
              searchLoading={dashboard.searchLoading}
              onNameClick={(section, row) => openRelationPanel({ row, section })}
              onToggleSection={dashboard.toggleSearchSection}
            />
          ) : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView === '설정 목록' && !dashboard.isGlobalSearch ? (
            <ConfigTable
              currentDefinition={dashboard.currentDefinition}
              currentState={dashboard.currentState}
              filteredRows={dashboard.filteredRows}
              onNameClick={(row) => openRelationPanel({ row, section: dashboard.selectedSection })}
              onSort={dashboard.handleSort}
              sectionKeyword={dashboard.deferredSectionKeyword}
              selectedSection={dashboard.selectedSection}
              sortState={dashboard.sortState}
            />
          ) : null}
        </section>
      </section>
      {showTop && (
        <button
          type="button"
          className="scroll-top-btn"
          aria-label="맨 위로"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 15V5M10 5L5 10M10 5L15 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {dashboard.initialDataLoading && !dashboard.error ? (
        <div className="app-loading-overlay">
          <div className="app-loading-indicator" aria-live="polite" aria-label="데이터를 불러오는 중">
            <div className="loading-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>데이터 불러오는 중</p>
          </div>
        </div>
      ) : null}
      <ConfigRelationPanel
        key={relationSelection ? `${relationSelection.section}:${String(relationSelection.row.NAME ?? '')}` : 'empty'}
        onClose={() => setRelationPanelOpen(false)}
        onSelectRelated={handleRelationSelect}
        open={relationPanelOpen}
        sections={dashboard.sections}
        selection={relationSelection}
      />
      {relationSelection ? (
        <button
          type="button"
          className={relationPanelOpen ? 'config-relation-backdrop open' : 'config-relation-backdrop'}
          aria-label="관계 패널 닫기"
          onClick={() => setRelationPanelOpen(false)}
        />
      ) : null}
    </main>
  )
}

export default App
