import type {
  Column,
  NavItem,
  SectionDefinition,
  SectionKey,
  SectionState,
  TableRow,
  TableValue,
} from '../types/config'

export const pageSize = 100
export const collapsedSearchLimit = 12

export const navItems: NavItem[] = [
  { label: '개요', active: true },
  { label: '설정 조회' },
  { label: '구성 관계' },
  { label: '업무 매핑' },
  { label: '통합 검색' },
  { label: '관리 설정' },
]

const pick = (item: Record<string, TableValue>, keys: string[]) =>
  keys.reduce<TableRow>((row, key) => {
    row[key] = item[key]
    return row
  }, {})

const columns = (
  keys: string[],
  sortKeys: Record<string, string> = {},
  labels: Record<string, string> = {},
): Column[] =>
  keys.map((key) => ({ key, label: labels[key] ?? key, sortKey: sortKeys[key] ?? key }))

export const sectionDefinitions: SectionDefinition[] = [
  {
    label: 'DOMAIN',
    title: '도메인',
    endpoint: 'domains',
    columns: columns([
      'NAME', 'domainId', 'shmkey', 'maxuser', 'minclh', 'maxclh', 'tportno', 'racport',
      'blocktime', 'maxsvg', 'maxsvr', 'maxspr', 'maxsvc', 'maxsacall', 'maxcacall',
      'maxtotalsvg', 'maxgw', 'maxcpc', 'maxcousin', 'maxcousinsvg', 'gwchkint',
      'gwconnectTimeout', 'nclhchktime', 'nliveinq', 'ipcperm', 'maxnode',
    ], { NAME: 'domainName' }),
    toRows: (items) => items.map((item) => ({ NAME: item.domainName, ...pick(item, sectionDefinitions[0].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'NODE',
    title: '노드',
    endpoint: 'nodes',
    columns: columns([
      'NAME', 'hostname', 'tmaxdir', 'appdir', 'tmaxhome', 'pathdir', 'tlogdir', 'ulogdir',
      'slogdir', 'nodetype', 'autobackup', 'maxgwcpc', 'maxgwsvr', 'clhopt',
    ], { NAME: 'nodeName' }),
    toRows: (items) => items.map((item) => ({ NAME: item.nodeName, ...pick(item, sectionDefinitions[1].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'SVRGROUP',
    title: '서버 그룹',
    endpoint: 'svrgroups',
    columns: columns([
      'NAME', 'nodename', 'cousin', 'loadValue', 'backup', 'envfile',
    ], { NAME: 'svrgroupName' }),
    toRows: (items) => items.map((item) => ({ NAME: item.svrgroupName, ...pick(item, sectionDefinitions[2].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'SERVER',
    title: '서버',
    endpoint: 'server-configs',
    columns: columns([
      'NAME', 'svgname', 'svrtype', 'clopt', 'minValue', 'maxValue', 'target', 'schedule',
      'maxqcount', 'cpc', 'asqcount', 'restart', 'maxrstart', 'gperiod',
    ], { NAME: 'serverName' }),
    toRows: (items) => items.map((item) => ({ NAME: item.serverName, ...pick(item, sectionDefinitions[3].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'SERVICE',
    title: '서비스',
    endpoint: 'services',
    columns: columns([
      'NAME', 'businessName', 'svrname', 'svctime',
    ], { NAME: 'serviceName', businessName: 'businessCode.businessName' }, { businessName: '업무' }),
    toRows: (items) => items.map((item) => ({ NAME: item.serviceName, ...pick(item, sectionDefinitions[4].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'GATEWAY',
    title: '게이트웨이',
    endpoint: 'gateways',
    columns: columns([
      'NAME', 'gwtype', 'nodename', 'portno', 'rgwportno', 'rgwaddr', 'cpc', 'clopt',
      'loadValue', 'backupRgwaddr', 'backupRgwportno',
    ], { NAME: 'gatewayName' }),
    toRows: (items) => items.map((item) => ({ NAME: item.gatewayName, ...pick(item, sectionDefinitions[5].columns.slice(1).map((column) => column.key)) })),
  },
]

export const initialSections = () =>
  sectionDefinitions.reduce<Record<SectionKey, SectionState>>((states, section) => {
    states[section.label] = { rows: [], total: 0, page: -1, last: false, loading: false }
    return states
  }, {} as Record<SectionKey, SectionState>)

export const initialSearchRows = () =>
  sectionDefinitions.reduce<Record<SectionKey, TableRow[]>>((rows, section) => {
    rows[section.label] = []
    return rows
  }, {} as Record<SectionKey, TableRow[]>)
