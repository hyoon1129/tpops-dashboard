*DOMAIN
TPDOM01     DOMAINID = 1,
            SHMKEY = 77990,
            MAXUSER = 300,
            MINCLH = 1,
            MAXCLH = 3,
            TPORTNO = 8888,
            RACPORT = 3333,
            BLOCKTIME = 60,
            MAXSVG = 20,
            MAXSVR = 80,
            MAXSPR = 120,
            MAXSVC = 300,
            MAXSACALL = 128,
            MAXCACALL = 128,
            MAXTOTALSVG = 30,
            MAXGW = 4,
            MAXCPC = 32,
            MAXCOUSIN = 10,
            MAXCOUSINSVG = 20,
            GWCHKINT = 30,
            GWCONNECT_TIMEOUT = 10,
            NCLHCHKTIME = 60,
            NLIVEINQ = 30,
            IPCPERM = 0600,
            MAXNODE = 2

*NODE
DEFAULT     TMAXHOME = "/app/tmax",
            PATHDIR = "/app/tmax/path",
            TLOGDIR = "/app/tmax/log/tlog",
            ULOGDIR = "/app/tmax/log/ulog",
            SLOGDIR = "/app/tmax/log/slog",
            NODETYPE = SHM_RACD,
            AUTOBACKUP = Y,
            MAXGWCPC = 16,
            MAXGWSVR = 8,
            CLHOPT = "-o /app/tmax/log/clh/clh.log"

COR01       HOSTNAME = "tp-cor01",
            TMAXDIR = "/app/tmax/cor01",
            APPDIR = "/app/tmax/cor01/appbin"

COR02       HOSTNAME = "tp-cor02",
            TMAXDIR = "/app/tmax/cor02",
            APPDIR = "/app/tmax/cor02/appbin"

*SVRGROUP
AAA_SVG     NODENAME = COR01,
            COUSIN = ABA_SVG,
            LOAD = 1,
            BACKUP = AAA_BAK_SVG,
            ENVFILE = "/app/tmax/env/aaa.env"

ABA_SVG     NODENAME = COR01,
            COUSIN = AAA_SVG,
            LOAD = 2,
            BACKUP = ABA_BAK_SVG,
            ENVFILE = "/app/tmax/env/aba.env"

ORD_SVG     NODENAME = COR02,
            COUSIN = PAY_SVG,
            LOAD = 1,
            BACKUP = ORD_BAK_SVG,
            ENVFILE = "/app/tmax/env/ord.env"

PAY_SVG     NODENAME = COR02,
            COUSIN = ORD_SVG,
            LOAD = 2,
            BACKUP = PAY_BAK_SVG,
            ENVFILE = "/app/tmax/env/pay.env"

COM_SVG     NODENAME = COR01,
            COUSIN = ORD_SVG,
            LOAD = 1,
            BACKUP = COM_BAK_SVG,
            ENVFILE = "/app/tmax/env/com.env"

*SERVER
DEFAULT     MIN = 1,
            MAX = 2,
            ASQCOUNT = 10,
            MAXQCOUNT = 100,
            RESTART = Y,
            MAXRSTART = 3,
            GPERIOD = 60,
            CLOPT = "-o /app/tmax/log/server/default.out -e /app/tmax/log/server/default.err"

AAA001SVR   SVGNAME = AAA_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/aaa001.out -e /app/tmax/log/server/aaa001.err",
            MIN = 2,
            MAX = 5,
            TARGET = "aaa001",
            SCHEDULE = RR,
            MAXQCOUNT = 200,
            CPC = 2,
            ASQCOUNT = 20,
            RESTART = Y,
            MAXRSTART = 5,
            GPERIOD = 60

AAA002SVR   SVGNAME = AAA_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/aaa002.out -e /app/tmax/log/server/aaa002.err",
            MIN = 1,
            MAX = 3,
            TARGET = "aaa002",
            SCHEDULE = FA,
            MAXQCOUNT = 150,
            CPC = 1,
            ASQCOUNT = 15,
            RESTART = Y,
            MAXRSTART = 3,
            GPERIOD = 60

