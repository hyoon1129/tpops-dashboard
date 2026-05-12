import './App.css'
import { useEffect, useRef, useState } from 'react'
import { ConfigTable } from './components/ConfigTable'
import { RelationshipMap } from './components/RelationshipMap'
import { SearchResults } from './components/SearchResults'
import { SectionCards } from './components/SectionCards'
import { Sidebar } from './components/Sidebar'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import { useConfigDashboard } from './hooks/useConfigDashboard'

function App() {
  const dashboard = useConfigDashboard()
  const [showTop, setShowTop] = useState(false)
  const [sectionCardsCompact, setSectionCardsCompact] = useState(false)
  const sectionCardsCompactRef = useRef(false)
  const sectionCardsRef = useRef<HTMLElement>(null)
  const tablePanelRef = useRef<HTMLElement>(null)
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

  const handleSectionSelect = (section: Parameters<typeof dashboard.selectSection>[0]) => {
    dashboard.selectSection(section)

    requestAnimationFrame(() => {
      const panel = tablePanelRef.current
      if (!panel) {
        return
      }

      const cardHeight = sectionCardsRef.current?.getBoundingClientRect().height ?? 0
      const panelTop = panel.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: Math.max(panelTop - cardHeight - 12, 0),
        behavior: 'smooth',
      })
    })
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
        onViewChange={dashboard.selectView}
        onCollapsedChange={dashboard.setSidebarCollapsed}
      />

      <section className="workspace">
        <WorkspaceHeader
          globalKeyword={dashboard.globalKeyword}
          onGlobalKeywordChange={dashboard.handleGlobalKeywordChange}
          onServerChange={dashboard.handleServerChange}
          selectedServer={dashboard.selectedServer}
          selectedServerId={dashboard.selectedServerId}
          servers={dashboard.servers}
        />

        {dashboard.activeView !== '구성 트리' && !dashboard.isGlobalSearch ? (
          <SectionCards
            compact={sectionCardsCompact}
            isGlobalSearch={dashboard.isGlobalSearch}
            onSectionSelect={handleSectionSelect}
            ref={sectionCardsRef}
            sections={dashboard.sections}
            selectedSection={dashboard.selectedSection}
          />
        ) : null}

        <section
          className={`panel table-panel${dashboard.activeView === '구성 트리' ? ' relationship-panel' : ''}`}
          ref={tablePanelRef}
        >
          <div className="panel-header table-heading">
            <div>
              <h2>
                {dashboard.activeView === '구성 트리'
                  ? '구성 트리'
                  : dashboard.isGlobalSearch ? '전체 검색 결과' : `${dashboard.currentDefinition.label} 설정`}
              </h2>
              {tableHeadingDescription ? <p>{tableHeadingDescription}</p> : null}
            </div>
            {!dashboard.isGlobalSearch && dashboard.activeView !== '구성 트리' ? (
              <div className="table-actions">
                <div className="table-search">
                  <span aria-hidden="true">/</span>
                  <input
                    value={dashboard.sectionKeyword}
                    onChange={(event) => dashboard.setSectionKeyword(event.target.value)}
                    placeholder="현재 섹션 검색"
                  />
                </div>
                <button type="button">필터</button>
                <button type="button">컬럼</button>
              </div>
            ) : null}
          </div>

          {dashboard.error ? <div className="empty-state">{dashboard.error}</div> : null}
          {dashboard.loadingServers || dashboard.searchLoading ? <div className="empty-state">데이터를 불러오는 중입니다.</div> : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView === '구성 트리' ? (
            <RelationshipMap
              loading={dashboard.relationshipLoading}
              tree={dashboard.relationshipTree}
            />
          ) : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView !== '구성 트리' && dashboard.isGlobalSearch ? (
            <SearchResults
              expandedSections={dashboard.expandedSearchSections}
              groups={dashboard.searchResultsBySection}
              keyword={dashboard.globalKeyword}
              resultCount={dashboard.globalSearchRowTotal}
              searchLoading={dashboard.searchLoading}
              onToggleSection={dashboard.toggleSearchSection}
            />
          ) : null}

          {!dashboard.error && !dashboard.loadingServers && dashboard.activeView !== '구성 트리' && !dashboard.isGlobalSearch ? (
            <ConfigTable
              currentDefinition={dashboard.currentDefinition}
              currentState={dashboard.currentState}
              filteredRows={dashboard.filteredRows}
              onSort={dashboard.handleSort}
              sectionKeyword={dashboard.sectionKeyword}
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
    </main>
  )
}

export default App
