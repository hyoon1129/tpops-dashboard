import { navItems } from '../constants/dashboard'
import type { DashboardView } from '../types/config'

type SidebarProps = {
  activeView: DashboardView
  collapsed: boolean
  onViewChange: (view: DashboardView) => void
  onCollapsedChange: (collapsed: boolean) => void
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
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
