import type { ServerInfo } from '../types/config'

type WorkspaceHeaderProps = {
  globalKeyword: string
  onGlobalKeywordChange: (keyword: string) => void
  onServerChange: (serverId: number) => void
  selectedServer: ServerInfo | null
  selectedServerId: number | null
  servers: ServerInfo[]
}

export function WorkspaceHeader({
  globalKeyword,
  onGlobalKeywordChange,
  onServerChange,
  selectedServer,
  selectedServerId,
  servers,
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div>
        <p className="eyebrow">{selectedServer?.environment ?? 'TPOPS'}</p>
        <h1>{selectedServer?.serverName ?? '운영 설정 대시보드'}</h1>
      </div>

      <div className="header-tools" aria-label="조회 조건">
        <select
          value={selectedServerId ?? ''}
          onChange={(event) => onServerChange(Number(event.target.value))}
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
            onChange={(event) => onGlobalKeywordChange(event.target.value)}
            placeholder="전체 설정에서 검색"
          />
        </div>
      </div>
    </header>
  )
}
