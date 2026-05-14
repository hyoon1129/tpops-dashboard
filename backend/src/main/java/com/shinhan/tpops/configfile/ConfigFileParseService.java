package com.shinhan.tpops.configfile;

import com.shinhan.tpops.businesscode.BusinessCode;
import com.shinhan.tpops.businesscode.BusinessCodeRepository;
import com.shinhan.tpops.configquery.ConfigFileDetailResponse;
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
import com.shinhan.tpops.parser.TmaxConfigParser;
import com.shinhan.tpops.serverconfig.ServerConfig;
import com.shinhan.tpops.serverconfig.ServerConfigRepository;
import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.serverinfo.ServerInfoRepository;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfigRepository;
import java.io.IOException;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ConfigFileParseService {

	private static final Charset CONFIG_FILE_CHARSET = Charset.forName("EUC-KR");

	private final ServerInfoRepository serverInfoRepository;
	private final ConfigFileRepository configFileRepository;
	private final DomainConfigRepository domainConfigRepository;
	private final NodeConfigRepository nodeConfigRepository;
	private final SvrgroupConfigRepository svrgroupConfigRepository;
	private final ServerConfigRepository serverConfigRepository;
	private final ServiceConfigRepository serviceConfigRepository;
	private final GatewayConfigRepository gatewayConfigRepository;
	private final BusinessCodeRepository businessCodeRepository;
	private final TmaxConfigParser tmaxConfigParser;

	@Transactional
	public ConfigFileResponse parse(Long serverId, MultipartFile file) {
		ServerInfo serverInfo = serverInfoRepository.findById(serverId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Server not found. serverId=" + serverId));

		byte[] bytes = readBytes(file);
		String fileContent = new String(bytes, CONFIG_FILE_CHARSET);
		ParsedTmaxConfig parsedConfig = tmaxConfigParser.parse(fileContent);
		String fileHash = sha256(bytes);
		ConfigFile currentConfigFile = configFileRepository.findByServerInfoIdAndCurrentTrue(serverId).orElse(null);
		if (currentConfigFile != null) {
			currentConfigFile.markNotCurrent();
		}

		Integer versionNo = nextVersionNo(serverId);
		ConfigFile configFile = configFileRepository.save(new ConfigFile(
			serverInfo,
			fileName(file),
			versionNo,
			true,
			fileHash,
			fileContent
		));

		saveParsedConfig(configFile, parsedConfig);
		configFile.markSuccess();

		return ConfigFileResponse.from(configFile);
	}

	@Transactional(readOnly = true)
	public List<ConfigFileResponse> findHistory(Long serverId) {
		if (!serverInfoRepository.existsById(serverId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Server not found. serverId=" + serverId);
		}

		return configFileRepository.findByServerInfoIdOrderByVersionNoDesc(serverId).stream()
			.map(ConfigFileResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public ConfigFileDetailResponse findDetail(Long serverId, Long fileId) {
		ConfigFile configFile = configFileRepository.findById(fileId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Config file not found. fileId=" + fileId));
		if (!configFile.getServerInfo().getId().equals(serverId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Config file not found. fileId=" + fileId);
		}
		return ConfigFileDetailResponse.from(configFile);
	}

	private byte[] readBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot read config file.", exception);
		}
	}

	private String sha256(byte[] bytes) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			byte[] digest = messageDigest.digest(bytes);
			StringBuilder builder = new StringBuilder();
			for (byte value : digest) {
				builder.append(String.format("%02x", value));
			}
			return builder.toString();
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 algorithm is not available.", exception);
		}
	}

	private String fileName(MultipartFile file) {
		String originalFilename = file.getOriginalFilename();
		if (originalFilename == null || originalFilename.isBlank()) {
			return "uploaded.m";
		}
		return originalFilename;
	}

	private Integer nextVersionNo(Long serverId) {
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

	private Map<String, DomainConfig> saveDomains(ConfigFile configFile, ParsedTmaxConfig parsedConfig) {
		List<DomainConfig> domainConfigs = parsedConfig.entries(ConfigSection.DOMAIN).stream()
			.map(entry -> new DomainConfig(configFile, entry.name(), entry.values(), entry.startLine(), entry.endLine()))
			.toList();
		return domainConfigRepository.saveAll(domainConfigs).stream()
			.collect(Collectors.toMap(DomainConfig::getDomainName, Function.identity()));
	}

	private Map<String, NodeConfig> saveNodes(ConfigFile configFile, ParsedTmaxConfig parsedConfig, Map<String, DomainConfig> domains) {
		ParsedConfigEntry defaultEntry = findDefault(parsedConfig.entries(ConfigSection.NODE));
		DomainConfig domainConfig = domains.size() == 1 ? domains.values().iterator().next() : null;

		List<NodeConfig> nodeConfigs = parsedConfig.entries(ConfigSection.NODE).stream()
			.filter(entry -> !isDefault(entry))
			.map(entry -> new NodeConfig(configFile, domainConfig, entry.name(), mergedValues(defaultEntry, entry), entry.startLine(), entry.endLine()))
			.toList();
		return nodeConfigRepository.saveAll(nodeConfigs).stream()
			.collect(Collectors.toMap(NodeConfig::getNodeName, Function.identity()));
	}

	private Map<String, SvrgroupConfig> saveSvrgroups(ConfigFile configFile, ParsedTmaxConfig parsedConfig, Map<String, NodeConfig> nodes) {
		List<SvrgroupConfig> svrgroupConfigs = parsedConfig.entries(ConfigSection.SVRGROUP).stream()
			.map(entry -> new SvrgroupConfig(
				configFile,
				nodes.get(entry.values().get("NODENAME")),
				entry.name(),
				entry.values(),
				entry.startLine(),
				entry.endLine()
			))
			.toList();
		return svrgroupConfigRepository.saveAll(svrgroupConfigs).stream()
			.collect(Collectors.toMap(SvrgroupConfig::getSvrgroupName, Function.identity()));
	}

	private Map<String, ServerConfig> saveServers(ConfigFile configFile, ParsedTmaxConfig parsedConfig, Map<String, SvrgroupConfig> svrgroups) {
		ParsedConfigEntry defaultEntry = findDefault(parsedConfig.entries(ConfigSection.SERVER));
		List<ServerConfig> serverConfigs = parsedConfig.entries(ConfigSection.SERVER).stream()
			.filter(entry -> !isDefault(entry))
			.map(entry -> {
				Map<String, String> values = mergedValues(defaultEntry, entry);
				return new ServerConfig(
					configFile,
					svrgroups.get(values.get("SVGNAME")),
					entry.name(),
					values,
					entry.startLine(),
					entry.endLine()
				);
			})
			.toList();
		return serverConfigRepository.saveAll(serverConfigs).stream()
			.collect(Collectors.toMap(ServerConfig::getServerName, Function.identity()));
	}

	private void saveServices(ConfigFile configFile, ParsedTmaxConfig parsedConfig, Map<String, ServerConfig> servers) {
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

	private void saveGateways(ConfigFile configFile, ParsedTmaxConfig parsedConfig, Map<String, NodeConfig> nodes) {
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
		return entries.stream()
			.filter(this::isDefault)
			.findFirst()
			.orElse(null);
	}

	private boolean isDefault(ParsedConfigEntry entry) {
		return "DEFAULT".equalsIgnoreCase(entry.name());
	}

	private Map<String, String> mergedValues(ParsedConfigEntry defaultEntry, ParsedConfigEntry entry) {
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
