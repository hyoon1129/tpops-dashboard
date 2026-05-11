import { navItems } from '../constants/dashboard'

type SidebarProps = {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
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
          <button key={item.label} type="button" className={item.active ? 'active' : ''}>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