ABA001SVR   SVGNAME = ABA_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/aba001.out -e /app/tmax/log/server/aba001.err",
            MIN = 2,
            MAX = 4,
            TARGET = "aba001",
            SCHEDULE = RR,
            MAXQCOUNT = 180,
            CPC = 2,
            ASQCOUNT = 20,
            RESTART = Y,
            MAXRSTART = 4,
            GPERIOD = 60

ORD001SVR   SVGNAME = ORD_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/ord001.out -e /app/tmax/log/server/ord001.err",
            MIN = 3,
            MAX = 8,
            TARGET = "ord001",
            SCHEDULE = RR,
            MAXQCOUNT = 300,
            CPC = 3,
            ASQCOUNT = 30,
            RESTART = Y,
            MAXRSTART = 5,
            GPERIOD = 60

PAY001SVR   SVGNAME = PAY_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/pay001.out -e /app/tmax/log/server/pay001.err",
            MIN = 2,
            MAX = 6,
            TARGET = "pay001",
            SCHEDULE = RR,
            MAXQCOUNT = 250,
            CPC = 2,
            ASQCOUNT = 25,
            RESTART = Y,
            MAXRSTART = 5,
            GPERIOD = 60

COM001SVR   SVGNAME = COM_SVG,
            SVRTYPE = STD,
            CLOPT = "-o /app/tmax/log/server/com001.out -e /app/tmax/log/server/com001.err",
            MIN = 1,
            MAX = 4,
            TARGET = "com001",
            SCHEDULE = FA,
            MAXQCOUNT = 120,
            CPC = 1,
            ASQCOUNT = 10,
            RESTART = Y,
            MAXRSTART = 3,
            GPERIOD = 60

*SERVICE
SAAA100U    SVRNAME = AAA001SVR,
            SVCTIME = 30

SAAA101Q    SVRNAME = AAA001SVR,
            SVCTIME = 20

SAAA102U    SVRNAME = AAA002SVR,
            SVCTIME = 30

SAAA103Q    SVRNAME = AAA002SVR,
            SVCTIME = 20

SABA110U    SVRNAME = ABA001SVR,
            SVCTIME = 30

SABA111Q    SVRNAME = ABA001SVR,
            SVCTIME = 20

SABA112U    SVRNAME = ABA001SVR,
            SVCTIME = 30

SABA113Q    SVRNAME = ABA001SVR,
            SVCTIME = 20

SORD200U    SVRNAME = ORD001SVR,
            SVCTIME = 40

SORD201Q    SVRNAME = ORD001SVR,
            SVCTIME = 25

SORD202U    SVRNAME = ORD001SVR,
            SVCTIME = 40

SORD203Q    SVRNAME = ORD001SVR,
            SVCTIME = 25

SPAY300U    SVRNAME = PAY001SVR,
            SVCTIME = 35

SPAY301Q    SVRNAME = PAY001SVR,
            SVCTIME = 20

SPAY302U    SVRNAME = PAY001SVR,
            SVCTIME = 35

SCOM900Q    SVRNAME = COM001SVR,
            SVCTIME = 15

SCOM901U    SVRNAME = COM001SVR,
            SVCTIME = 20

*GATEWAY
GW_COR01    GWTYPE = TMAX,
            NODENAME = COR01,
            PORTNO = 9101,
            RGWPORTNO = 9201,
            RGWADDR = "10.10.20.11",
            CPC = 2,
            CLOPT = "-o /app/tmax/log/gateway/gw_cor01.out -e /app/tmax/log/gateway/gw_cor01.err",
            LOAD = 1,
            BACKUP_RGWADDR = "10.10.20.12",
            BACKUP_RGWPORTNO = 9202

GW_COR02    GWTYPE = TMAX,
            NODENAME = COR02,
            PORTNO = 9102,
            RGWPORTNO = 9301,
            RGWADDR = "10.10.30.11",
            CPC = 2,
            CLOPT = "-o /app/tmax/log/gateway/gw_cor02.out -e /app/tmax/log/gateway/gw_cor02.err",
            LOAD = 2,
            BACKUP_RGWADDR = "10.10.30.12",
            BACKUP_RGWPORTNO = 9302
