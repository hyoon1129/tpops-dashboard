import type { ServerInfo } from '../types/config'

type WorkspaceHeaderProps = {
  environments: string[]
  globalKeyword: string
  onEnvironmentChange: (environment: string) => void
  onGlobalKeywordChange: (keyword: string) => void
  onServerChange: (serverId: number) => void
  selectedEnvironment: string
  selectedServer: ServerInfo | null
  servers: ServerInfo[]
}

export function WorkspaceHeader({
  environments,
  globalKeyword,
  onEnvironmentChange,
  onGlobalKeywordChange,
  onServerChange,
  selectedEnvironment,
  selectedServer,
  servers,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-title">
        <p className="eyebrow">{selectedServer?.environment ?? 'TPOPS'}</p>
        <h1>{selectedServer?.serverName ?? '운영 설정 대시보드'}</h1>
      </div>

      <div className="header-tools" aria-label="조회 조건">
        <div className="header-select-group">
          <label htmlFor="environment-select">환경</label>
          <select
            id="environment-select"
            value={selectedEnvironment}
            onChange={(event) => onEnvironmentChange(event.target.value)}
            disabled={environments.length === 0}
          >
            {environments.map((environment) => (
              <option key={environment} value={environment}>
                {environment}
              </option>
            ))}
          </select>
        </div>

        <div className="header-select-group server-select-group">
          <label htmlFor="server-select">서버</label>
          <select
            id="server-select"
            value={selectedServer?.serverId ?? ''}
            onChange={(event) => onServerChange(Number(event.target.value))}
            disabled={servers.length === 0}
          >
            {servers.map((server) => (
              <option key={server.serverId} value={server.serverId}>
                {server.serverName}
              </option>
            ))}
          </select>
        </div>

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
