import { useMemo, useState } from 'react'
import { sectionDefinitions } from '../constants/dashboard'
import type { SectionDefinition, SectionKey, SectionState, TableRow, TableValue } from '../types/config'

export type ConfigRelationSelection = {
  row: TableRow
  section: SectionKey
}

type RelationItem = {
  row: TableRow
  section: SectionKey
}

type RelationGroup = {
  items: RelationItem[]
  section: SectionKey
}

type ConfigRelationPanelProps = {
  onClose: () => void
  onSelectRelated: (item: RelationItem) => void
  open: boolean
  sections: Record<SectionKey, SectionState>
  selection: ConfigRelationSelection | null
}

const definitionBySection = (section: SectionKey): SectionDefinition =>
  sectionDefinitions.find((definition) => definition.label === section) ?? sectionDefinitions[0]

const displayValue = (value: TableValue) => (value === null || value === undefined || value === '' ? '-' : String(value))

const rowName = (row?: TableRow | null) => String(row?.NAME ?? '-')

const byName = (rows: TableRow[], name: TableValue) =>
  rows.find((row) => rowName(row) === String(name ?? '')) ?? null

const compact = (items: Array<RelationItem | null | undefined>) =>
  items.filter((item): item is RelationItem => Boolean(item))

function childGroup(section: SectionKey, items: TableRow[]): RelationGroup | null {
  return items.length > 0 ? { section, items: items.map((row) => ({ section, row })) } : null
}

function buildRelationContext(selection: ConfigRelationSelection, sections: Record<SectionKey, SectionState>) {
  const domains = sections.DOMAIN.rows
  const nodes = sections.NODE.rows
  const groups = sections.SVRGROUP.rows
  const servers = sections.SERVER.rows
  const services = sections.SERVICE.rows
  const gateways = sections.GATEWAY.rows
  const domain = domains[0] ?? null
  const { row, section } = selection

  const nodeFor = (name: TableValue) => byName(nodes, name)
  const groupFor = (name: TableValue) => byName(groups, name)
  const serverFor = (name: TableValue) => byName(servers, name)

  const selectedServer = section === 'SERVICE' ? serverFor(row.svrname) : section === 'SERVER' ? row : null
  const selectedGroup = section === 'SVRGROUP'
    ? row
    : selectedServer
    ? groupFor(selectedServer.svgname)
    : null
  const selectedNode = section === 'NODE'
    ? row
    : section === 'GATEWAY'
    ? nodeFor(row.nodename)
    : selectedGroup
    ? nodeFor(selectedGroup.nodename)
    : null

  const path = compact([
    domain ? { section: 'DOMAIN', row: domain } : null,
    selectedNode ? { section: 'NODE', row: selectedNode } : null,
    selectedGroup ? { section: 'SVRGROUP', row: selectedGroup } : null,
    selectedServer ? { section: 'SERVER', row: selectedServer } : null,
    section === 'SERVICE' ? { section: 'SERVICE', row } : null,
    section === 'GATEWAY' ? { section: 'GATEWAY', row } : null,
  ])

  let childGroups: Array<RelationGroup | null> = []
  if (section === 'DOMAIN') {
    childGroups = [childGroup('NODE', nodes)]
  } else if (section === 'NODE') {
    const currentName = rowName(row)
    childGroups = [
      childGroup('SVRGROUP', groups.filter((child) => String(child.nodename ?? '') === currentName)),
      childGroup('GATEWAY', gateways.filter((child) => String(child.nodename ?? '') === currentName)),
    ]
  } else if (section === 'SVRGROUP') {
    const currentName = rowName(row)
    childGroups = [childGroup('SERVER', servers.filter((child) => String(child.svgname ?? '') === currentName))]
  } else if (section === 'SERVER') {
    const currentName = rowName(row)
    childGroups = [childGroup('SERVICE', services.filter((child) => String(child.svrname ?? '') === currentName))]
  }

  return {
    childGroups: childGroups.filter((group): group is RelationGroup => Boolean(group)),
    path,
  }
}

function PathSection({
  childGroups,
  current,
  onSelectRelated,
  path,
}: {
  childGroups: RelationGroup[]
  current: ConfigRelationSelection
  onSelectRelated: (item: RelationItem) => void
  path: RelationItem[]
}) {
  const [childrenOpen, setChildrenOpen] = useState(false)
  const totalChildren = childGroups.reduce((count, group) => count + group.items.length, 0)

  return (
    <section className="config-relation-section">
      <div className="config-relation-section-header">
        <h4>연결 경로</h4>
      </div>
      <div className="config-relation-path">
        {path.map((item) => {
          const active = item.section === current.section && item.row === current.row
          return (
            <div className="config-relation-path-step" key={`${item.section}:${rowName(item.row)}`}>
              <button
                type="button"
                className={active ? 'active' : ''}
                onClick={() => {
                  if (active) {
                    setChildrenOpen((currentOpen) => !currentOpen)
                    return
                  }
                  onSelectRelated(item)
                }}
              >
                <span className={`inspector-section-badge section-${item.section.toLowerCase()}`}>
                  {item.section}
                </span>
                <strong>{rowName(item.row)}</strong>
                {active && totalChildren > 0 ? <em>{totalChildren}</em> : null}
              </button>
              {active && childrenOpen && totalChildren > 0 ? (
                <ChildGroups
                  groups={childGroups}
                  onSelectRelated={onSelectRelated}
                />
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ChildGroups({
  groups,
  onSelectRelated,
}: {
  groups: RelationGroup[]
  onSelectRelated: (item: RelationItem) => void
}) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null)

  return (
    <div className="config-relation-groups">
      {groups.map((group) => (
        <div className="config-relation-group" key={group.section}>
          <button
            type="button"
            className="config-relation-group-title"
            onClick={() => setOpenSection((current) => current === group.section ? null : group.section)}
          >
            <span className={`inspector-section-badge section-${group.section.toLowerCase()}`}>
              {group.section}
            </span>
            <strong>{group.items.length}</strong>
          </button>
          {openSection === group.section ? (
            <div className="config-relation-links">
              {group.items.map((item) => (
                <button
                  type="button"
                  key={`${item.section}:${rowName(item.row)}`}
                  onClick={() => onSelectRelated(item)}
                >
                  <strong>{rowName(item.row)}</strong>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function ConfigRelationPanel({
  onClose,
  onSelectRelated,
  open,
  sections,
  selection,
}: ConfigRelationPanelProps) {
  const context = useMemo(() => {
    if (!selection) {
      return null
    }
    return buildRelationContext(selection, sections)
  }, [sections, selection])

  if (!selection || !context) {
    return null
  }

  const definition = definitionBySection(selection.section)

  return (
    <aside className={open ? 'config-relation-panel open' : 'config-relation-panel'} role="dialog" aria-label="설정 관계 상세">
      <div className="config-relation-header">
        <div>
          <span className={`inspector-section-badge section-${selection.section.toLowerCase()}`}>
            {selection.section}
          </span>
          <h3>{rowName(selection.row)}</h3>
        </div>
        <button type="button" aria-label="닫기" onClick={onClose}>
          x
        </button>
      </div>

      <PathSection
        childGroups={context.childGroups}
        current={selection}
        onSelectRelated={onSelectRelated}
        path={context.path}
      />

      <section className="config-relation-section">
        <div className="config-relation-section-header">
          <h4>설정값</h4>
        </div>
        <dl className="relationship-config-list">
          {definition.columns.map((column) => (
            <div key={column.key}>
              <dt>{column.label}</dt>
              <dd>{displayValue(selection.row[column.key])}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  )
}
