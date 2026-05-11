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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
	public PageResponse<DomainConfigResponse> findDomains(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(domainConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(DomainConfigResponse::from));
	}

	@Transactional(readOnly = true)
	public List<NodeConfigResponse> findNodes(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return nodeConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(NodeConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<NodeConfigResponse> findNodes(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(nodeConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(NodeConfigResponse::from));
	}

	@Transactional(readOnly = true)
	public List<SvrgroupConfigResponse> findSvrgroups(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return svrgroupConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(SvrgroupConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<SvrgroupConfigResponse> findSvrgroups(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(svrgroupConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(SvrgroupConfigResponse::from));
	}

	@Transactional(readOnly = true)
	public List<ServerConfigResponse> findServerConfigs(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return serverConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(ServerConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<ServerConfigResponse> findServerConfigs(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(serverConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(ServerConfigResponse::from));
	}

	@Transactional(readOnly = true)
	public List<ServiceConfigResponse> findServices(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return serviceConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(ServiceConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<ServiceConfigResponse> findServices(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(serviceConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(ServiceConfigResponse::from));
	}

	@Transactional(readOnly = true)
	public List<GatewayConfigResponse> findGateways(Long serverId) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return gatewayConfigRepository.findByConfigFileId(configFile.getId()).stream()
			.map(GatewayConfigResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public PageResponse<GatewayConfigResponse> findGateways(Long serverId, int page, int size) {
		ConfigFile configFile = findCurrentConfigFileEntity(serverId);
		return PageResponse.from(gatewayConfigRepository.findByConfigFileId(configFile.getId(), pageRequest(page, size))
			.map(GatewayConfigResponse::from));
	}

	private ConfigFile findCurrentConfigFileEntity(Long serverId) {
		return configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
			.orElseThrow(() -> new ResponseStatusException(
				HttpStatus.NOT_FOUND,
				"Current config file not found for serverId=" + serverId
			));
	}

	private PageRequest pageRequest(int page, int size) {
		int normalizedPage = Math.max(page, 0);
		int normalizedSize = Math.max(1, Math.min(size, 200));
		return PageRequest.of(normalizedPage, normalizedSize, Sort.by("id").ascending());
	}
}
