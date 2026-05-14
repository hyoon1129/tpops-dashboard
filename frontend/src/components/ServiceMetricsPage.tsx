import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type ServiceResponseTimeMetric = {
  avgResponseTimeMs: number | null
  businessName: string | null
  documentCount: number
  serverName: string | null
  serviceName: string
}

type ServiceResponseTimeResponse = {
  documentCount: number
  from: string
  indexName: string
  responseTimeField: string
  serviceNameField: string
  services: ServiceResponseTimeMetric[]
  to: string
}

type SortKey = 'serviceName' | 'serverName' | 'businessName' | 'documentCount' | 'avgResponseTimeMs'
type SortDir = 'asc' | 'desc'
type Preset = '1시간' | '오늘' | '1일' | '1주' | '1년'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const lpad = (n: number, len = 2) => String(n).padStart(len, '0')

function formatDisplay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}  ${lpad(date.getHours())}:${lpad(date.getMinutes())}:${lpad(date.getSeconds())}.${lpad(date.getMilliseconds(), 3)}`
}

function formatTime(date: Date): string {
  return `${lpad(date.getHours())}:${lpad(date.getMinutes())}:${lpad(date.getSeconds())}.${lpad(date.getMilliseconds(), 3)}`
}

function parseTime(text: string): { h: number; m: number; s: number; ms: number } | null {
  const match = text.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/)
  if (!match) return null
  const h = Number(match[1]), m = Number(match[2]), s = Number(match[3])
  const ms = Number(match[4].padEnd(3, '0'))
  if (h > 23 || m > 59 || s > 59) return null
  return { h, m, s, ms }
}

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return '-'
  return value.toLocaleString('ko-KR', { maximumFractionDigits, minimumFractionDigits: 0 })
}

function msColorClass(ms: number | null): string {
  if (ms === null) return ''
  if (ms >= 1000) return 'ms-danger'
  if (ms >= 500) return 'ms-warning'
  if (ms >= 200) return 'ms-caution'
  return ''
}

function presetRange(preset: Preset): { from: Date; to: Date } {
  const to = new Date()
  let from: Date
  if (preset === '1시간') {
    from = new Date(to.getTime() - 60 * 60 * 1000)
  } else if (preset === '오늘') {
    from = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 0, 0, 0)
  } else if (preset === '1일') {
    from = new Date(to.getTime() - 24 * 60 * 60 * 1000)
  } else if (preset === '1주') {
    from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    from = new Date(to.getFullYear() - 1, to.getMonth(), to.getDate(), to.getHours(), to.getMinutes())
  }
  return { from, to }
}

const PRESETS: Preset[] = ['1시간', '오늘', '1일', '1주', '1년']

// ── 날짜 선택 팝오버 ─────────────────────────────────────────────
type DatePickerInputProps = {
  label: string
  value: Date
  startDate: Date
  endDate: Date
  isStart: boolean
  otherDate: Date
  alignRight?: boolean
  onChange: (date: Date) => void
}

function DatePickerInput({ label, value, startDate, endDate, isStart, otherDate, alignRight, onChange }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [timeTextOverride, setTimeTextOverride] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const now = new Date()
  // 오늘 날짜면 현재 시각까지만 시간 선택 가능
  const isToday = value.toDateString() === now.toDateString()
  const maxTime = isToday ? now : new Date(new Date().setHours(23, 59, 59, 999))
  const minTime = new Date(new Date().setHours(0, 0, 0, 0))

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const timeText = timeTextOverride ?? formatTime(value)
  const timeDirty = timeTextOverride !== null && timeTextOverride !== formatTime(value)

  const handleCalendarChange = (date: Date | null) => {
    if (!date) return
    // 미래 방지 (시간 리스트 maxTime으로 대부분 막히지만 혹시 모를 케이스)
    const clamped = date > now ? now : date
    // 시작 > 종료 방지
    if (isStart && clamped >= otherDate) return
    if (!isStart && clamped <= otherDate) return
    setTimeTextOverride(null)
    setTimeError(null)
    onChange(clamped)
  }

  const handleTimeConfirm = () => {
    const parsed = parseTime(timeText)
    if (!parsed) {
      setTimeError('형식이 올바르지 않습니다. 예: 14:08:32.087')
      return
    }
    const next = new Date(value)
    next.setHours(parsed.h, parsed.m, parsed.s, parsed.ms)
    if (next > now) {
      setTimeError('미래 시간은 선택할 수 없습니다.')
      return
    }
    if (isStart && next >= otherDate) {
      setTimeError('시작 시간은 종료 시간보다 이전이어야 합니다.')
      return
    }
    if (!isStart && next <= otherDate) {
      setTimeError('종료 시간은 시작 시간보다 이후여야 합니다.')
      return
    }
    onChange(next)
    setTimeTextOverride(null)
    setTimeError(null)
  }

  return (
    <div ref={wrapRef} className="metric-field">
      <label>{label}</label>
      <button
        type="button"
        className="metric-dateinput-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {formatDisplay(value)}
      </button>
      {open && (
        <div className={alignRight ? 'metric-dateinput-panel align-right' : 'metric-dateinput-panel'}>
          <DatePicker
            inline
            selected={value}
            onChange={handleCalendarChange}
            selectsStart={isStart}
            selectsEnd={!isStart}
            startDate={startDate}
            endDate={endDate}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={30}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            maxDate={now}
            minDate={isStart ? undefined : otherDate}
            maxTime={maxTime}
            minTime={minTime}
          />
          <div className="metrics-datepicker-footer">
            <div className="metrics-datepicker-footer-row">
              <span className="metrics-datepicker-footer-label">시간</span>
              <input
                type="text"
                className={timeError ? 'metrics-abs-input error' : 'metrics-abs-input'}
                value={timeText}
                onChange={(e) => { setTimeTextOverride(e.target.value); setTimeError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTimeConfirm() }}
                spellCheck={false}
                placeholder="HH:mm:ss.SSS"
              />
              {timeDirty && (
                <button type="button" className="metrics-datepicker-confirm" onClick={handleTimeConfirm}>✓</button>
              )}
            </div>
            {timeError && (
              <p className="metrics-datepicker-error">{timeError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
type ServiceMetricsPageProps = {
  onServiceClick?: (serviceName: string) => void
}

export function ServiceMetricsPage({ onServiceClick }: ServiceMetricsPageProps = {}) {
  const initialRange = useMemo(() => presetRange('1일'), [])

  const [from, setFrom] = useState<Date>(initialRange.from)
  const [to, setTo] = useState<Date>(initialRange.to)
  const [activePreset, setActivePreset] = useState<Preset | null>('1일')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('avgResponseTimeMs')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [metrics, setMetrics] = useState<ServiceResponseTimeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  // 최신 값을 stable 콜백에서 참조하기 위한 refs
  const fromRef = useRef(from)
  const toRef = useRef(to)
  const activePresetRef = useRef(activePreset)

  useEffect(() => {
    fromRef.current = from
    toRef.current = to
    activePresetRef.current = activePreset
  }, [activePreset, from, to])

  const fetchMetrics = useCallback(async () => {
    // 프리셋이 활성화된 경우 현재 시각 기준으로 범위 재계산 (자동 새로고침 시 유용)
    let currentFrom = fromRef.current
    let currentTo = toRef.current
    if (activePresetRef.current) {
      const range = presetRange(activePresetRef.current)
      currentFrom = range.from
      currentTo = range.to
      setFrom(range.from)
      setTo(range.to)
    }
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ from: currentFrom.toISOString(), to: currentTo.toISOString() })
      const response = await fetch(`/api/dashboard/service-response-times?${params.toString()}`)
      if (!response.ok) throw new Error(await response.text())
      setMetrics((await response.json()) as ServiceResponseTimeResponse)
      setLastFetched(new Date())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '서비스 지표를 불러오지 못했습니다.')
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // 진입 시 자동 조회
  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const handlePreset = (preset: Preset) => {
    const range = presetRange(preset)
    setFrom(range.from)
    setTo(range.to)
    setActivePreset(preset)
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'serviceName' || key === 'serverName' || key === 'businessName' ? 'asc' : 'desc')
    }
  }

  const displayedServices = useMemo(() => {
    if (!metrics) return []
    const keyword = searchKeyword.trim().toLowerCase()
    const filtered = keyword
      ? metrics.services.filter((m) => m.serviceName.toLowerCase().includes(keyword))
      : metrics.services
    return [...filtered].sort((a, b) => {
      let av: string | number | null
      let bv: string | number | null
      if (sortKey === 'avgResponseTimeMs') {
        av = a.avgResponseTimeMs ?? -1; bv = b.avgResponseTimeMs ?? -1
      } else if (sortKey === 'documentCount') {
        av = a.documentCount; bv = b.documentCount
      } else {
        av = (a[sortKey] ?? '').toLowerCase(); bv = (b[sortKey] ?? '').toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [metrics, searchKeyword, sortKey, sortDir])

  const sortMark = (key: SortKey) => {
    if (sortKey !== key) return <span className="metrics-sort-mark">↕</span>
    return <span className="metrics-sort-mark active">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <section className="metrics-page">
      <div className="metrics-toolbar">
        <div className="metrics-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={activePreset === preset ? 'metrics-preset-btn active' : 'metrics-preset-btn'}
              onClick={() => handlePreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>
        <div className="metrics-toolbar-right">
          <DatePickerInput
            label="시작"
            value={from}
            startDate={from}
            endDate={to}
            isStart
            otherDate={to}
            onChange={(d) => { setFrom(d); setActivePreset(null) }}
          />
          <DatePickerInput
            label="종료"
            value={to}
            startDate={from}
            endDate={to}
            isStart={false}
            otherDate={from}
            alignRight
            onChange={(d) => { setTo(d); setActivePreset(null) }}
          />
          <button type="button" className="metrics-fetch-btn" onClick={fetchMetrics} disabled={loading}>
            {loading ? '조회 중' : '조회'}
          </button>
        </div>
      </div>
      {lastFetched && (
        <div className="metrics-last-fetched">
          마지막 조회: {lpad(lastFetched.getHours())}:{lpad(lastFetched.getMinutes())}:{lpad(lastFetched.getSeconds())}
        </div>
      )}

      {error ? <div className="metrics-error">{error}</div> : null}

      <div className="metrics-table-section">
        <div className="metrics-table-header">
          <h3>서비스별 평균 응답시간</h3>
          <div className="metrics-table-header-right">
            <div className="metrics-search-box">
              <input
                type="text"
                placeholder="서비스명 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              {searchKeyword ? (
                <button type="button" className="metrics-search-clear" onClick={() => setSearchKeyword('')}>✕</button>
              ) : null}
            </div>
            <span>
              {metrics
                ? searchKeyword
                  ? `${displayedServices.length} / ${metrics.services.length.toLocaleString('ko-KR')}건`
                  : `${metrics.services.length.toLocaleString('ko-KR')}건`
                : '미조회'}
            </span>
          </div>
        </div>
        <div className="metrics-table-wrap">
          <table className="metrics-table">
            <thead>
              <tr>
                <th><button type="button" className="metrics-th-btn" onClick={() => handleSort('serviceName')}>SERVICE {sortMark('serviceName')}</button></th>
                <th><button type="button" className="metrics-th-btn" onClick={() => handleSort('serverName')}>SERVER {sortMark('serverName')}</button></th>
                <th><button type="button" className="metrics-th-btn" onClick={() => handleSort('businessName')}>업무 {sortMark('businessName')}</button></th>
                <th><button type="button" className="metrics-th-btn" onClick={() => handleSort('documentCount')}>로그 수 {sortMark('documentCount')}</button></th>
                <th><button type="button" className="metrics-th-btn" onClick={() => handleSort('avgResponseTimeMs')}>평균 ms {sortMark('avgResponseTimeMs')}</button></th>
              </tr>
            </thead>
            <tbody>
              {displayedServices.length > 0 ? (
                displayedServices.map((metric) => (
                  <tr key={metric.serviceName}>
                    <td>
                      {onServiceClick ? (
                        <button
                          type="button"
                          className="metrics-service-link"
                          onClick={() => onServiceClick(metric.serviceName)}
                        >
                          {metric.serviceName}
                        </button>
                      ) : metric.serviceName}
                    </td>
                    <td>{metric.serverName ?? '-'}</td>
                    <td>{metric.businessName ?? '-'}</td>
                    <td>{metric.documentCount.toLocaleString('ko-KR')}</td>
                    <td className={msColorClass(metric.avgResponseTimeMs)}>{formatNumber(metric.avgResponseTimeMs)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    {loading ? '조회 중입니다.' : metrics && searchKeyword ? '검색 결과가 없습니다.' : '조회 결과가 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
