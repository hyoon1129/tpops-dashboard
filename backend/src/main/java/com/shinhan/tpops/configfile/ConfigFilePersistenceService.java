package com.shinhan.tpops.configfile;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.businesscode.BusinessCodeRepository;
import com.shinhan.tpops.configquery.ConfigFileResponse;
import com.shinhan.tpops.domainconfig.DomainConfig;
import com.shinhan.tpops.domainconfig.DomainConfigRepository;
import com.shinhan.tpops.gatewayconfig.GatewayConfig;
import com.shinhan.tpops.gatewayconfig.GatewayConfigRepository;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.nodeconfig.NodeConfigRepository;
import com.shinhan.tpops.parser.ConfigSection;
import com.shinhan.tpops.parser.ParsedConfigEntry;
import com.shinhan.tpops.parser.ParsedTmaxConfig;
import com.shinhan.tpops.serverconfig.ServerConfig;
import com.shinhan.tpops.serverconfig.ServerConfigRepository;
import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfigRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
class ConfigFilePersistenceService {

	private final ConfigFileRepository configFileRepository;
	private final DomainConfigRepository domainConfigRepository;
	private final NodeConfigRepository nodeConfigRepository;
	private final SvrgroupConfigRepository svrgroupConfigRepository;
	private final ServerConfigRepository serverConfigRepository;
	private final ServiceConfigRepository serviceConfigRepository;
	private final GatewayConfigRepository gatewayConfigRepository;
	private final BusinessCodeRepository businessCodeRepository;

	/**
	 * 새 ConfigFile 레코드를 저장하고 즉시 커밋. 이후 파싱이 실패해도 이력이 남음.
	 * current=false 로 저장 — 파싱 성공 후 {@link #saveParsedAndMarkSuccess} 에서 current=true 로 전환.
	 */
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public ConfigFile saveInitial(ServerInfo serverInfo, String fileName, Integer versionNo,
		String fileHash, String fileContent) {
		return configFileRepository.save(
			new ConfigFile(serverInfo, fileName, versionNo, false, fileHash, fileContent));
	}

	/**
	 * 파싱 결과를 저장하고 SUCCESS 로 마킹. 기존 current 파일을 해제하고 신규 파일을 current=true 로 전환.
	 */
	@Transactional
	public ConfigFileResponse saveParsedAndMarkSuccess(Long fileId, Long serverId,
		ParsedTmaxConfig parsedConfig) {
		ConfigFile configFile = configFileRepository.findById(fileId).orElseThrow();
		saveParsedConfig(configFile, parsedConfig);
		configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
			.ifPresent(ConfigFile::markNotCurrent);
		configFile.markCurrent();
		configFile.markSuccess();
		return ConfigFileResponse.from(configFile);
	}

	/**
	 * 파싱 실패를 FAILED 상태로 기록하고 즉시 커밋.
	 * 외부 트랜잭션이 롤백되더라도 실패 이력이 저장됨.
	 */
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public ConfigFileResponse markFailed(Long fileId, String errorMessage) {
		ConfigFile configFile = configFileRepository.findById(fileId).orElseThrow();
		configFile.markFailed(errorMessage != null ? errorMessage : "알 수 없는 오류");
		return ConfigFileResponse.from(configFile);
	}

	Integer nextVersionNo(Long serverId) {
		return configFileRepository.findTopByServerInfoIdOrderByVersionNoDesc(serverId)
			.map(configFile -> configFile.getVersionNo() + 1)
			.orElse(1);
	}

	private void saveParsedConfig(ConfigFile configFile, ParsedTmaxConfig parsedConfig) {
		Map<String, DomainConfig> domains = saveDomains(configFile, parsedConfig);
		Map<String, NodeConfig> nodes = saveNodes(configFile, parsedConfig, domains);
		Map<String, SvrgroupConfig> svrgroups = saveSvrgroups(configFile, parsedConfig, nodes);
		Map<String, ServerConfig> servers = saveServers(configFile, parsedConfig, svrgroups);
		saveServices(configFile, parsedConfig, servers);
		saveGateways(configFile, parsedConfig, nodes);
	}

	private Map<String, DomainConfig> saveDomains(ConfigFile configFile,
		ParsedTmaxConfig parsedConfig) {
		List<DomainConfig> domainConfigs = parsedConfig.entries(ConfigSection.DOMAIN).stream()
			.map(entry -> new DomainConfig(configFile, entry.name(), entry.values(),
				entry.startLine(), entry.endLine()))
			.toList();
		return domainConfigRepository.saveAll(domainConfigs).stream()
			.collect(Collectors.toMap(DomainConfig::getDomainName, Function.identity()));
	}

