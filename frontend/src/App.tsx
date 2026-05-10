import './App.css'

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>TPOps Dashboard</h1>
          <p className="subtitle">Tmax 설정 파일 조회 대시보드</p>
        </div>
        <button type="button" className="primary-button">
          설정 파일 업로드
        </button>
      </header>

      <section className="toolbar" aria-label="조회 조건">
        <label>
          서버
          <select defaultValue="">
            <option value="" disabled>
              서버 선택
            </option>
          </select>
        </label>
        <label>
          검색 범위
          <select defaultValue="ALL">
            <option value="ALL">전체</option>
            <option value="DOMAIN">DOMAIN</option>
            <option value="NODE">NODE</option>
            <option value="SVRGROUP">SVRGROUP</option>
            <option value="SERVER">SERVER</option>
            <option value="SERVICE">SERVICE</option>
            <option value="GATEWAY">GATEWAY</option>
          </select>
        </label>
        <label className="search-field">
          검색어
          <input placeholder="서비스명, 서버명, 업무명 검색" />
        </label>
        <button type="button" className="secondary-button">
          검색
        </button>
      </section>

      <section className="tabs" aria-label="설정 섹션">
        {['DOMAIN', 'NODE', 'SVRGROUP', 'SERVER', 'SERVICE', 'GATEWAY'].map(
          (section) => (
            <button
              key={section}
              type="button"
              className={section === 'SERVICE' ? 'active' : ''}
            >
              {section}
            </button>
          ),
        )}
      </section>

      <section className="table-panel">
        <div className="panel-header">
          <div>
            <h2>SERVICE</h2>
            <p>선택한 서버의 현재 설정 파일 기준</p>
          </div>
          <span className="status-pill">API 연결 대기</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Server</th>
              <th>Business Code</th>
              <th>Svc Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>서버를 선택하면 설정값을 조회합니다.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  )
}

export default App
