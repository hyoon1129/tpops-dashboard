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
import java.io.InputStream;
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
		assertThat(serviceConfigRepository.findByConfigFileId(response.fileId())).hasSize(17);
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
	}

	private void saveBusinessCodes() {
		businessCodeRepository.save(new BusinessCode("AAA", "계좌관리"));
		businessCodeRepository.save(new BusinessCode("ABA", "고객관리"));
		businessCodeRepository.save(new BusinessCode("ORD", "주문관리"));
		businessCodeRepository.save(new BusinessCode("PAY", "결제관리"));
		businessCodeRepository.save(new BusinessCode("COM", "공통업무"));
	}

	private MockMultipartFile sampleConfigFile() throws Exception {
		InputStream inputStream = getClass().getResourceAsStream("/sample/tpdom01.m");
		return new MockMultipartFile("file", "tpdom01.m", "text/plain", inputStream);
	}
}
