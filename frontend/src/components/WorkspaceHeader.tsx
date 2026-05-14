import type { ServerInfo } from '../types/config'

type WorkspaceHeaderProps = {
  globalKeyword: string
  onGlobalKeywordChange: (keyword: string) => void
  selectedServer: ServerInfo | null
}

export function WorkspaceHeader({
  globalKeyword,
  onGlobalKeywordChange,
  selectedServer,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <p className="eyebrow">{selectedServer?.environment ?? 'TPOPS'}</p>
        <h1>{selectedServer?.serverName ?? '운영 설정 대시보드'}</h1>
      </div>

      <div className="header-tools" aria-label="조회 조건">
        <div className="search-box">
          <span aria-hidden="true">/</span>
          <input
            value={globalKeyword}
            onChange={(event) => onGlobalKeywordChange(event.target.value)}
            placeholder="전체 설정에서 검색"
          />
          {globalKeyword ? (
            <button
              type="button"
              className="search-clear"
              aria-label="전체 검색어 지우기"
              onClick={() => onGlobalKeywordChange('')}
            >
              x
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
