package com.shinhan.tpops.search;

import static org.assertj.core.api.Assertions.assertThat;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.businesscode.BusinessCodeRepository;
import com.shinhan.tpops.configfile.ConfigFileParseService;
import com.shinhan.tpops.parser.ConfigSection;
import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.serverinfo.ServerInfoRepository;
import java.io.InputStream;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ConfigSearchServiceTest {

	@Autowired
	private ConfigSearchService configSearchService;

	@Autowired
	private ConfigFileParseService configFileParseService;

	@Autowired
	private ServerInfoRepository serverInfoRepository;

	@Autowired
	private BusinessCodeRepository businessCodeRepository;

	@Test
	void searchesAcrossAllSectionsByKeyword() throws Exception {
		Long serverId = parseSampleConfig();

		List<SearchResultResponse> results = configSearchService.search(serverId, null, "AAA");

		assertThat(results)
			.anySatisfy(result -> {
				assertThat(result.section()).isEqualTo(ConfigSection.SVRGROUP);
				assertThat(result.name()).isEqualTo("AAA_SVG");
				assertThat(result.matchedField()).isEqualTo("svrgroupName");
			})
			.anySatisfy(result -> {
				assertThat(result.section()).isEqualTo(ConfigSection.SERVER);
				assertThat(result.name()).isEqualTo("AAA001SVR");
				assertThat(result.matchedField()).isEqualTo("serverName");
			})
			.anySatisfy(result -> {
				assertThat(result.section()).isEqualTo(ConfigSection.SERVICE);
				assertThat(result.name()).isEqualTo("SAAA100U");
				assertThat(result.matchedField()).isEqualTo("businessCode");
			});
	}

	@Test
	void searchesOnlyRequestedSection() throws Exception {
		Long serverId = parseSampleConfig();

		List<SearchResultResponse> results = configSearchService.search(serverId, ConfigSection.SERVICE, "AAA");

		assertThat(results).isNotEmpty();
		assertThat(results).allSatisfy(result -> assertThat(result.section()).isEqualTo(ConfigSection.SERVICE));
	}

	@Test
	void searchesBusinessNameInServices() throws Exception {
		Long serverId = parseSampleConfig();

		List<SearchResultResponse> results = configSearchService.search(serverId, ConfigSection.SERVICE, "고객관리");

		assertThat(results)
			.extracting(SearchResultResponse::matchedField)
			.containsOnly("businessName");
		assertThat(results)
			.extracting(SearchResultResponse::name)
			.contains("SABA110U", "SABA113Q");
	}

	private Long parseSampleConfig() throws Exception {
		ServerInfo serverInfo = serverInfoRepository.save(new ServerInfo(
			"TPDOM01-SEARCH-TEST",
			"127.0.0.1",
			"TEST",
			"Search integration test"
		));
		saveBusinessCodes();
		configFileParseService.parse(serverInfo.getId(), sampleConfigFile());
		return serverInfo.getId();
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
