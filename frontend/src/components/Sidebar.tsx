import type { ReactElement } from 'react'
import { navItems } from '../constants/dashboard'
import type { DashboardView } from '../types/config'

type SidebarProps = {
  activeView: DashboardView
  collapsed: boolean
  onViewChange: (view: DashboardView) => void
  onCollapsedChange: (collapsed: boolean) => void
}

const NAV_ICONS: Record<string, ReactElement> = {
  '설정 목록': (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="14" height="14" rx="3.5" stroke="currentColor" strokeWidth="1.6" />
      <line x1="6.5" y1="7.5" x2="13.5" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="10.5" x2="13.5" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="13.5" x2="11" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  '구성 트리': (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <rect x="7.5" y="2" width="5" height="4" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="1.5" y="14" width="5" height="4" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="14" width="5" height="4" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5V9.5M10 9.5H4M10 9.5H16M4 9.5V13.5M16 9.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  '서비스 응답시간': (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 15.5H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4.5 13L8 9.5L10.5 12L15.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="13" r="1.2" fill="currentColor" />
      <circle cx="8" cy="9.5" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="5.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  '설정 관리': (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path d="M8.9 2.8H11.1L11.6 4.6C12 4.7 12.4 4.9 12.8 5.1L14.5 4.2L15.8 5.5L14.9 7.2C15.1 7.6 15.3 8 15.4 8.4L17.2 8.9V11.1L15.4 11.6C15.3 12 15.1 12.4 14.9 12.8L15.8 14.5L14.5 15.8L12.8 14.9C12.4 15.1 12 15.3 11.6 15.4L11.1 17.2H8.9L8.4 15.4C8 15.3 7.6 15.1 7.2 14.9L5.5 15.8L4.2 14.5L5.1 12.8C4.9 12.4 4.7 12 4.6 11.6L2.8 11.1V8.9L4.6 8.4C4.7 8 4.9 7.6 5.1 7.2L4.2 5.5L5.5 4.2L7.2 5.1C7.6 4.9 8 4.7 8.4 4.6L8.9 2.8Z" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.45" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  ),
}

export function Sidebar({ activeView, collapsed, onViewChange, onCollapsedChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="대시보드 메뉴">
      <div className="brand">
        <span className="brand-mark">T</span>
        <div>
          <strong>TPOps</strong>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-toggle"
        aria-label={collapsed ? '대시보드 탭 열기' : '대시보드 탭 닫기'}
        onClick={() => onCollapsedChange(!collapsed)}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <nav className="side-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className={activeView === item.label ? 'active' : ''}
            onClick={() => onViewChange(item.label as DashboardView)}
            title={collapsed ? item.label : undefined}
          >
            {NAV_ICONS[item.label]}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
