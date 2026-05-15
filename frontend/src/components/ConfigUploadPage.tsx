import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConfigFileDetail, ConfigFileHistory, ServerInfo } from '../types/config'

type ConfigUploadPageProps = {
  onParsed: () => Promise<void>
  onServerCreate: (server: ServerInfo) => void
  onServerUpdate: (server: ServerInfo) => void
  selectedServer: ServerInfo | null
}

const statusLabels: Record<ConfigFileHistory['parseStatus'], string> = {
  FAILED: '실패',
  PENDING: '대기',
  SKIPPED: '건너뜀',
  SUCCESS: '성공',
}

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '-'
  }
  return new Date(value).toLocaleString('ko-KR', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function ConfigUploadPage({ onParsed, onServerCreate, onServerUpdate, selectedServer }: ConfigUploadPageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [serverName, setServerName] = useState(selectedServer?.serverName ?? '')
  const [environment, setEnvironment] = useState(selectedServer?.environment ?? '')
  const [history, setHistory] = useState<ConfigFileHistory[]>([])
  const [fileDetail, setFileDetail] = useState<ConfigFileDetail | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingFileDetail, setLoadingFileDetail] = useState(false)
  const [savingServer, setSavingServer] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newServerName, setNewServerName] = useState('')
  const [newServerIp, setNewServerIp] = useState('')
  const [newEnvironment, setNewEnvironment] = useState('')
  const [creatingServer, setCreatingServer] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!selectedServer) {
      setHistory([])
      return []
    }

    try {
      setLoadingHistory(true)
      setError(null)
      const response = await fetch(`/api/servers/${selectedServer.serverId}/config-files`)
      if (!response.ok) {
        throw new Error('파싱 이력을 불러오지 못했습니다.')
      }
      const items = (await response.json()) as ConfigFileHistory[]
      setHistory(items)
      return items
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
      return []
    } finally {
      setLoadingHistory(false)
    }
  }, [selectedServer])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHistory()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadHistory])

  const parseSelectedFile = async () => {
    if (!selectedServer || !selectedFile) {
      return
    }

    try {
      setUploading(true)
      setMessage(null)
      setError(null)
      const body = new FormData()
      body.append('file', selectedFile)
      const response = await fetch(`/api/servers/${selectedServer.serverId}/config-files/parse`, {
        method: 'POST',
        body,
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
      const parsed = (await response.json()) as ConfigFileHistory
      setHistory((current) => {
        const withoutParsed = current.filter((item) => item.fileId !== parsed.fileId)
        return [parsed, ...withoutParsed]
      })
      setMessage(`${parsed.fileName} 파싱이 완료됐습니다.`)
      setSelectedFile(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      await onParsed()
      await loadHistory()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '설정 파일 파싱에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const saveServerDisplay = async () => {
    if (!selectedServer) {
      return
    }
    if (!serverName.trim()) {
      setError('대시보드 이름을 입력해주세요.')
      return
    }

    try {
      setSavingServer(true)
      setMessage(null)
      setError(null)
      const response = await fetch(`/api/servers/${selectedServer.serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: serverName.trim(),
          serverIp: selectedServer.serverIp,
          environment: environment.trim(),
          description: selectedServer.description,
        }),
      })
      if (!response.ok) {
        throw new Error('대시보드 이름을 저장하지 못했습니다.')
      }
      onServerUpdate((await response.json()) as ServerInfo)
      setMessage('대시보드 표시 설정을 저장했습니다.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setSavingServer(false)
    }
  }

  const openFileDetail = async (file: ConfigFileHistory) => {
    if (!selectedServer) {
      return
    }

    try {
      setLoadingFileDetail(true)
      setError(null)
      const response = await fetch(`/api/servers/${selectedServer.serverId}/config-files/${file.fileId}`)
      if (!response.ok) {
        throw new Error('원본 파일을 불러오지 못했습니다.')
      }
      setFileDetail((await response.json()) as ConfigFileDetail)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoadingFileDetail(false)
    }
  }

  const createServer = async () => {
    if (!newServerName.trim()) {
      setError('대시보드 이름을 입력해주세요.')
      return
    }
    try {
      setCreatingServer(true)
      setError(null)
      const response = await fetch('/api/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverName: newServerName.trim(),
          serverIp: newServerIp.trim() || null,
          environment: newEnvironment.trim() || null,
          description: null,
        }),
      })
      if (!response.ok) {
        throw new Error('서버를 등록하지 못했습니다.')
      }
      onServerCreate((await response.json()) as ServerInfo)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setCreatingServer(false)
    }
  }

  if (!selectedServer) {
    return (
      <div className="config-upload-page">
        <section className="upload-settings-section">
          <div className="upload-section-header">
            <span>NEW SERVER</span>
            <h3>서버 등록</h3>
            <p>설정 파일을 업로드할 서버를 먼저 등록해주세요.</p>
          </div>
          <div className="upload-section-row2">
            <label htmlFor="new-server-env" className="upload-field-env">환경</label>
            <label htmlFor="new-server-ip" className="upload-field-env">서버 IP</label>
            <label htmlFor="new-server-name" className="upload-field-name">대시보드 이름 *</label>
          </div>
          <div className="upload-inline-row">
            <input
              id="new-server-env"
              className="upload-field-env"
              value={newEnvironment}
              onChange={(e) => setNewEnvironment(e.target.value)}
              placeholder="예: 개발"
            />
            <input
              id="new-server-ip"
              className="upload-field-env"
              value={newServerIp}
              onChange={(e) => setNewServerIp(e.target.value)}
              placeholder="예: 10.0.0.1"
            />
            <input
              id="new-server-name"
              className="upload-field-name"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              placeholder="예: 계정계 테스트"
            />
            <button
              type="button"
              onClick={createServer}
              disabled={!newServerName.trim() || creatingServer}
            >
              {creatingServer ? '등록 중…' : '서버 등록'}
            </button>
          </div>
          {error ? <div className="upload-message error">{error}</div> : null}
        </section>
      </div>
    )
  }

  const serverDisplayChanged = serverName.trim() !== selectedServer.serverName
    || environment.trim() !== (selectedServer.environment ?? '')

  return (
    <div className="config-upload-page">
      <div className="upload-settings-row">
        <section className="upload-settings-section">
          <div className="upload-section-header">
            <span>DISPLAY</span>
            <h3>대시보드 표시 설정</h3>
            <p>상단에 표시되는 환경과 이름을 수정합니다.</p>
          </div>
          <div className="upload-section-row2">
            <label htmlFor="upload-env" className="upload-field-env">환경</label>
            <label htmlFor="upload-name" className="upload-field-name">대시보드 이름</label>
          </div>
          <div className="upload-inline-row">
            <input
              id="upload-env"
              className="upload-field-env"
              value={environment}
              onChange={(event) => setEnvironment(event.target.value)}
              placeholder="예: 개발"
            />
            <input
              id="upload-name"
              className="upload-field-name"
              value={serverName}
              onChange={(event) => setServerName(event.target.value)}
              placeholder="예: 계정계 테스트"
            />
            <button
              type="button"
              onClick={saveServerDisplay}
              disabled={!serverDisplayChanged || !serverName.trim() || savingServer}
            >
              {savingServer ? '저장 중' : '저장'}
            </button>
          </div>
        </section>

        <section className="upload-settings-section">
          <div className="upload-section-header">
            <span>CONFIG FILE</span>
            <h3>m 파일 업로드</h3>
            <p>설정 파일을 업로드하면 파싱 후 대시보드 데이터가 갱신됩니다.</p>
          </div>
          <p className="upload-section-hint">*.m 형식의 파일만 허용됩니다.</p>
          <div className="upload-inline-row">
            <input
              ref={inputRef}
              type="file"
              accept=".m"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <div className="upload-selected-file">
                <strong>{selectedFile.name}</strong>
                <em>{(selectedFile.size / 1024).toFixed(1)} KB</em>
              </div>
            ) : null}
            <button type="button" onClick={parseSelectedFile} disabled={!selectedFile || uploading}>
              {uploading ? '파싱 중…' : '파싱 후 갱신'}
            </button>
          </div>
        </section>
      </div>

      {message ? <div className="upload-message success">{message}</div> : null}
      {error ? <div className="upload-message error">{error}</div> : null}

      <section className="upload-history-panel">
        <div className="upload-history-header">
          <h3>파싱 이력</h3>
        </div>
        {loadingHistory ? <div className="empty-state">파싱 이력을 불러오는 중입니다.</div> : null}
        {!loadingHistory && history.length === 0 ? <div className="empty-state">아직 업로드된 설정 파일이 없습니다.</div> : null}
        {!loadingHistory && history.length > 0 ? (
          <div className="upload-history-table">
            <table>
              <thead>
                <tr>
                  <th>파일명</th>
                  <th>상태</th>
                  <th>업로드 시간</th>
                  <th>파싱 완료 시간</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.fileId} className={item.current ? 'is-current' : ''}>
                    <td>
                      <button
                        type="button"
                        className="upload-file-link"
                        onClick={() => openFileDetail(item)}
                      >
                        {item.fileName}
                      </button>
                      {item.current ? <span>현재</span> : null}
                    </td>
                    <td>
                      <mark className={`parse-status parse-status-${item.parseStatus.toLowerCase()}`}>
                        {statusLabels[item.parseStatus]}
                      </mark>
                    </td>
                    <td>{formatDateTime(item.uploadedAt)}</td>
                    <td>{formatDateTime(item.parsedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {fileDetail ? (
        <>
          <button
            type="button"
            className="file-preview-backdrop"
            aria-label="원본 파일 닫기"
            onClick={() => setFileDetail(null)}
          />
          <aside className="file-preview-panel" role="dialog" aria-label="원본 설정 파일">
            <div className="file-preview-header">
              <div>
                <span>원본 설정 파일</span>
                <h3>{fileDetail.file.fileName}</h3>
              </div>
              <button type="button" onClick={() => setFileDetail(null)} aria-label="닫기">
                x
              </button>
            </div>
            {loadingFileDetail ? (
              <div className="empty-state">원본 파일을 불러오는 중입니다.</div>
            ) : (
              <pre>{fileDetail.fileContent ?? '저장된 원본 내용이 없습니다.'}</pre>
            )}
          </aside>
        </>
      ) : null}
    </div>
  )
}
