package com.shinhan.tpops.configfile;

import static org.assertj.core.api.Assertions.assertThat;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.businesscode.BusinessCodeRepository;
import com.shinhan.tpops.configquery.ConfigFileResponse;
import com.shinhan.tpops.domainconfig.DomainConfigRepository;
import com.shinhan.tpops.gatewayconfig.GatewayConfigRepository;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.nodeconfig.NodeConfigRepository;
import com.shinhan.tpops.serverconfig.ServerConfig;
import com.shinhan.tpops.serverconfig.ServerConfigRepository;
import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.serverinfo.ServerInfoRepository;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfigRepository;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ConfigFileParseServiceTest {

	@Autowired
	private ConfigFileParseService configFileParseService;

	@Autowired
	private ServerInfoRepository serverInfoRepository;

	@Autowired
	private BusinessCodeRepository businessCodeRepository;

	@Autowired
	private ConfigFileRepository configFileRepository;

	@Autowired
	private DomainConfigRepository domainConfigRepository;

	@Autowired
	private NodeConfigRepository nodeConfigRepository;

	@Autowired
	private SvrgroupConfigRepository svrgroupConfigRepository;

	@Autowired
	private ServerConfigRepository serverConfigRepository;

	@Autowired
	private ServiceConfigRepository serviceConfigRepository;

	@Autowired
	private GatewayConfigRepository gatewayConfigRepository;

	@Test
	void parsesSampleConfigFileAndStoresSections() throws Exception {
		ServerInfo serverInfo = serverInfoRepository.save(new ServerInfo(
			"TPDOM01-TEST",
			"127.0.0.1",
			"TEST",
			"Parser integration test"
		));
		saveBusinessCodes();

		ConfigFileResponse response = configFileParseService.parse(serverInfo.getId(), sampleConfigFile());

		assertThat(response.parseStatus()).isEqualTo(ParseStatus.SUCCESS);
		assertThat(response.versionNo()).isEqualTo(1);
		assertThat(response.current()).isTrue();
		assertThat(configFileRepository.findByServerInfoIdAndCurrentTrue(serverInfo.getId())).isPresent();

		assertThat(domainConfigRepository.findByConfigFileId(response.fileId())).hasSize(1);
		assertThat(nodeConfigRepository.findByConfigFileId(response.fileId())).hasSize(2);
		assertThat(svrgroupConfigRepository.findByConfigFileId(response.fileId())).hasSize(5);
		assertThat(serverConfigRepository.findByConfigFileId(response.fileId())).hasSize(6);
		assertThat(serviceConfigRepository.findByConfigFileId(response.fileId())).hasSize(19);
		assertThat(gatewayConfigRepository.findByConfigFileId(response.fileId())).hasSize(2);

		NodeConfig cor01 = nodeConfigRepository.findByConfigFileId(response.fileId()).stream()
			.filter(nodeConfig -> nodeConfig.getNodeName().equals("COR01"))
			.findFirst()
			.orElseThrow();
		assertThat(cor01.getTmaxhome()).isEqualTo("/app/tmax");
		assertThat(cor01.getPathdir()).isEqualTo("/app/tmax/path");
		assertThat(cor01.getNodetype()).isEqualTo("SHM_RACD");
		assertThat(cor01.getMaxgwcpc()).isEqualTo(16);
		assertThat(cor01.getDomainConfig()).isNotNull();

		ServerConfig aaa002 = serverConfigRepository.findByConfigFileId(response.fileId()).stream()
			.filter(serverConfig -> serverConfig.getServerName().equals("AAA002SVR"))
			.findFirst()
			.orElseThrow();
		assertThat(aaa002.getSvrgroupConfig()).isNotNull();
		assertThat(aaa002.getSvgname()).isEqualTo("AAA_SVG");
		assertThat(aaa002.getMinValue()).isEqualTo(1);
		assertThat(aaa002.getMaxValue()).isEqualTo(3);
		assertThat(aaa002.getRestart()).isEqualTo("Y");

		assertThat(serviceConfigRepository.findByConfigFileId(response.fileId()))
			.filteredOn(serviceConfig -> serviceConfig.getServiceName().equals("SABA113Q"))
			.singleElement()
			.satisfies(serviceConfig -> {
				assertThat(serviceConfig.getServerConfig()).isNotNull();
				assertThat(serviceConfig.getBusinessCode()).isNotNull();
				assertThat(serviceConfig.getBusinessCode().getCode()).isEqualTo("ABA");
				assertThat(serviceConfig.getBusinessCode().getBusinessName()).isEqualTo("고객관리");
			});

		assertThat(serviceConfigRepository.findByConfigFileId(response.fileId()))
			.filteredOn(serviceConfig -> serviceConfig.getServiceName().equals("SAAA709U4"))
			.singleElement()
			.satisfies(serviceConfig -> {
				assertThat(serviceConfig.getBusinessCode()).isNotNull();
				assertThat(serviceConfig.getBusinessCode().getCode()).isEqualTo("AAA");
				assertThat(serviceConfig.getBusinessCode().getBusinessName()).isEqualTo("계좌관리");
			});

		assertThat(serviceConfigRepository.findByConfigFileId(response.fileId()))
			.filteredOn(serviceConfig -> serviceConfig.getServiceName().equals("XABA999Q"))
			.singleElement()
			.satisfies(serviceConfig -> {
				assertThat(serviceConfig.getBusinessCode()).isNotNull();
				assertThat(serviceConfig.getBusinessCode().getCode()).isEqualTo("ABA");
				assertThat(serviceConfig.getBusinessCode().getBusinessName()).isEqualTo("고객관리");
			});
	}

	private void saveBusinessCodes() {
		businessCodeRepository.save(new BusinessCode("AAA", "계좌관리"));
		businessCodeRepository.save(new BusinessCode("ABA", "고객관리"));
		businessCodeRepository.save(new BusinessCode("ORD", "주문관리"));
		businessCodeRepository.save(new BusinessCode("PAY", "결제관리"));
		businessCodeRepository.save(new BusinessCode("COM", "공통업무"));
	}

	private MockMultipartFile sampleConfigFile() throws Exception {
		String content = """
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
			AAA_SVG     NODENAME = COR01, COUSIN = ABA_SVG, LOAD = 1, BACKUP = AAA_BAK_SVG
			ABA_SVG     NODENAME = COR01, COUSIN = AAA_SVG, LOAD = 2, BACKUP = ABA_BAK_SVG
			ORD_SVG     NODENAME = COR02, COUSIN = PAY_SVG, LOAD = 1, BACKUP = ORD_BAK_SVG
			PAY_SVG     NODENAME = COR02, COUSIN = ORD_SVG, LOAD = 2, BACKUP = PAY_BAK_SVG
			COM_SVG     NODENAME = COR01, COUSIN = ORD_SVG, LOAD = 1, BACKUP = COM_BAK_SVG

			*SERVER
			DEFAULT     MIN = 1, MAX = 2, ASQCOUNT = 10, MAXQCOUNT = 100, RESTART = Y, MAXRSTART = 3, GPERIOD = 60

			AAA001SVR   SVGNAME = AAA_SVG, SVRTYPE = STD, MIN = 2, MAX = 5, TARGET = "aaa001", SCHEDULE = RR
			AAA002SVR   SVGNAME = AAA_SVG, SVRTYPE = STD, MIN = 1, MAX = 3, TARGET = "aaa002", SCHEDULE = FA
			ABA001SVR   SVGNAME = ABA_SVG, SVRTYPE = STD, MIN = 2, MAX = 4, TARGET = "aba001", SCHEDULE = RR
			ORD001SVR   SVGNAME = ORD_SVG, SVRTYPE = STD, MIN = 3, MAX = 8, TARGET = "ord001", SCHEDULE = RR
			PAY001SVR   SVGNAME = PAY_SVG, SVRTYPE = STD, MIN = 2, MAX = 6, TARGET = "pay001", SCHEDULE = RR
			COM001SVR   SVGNAME = COM_SVG, SVRTYPE = STD, MIN = 1, MAX = 4, TARGET = "com001", SCHEDULE = FA

			*SERVICE
			SAAA100U    SVRNAME = AAA001SVR, SVCTIME = 30
			SAAA101Q    SVRNAME = AAA001SVR, SVCTIME = 20
			SAAA102U    SVRNAME = AAA002SVR, SVCTIME = 30
			SAAA103Q    SVRNAME = AAA002SVR, SVCTIME = 20
			SAAA709U4   SVRNAME = AAA002SVR, SVCTIME = 30
			XABA999Q    SVRNAME = ABA001SVR, SVCTIME = 30
			SABA110U    SVRNAME = ABA001SVR, SVCTIME = 30
			SABA111Q    SVRNAME = ABA001SVR, SVCTIME = 20
			SABA112U    SVRNAME = ABA001SVR, SVCTIME = 30
			SABA113Q    SVRNAME = ABA001SVR, SVCTIME = 20
			SORD200U    SVRNAME = ORD001SVR, SVCTIME = 40
			SORD201Q    SVRNAME = ORD001SVR, SVCTIME = 25
			SORD202U    SVRNAME = ORD001SVR, SVCTIME = 40
			SORD203Q    SVRNAME = ORD001SVR, SVCTIME = 25
			SPAY300U    SVRNAME = PAY001SVR, SVCTIME = 35
			SPAY301Q    SVRNAME = PAY001SVR, SVCTIME = 20
			SPAY302U    SVRNAME = PAY001SVR, SVCTIME = 35
			SCOM900Q    SVRNAME = COM001SVR, SVCTIME = 15
			SCOM901U    SVRNAME = COM001SVR, SVCTIME = 20

			*GATEWAY
			GW_COR01    GWTYPE = TMAX, NODENAME = COR01, PORTNO = 9101, RGWPORTNO = 9201, RGWADDR = "10.10.20.11"
			GW_COR02    GWTYPE = TMAX, NODENAME = COR02, PORTNO = 9102, RGWPORTNO = 9301, RGWADDR = "10.10.30.11"
			""";
		return new MockMultipartFile("file", "tpdom01.m", "text/plain", content.getBytes(StandardCharsets.UTF_8));
	}
}
