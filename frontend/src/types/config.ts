export type NavItem = {
  label: string
}

export type DashboardView = '설정 목록' | '구성 트리'

export type ServerInfo = {
  serverId: number
  serverName: string
  serverIp: string
  environment: string
  description: string | null
}

export type SectionKey = 'DOMAIN' | 'NODE' | 'SVRGROUP' | 'SERVER' | 'SERVICE' | 'GATEWAY'
export type TableValue = string | number | null | undefined

export type Column = {
  key: string
  label: string
  sortKey: string
  badge?: boolean
  sortable?: boolean
}

export type TableRow = Record<string, TableValue>

export type SectionDefinition = {
  label: SectionKey
  title: string
  endpoint: string
  columns: Column[]
  toRows: (items: Array<Record<string, TableValue>>) => TableRow[]
}

export type PageResponse = {
  content: Array<Record<string, TableValue>>
  page: number
  totalElements: number
  last: boolean
}

export type SectionState = {
  rows: TableRow[]
  total: number
  page: number
  last: boolean
  loading: boolean
}

export type SearchResult = {
  section: SectionKey
  name: string
  related: string | null
  matchedField: string
  value: string | null
}

export type SortState = {
  section: SectionKey
  key: string
  direction: 'asc' | 'desc'
}

export type RelationshipServer = {
  server: TableRow
  services: TableRow[]
}

export type RelationshipGroup = {
  svrgroup: TableRow
  servers: RelationshipServer[]
}

export type RelationshipNode = {
  node: TableRow
  svrgroups: RelationshipGroup[]
  gateways: TableRow[]
}

export type RelationshipDomain = {
  domain: TableRow
  nodes: RelationshipNode[]
}
