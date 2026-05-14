import type {
  Column,
  NavItem,
  SectionDefinition,
  SectionKey,
  SectionState,
  TableRow,
  TableValue,
} from '../types/config'

export const collapsedSearchLimit = 12

export const navItems: NavItem[] = [
  { label: '설정 목록' },
  { label: '구성 트리' },
  { label: '서비스 응답시간' },
  { label: '설정 파일' },
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
  keys.map((key) => ({ key, label: labels[key] ?? configLabel(key), sortKey: sortKeys[key] ?? key }))

const configLabels: Record<string, string> = {
  appdir: 'APPDIR',
  asqcount: 'ASQCOUNT',
  autobackup: 'AUTOBACKUP',
  backup: 'BACKUP',
  backupRgwaddr: 'BACKUP_RGWADDR',
  backupRgwportno: 'BACKUP_RGWPORTNO',
  blocktime: 'BLOCKTIME',
  clhopt: 'CLHOPT',
  clopt: 'CLOPT',
  cousin: 'COUSIN',
  cpc: 'CPC',
  domainId: 'DOMAINID',
  envfile: 'ENVFILE',
  gperiod: 'GPERIOD',
  gwchkint: 'GWCHKINT',
  gwconnectTimeout: 'GWCONNECT_TIMEOUT',
  gwtype: 'GWTYPE',
  hostname: 'HOSTNAME',
  ipcperm: 'IPCPERM',
  loadValue: 'LOAD',
  maxcacall: 'MAXCACALL',
  maxclh: 'MAXCLH',
  maxcousin: 'MAXCOUSIN',
  maxcousinsvg: 'MAXCOUSINSVG',
  maxcpc: 'MAXCPC',
  maxgw: 'MAXGW',
  maxgwcpc: 'MAXGWCPC',
  maxgwsvr: 'MAXGWSVR',
  maxnode: 'MAXNODE',
  maxqcount: 'MAXQCOUNT',
  maxrstart: 'MAXRSTART',
  maxsacall: 'MAXSACALL',
  maxspr: 'MAXSPR',
  maxsvc: 'MAXSVC',
  maxsvg: 'MAXSVG',
  maxsvr: 'MAXSVR',
  maxtotalsvg: 'MAXTOTALSVG',
  maxuser: 'MAXUSER',
  maxValue: 'MAX',
  minclh: 'MINCLH',
  minValue: 'MIN',
  nclhchktime: 'NCLHCHKTIME',
  nliveinq: 'NLIVEINQ',
  nodename: 'NODENAME',
  nodetype: 'NODETYPE',
  pathdir: 'PATHDIR',
  portno: 'PORTNO',
  racport: 'RACPORT',
  restart: 'RESTART',
  rgwaddr: 'RGWADDR',
  rgwportno: 'RGWPORTNO',
  schedule: 'SCHEDULE',
  shmkey: 'SHMKEY',
  slogdir: 'SLOGDIR',
  svctime: 'SVCTIME',
  svgname: 'SVGNAME',
  svrtype: 'SVRTYPE',
  svrname: 'SVRNAME',
  target: 'TARGET',
  tlogdir: 'TLOGDIR',
  tmaxdir: 'TMAXDIR',
  tmaxhome: 'TMAXHOME',
  tportno: 'TPORTNO',
  ulogdir: 'ULOGDIR',
}

const configLabel = (key: string) => configLabels[key] ?? key.toUpperCase()

export const sectionDefinitions: SectionDefinition[] = [
  {
    label: 'DOMAIN',
    title: '도메인',
    endpoint: 'domains',
    columns: columns([
      'NAME', 'domainId', 'minclh', 'maxclh', 'tportno', 'racport', 'shmkey', 'maxuser',
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
    ], { NAME: 'svrgroupName' }).map((col) => col.key === 'nodename' ? { ...col, badge: true } : col),
    toRows: (items) => items.map((item) => ({ NAME: item.svrgroupName, ...pick(item, sectionDefinitions[2].columns.slice(1).map((column) => column.key)) })),
  },
  {
    label: 'SERVER',
    title: '서버',
    endpoint: 'server-configs',
    columns: [
      ...columns(['NAME', 'svgname'], { NAME: 'serverName' }),
      { key: 'dbInfo', label: 'DB', sortKey: 'dbInfo', badge: true },
      ...columns([
        'svrtype', 'minValue', 'maxValue', 'target', 'schedule',
        'maxqcount', 'cpc', 'asqcount', 'restart', 'maxrstart', 'gperiod', 'clopt',
      ]),
    ],
    toRows: (items) => items.map((item) => ({ NAME: item.serverName, ...pick(item, ['svgname', 'dbInfo', 'svrtype', 'minValue', 'maxValue', 'target', 'schedule', 'maxqcount', 'cpc', 'asqcount', 'restart', 'maxrstart', 'gperiod', 'clopt']) })),
  },
  {
    label: 'SERVICE',
    title: '서비스',
    endpoint: 'services',
    columns: columns([
      'NAME', 'businessName', 'svrname', 'svctime',
    ], { NAME: 'serviceName', businessName: 'businessCode.businessName' }, { businessName: '업무' }),
    toRows: (items) => items.map((item) => ({
      NAME: item.serviceName,
      fileId: item.fileId,
      serverConfigId: item.serverConfigId,
      ...pick(item, sectionDefinitions[4].columns.slice(1).map((column) => column.key)),
    })),
  },
  {
    label: 'GATEWAY',
    title: '게이트웨이',
    endpoint: 'gateways',
    columns: columns([
      'NAME', 'gwtype', 'nodename', 'portno', 'rgwportno', 'rgwaddr', 'cpc',
      'loadValue', 'backupRgwaddr', 'backupRgwportno', 'clopt',
    ], { NAME: 'gatewayName' }).map((col) => col.key === 'nodename' ? { ...col, badge: true } : col),
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