	private Map<String, NodeConfig> saveNodes(ConfigFile configFile, ParsedTmaxConfig parsedConfig,
		Map<String, DomainConfig> domains) {
		ParsedConfigEntry defaultEntry = findDefault(parsedConfig.entries(ConfigSection.NODE));
		DomainConfig domainConfig =
			domains.size() == 1 ? domains.values().iterator().next() : null;

		List<NodeConfig> nodeConfigs = parsedConfig.entries(ConfigSection.NODE).stream()
			.filter(entry -> !isDefault(entry))
			.map(entry -> new NodeConfig(configFile, domainConfig, entry.name(),
				mergedValues(defaultEntry, entry), entry.startLine(), entry.endLine()))
			.toList();
		return nodeConfigRepository.saveAll(nodeConfigs).stream()
			.collect(Collectors.toMap(NodeConfig::getNodeName, Function.identity()));
	}

	private Map<String, SvrgroupConfig> saveSvrgroups(ConfigFile configFile,
		ParsedTmaxConfig parsedConfig, Map<String, NodeConfig> nodes) {
		List<SvrgroupConfig> svrgroupConfigs = parsedConfig.entries(ConfigSection.SVRGROUP).stream()
			.map(entry -> {
				NodeConfig nodeConfig = nodes.get(entry.values().get("NODENAME"));
				if (nodeConfig == null) {
					log.warn("SVRGROUP {} references unknown NODENAME: {}", entry.name(),
						entry.values().get("NODENAME"));
				}
				return new SvrgroupConfig(configFile, nodeConfig, entry.name(), entry.values(),
					entry.startLine(), entry.endLine());
			})
			.toList();
		return svrgroupConfigRepository.saveAll(svrgroupConfigs).stream()
			.collect(Collectors.toMap(SvrgroupConfig::getSvrgroupName, Function.identity()));
	}

	private Map<String, ServerConfig> saveServers(ConfigFile configFile,
		ParsedTmaxConfig parsedConfig, Map<String, SvrgroupConfig> svrgroups) {
		ParsedConfigEntry defaultEntry = findDefault(parsedConfig.entries(ConfigSection.SERVER));
		List<ServerConfig> serverConfigs = parsedConfig.entries(ConfigSection.SERVER).stream()
			.filter(entry -> !isDefault(entry))
			.map(entry -> {
				Map<String, String> values = mergedValues(defaultEntry, entry);
				SvrgroupConfig svrgroupConfig = svrgroups.get(values.get("SVGNAME"));
				if (svrgroupConfig == null) {
					log.warn("SERVER {} references unknown SVGNAME: {}", entry.name(),
						values.get("SVGNAME"));
				}
				return new ServerConfig(configFile, svrgroupConfig, entry.name(), values,
					entry.startLine(), entry.endLine());
			})
			.toList();
		return serverConfigRepository.saveAll(serverConfigs).stream()
			.collect(Collectors.toMap(ServerConfig::getServerName, Function.identity()));
	}

	private void saveServices(ConfigFile configFile, ParsedTmaxConfig parsedConfig,
		Map<String, ServerConfig> servers) {
		List<ServiceConfig> serviceConfigs = parsedConfig.entries(ConfigSection.SERVICE).stream()
			.map(entry -> new ServiceConfig(
				configFile,
				servers.get(entry.values().get("SVRNAME")),
				findBusinessCode(entry.name()),
				entry.name(),
				entry.values(),
				entry.startLine(),
				entry.endLine()
			))
			.toList();
		serviceConfigRepository.saveAll(serviceConfigs);
	}

	private void saveGateways(ConfigFile configFile, ParsedTmaxConfig parsedConfig,
		Map<String, NodeConfig> nodes) {
		List<GatewayConfig> gatewayConfigs = parsedConfig.entries(ConfigSection.GATEWAY).stream()
			.map(entry -> new GatewayConfig(
				configFile,
				nodes.get(entry.values().get("NODENAME")),
				entry.name(),
				entry.values(),
				entry.startLine(),
				entry.endLine()
			))
			.toList();
		gatewayConfigRepository.saveAll(gatewayConfigs);
	}

	private ParsedConfigEntry findDefault(List<ParsedConfigEntry> entries) {
		return entries.stream().filter(this::isDefault).findFirst().orElse(null);
	}

	private boolean isDefault(ParsedConfigEntry entry) {
		return "DEFAULT".equalsIgnoreCase(entry.name());
	}

	private Map<String, String> mergedValues(ParsedConfigEntry defaultEntry,
		ParsedConfigEntry entry) {
		Map<String, String> values = new LinkedHashMap<>();
		if (defaultEntry != null) {
			values.putAll(defaultEntry.values());
		}
		values.putAll(entry.values());
		return values;
	}

	private BusinessCode findBusinessCode(String serviceName) {
		if (serviceName == null || serviceName.length() < 4) {
			return null;
		}
		String code = serviceName.substring(1, 4).toUpperCase();
		return businessCodeRepository.findById(code).orElse(null);
	}
}
