package com.shinhan.tpops.configquery;

import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.configfile.ConfigFileRepository;
import com.shinhan.tpops.domainconfig.DomainConfigRepository;
import com.shinhan.tpops.gatewayconfig.GatewayConfigRepository;
import com.shinhan.tpops.nodeconfig.NodeConfigRepository;
import com.shinhan.tpops.serverconfig.ServerConfigRepository;
import com.shinhan.tpops.serviceconfig.ServiceConfigRepository;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfigRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ConfigQueryService {

	private final ConfigFileRepository configFileRepository;
	private final DomainConfigRepository domainConfigRepository;
	private final NodeConfigRepository nodeConfigRepository;
	private final SvrgroupConfigRepository svrgroupConfigRepository;
	private final ServerConfigRepository serverConfigRepository;
	private final ServiceConfigRepository serviceConfigRepository;
	private final GatewayConfigRepository gatewayConfigRepository;

	@Transactional(readOnly = true)
	public ConfigFileResponse findCurrentConfigFile(Long serverId) {
		return ConfigFileResponse.from(findCurrentConfigFileEntity(serverId));
	}

	@Transactional(readOnly = true)
	public List<DomainConfigResponse> findDomains(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return domainConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(DomainConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<NodeConfigResponse> findNodes(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return nodeConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(NodeConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<SvrgroupConfigResponse> findSvrgroups(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return svrgroupConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(SvrgroupConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<ServerConfigResponse> findServerConfigs(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return serverConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(ServerConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<ServiceConfigResponse> findServices(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return serviceConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(ServiceConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public List<GatewayConfigResponse> findGateways(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return gatewayConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(GatewayConfigResponse::from)
			.toList();
	}

	private ConfigFile findCurrentConfigFileEntity(Long serverId) {
		return configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Current config file not found for serverId=" + serverId
			));
	}
}
