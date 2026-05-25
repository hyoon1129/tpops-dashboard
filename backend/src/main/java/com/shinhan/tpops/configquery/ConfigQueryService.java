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
import java.util.Optional;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
		return currentConfigList(serverId, fileId -> domainConfigRepository.findByConfigFileId(fileId).stream()
			.map(DomainConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<DomainConfigResponse> findDomains(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? domainConfigRepository.findByConfigFileIdAndDomainNameContainingIgnoreCase(fileId, keyword, pr)
				: domainConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(DomainConfigResponse::from);
		});
	}

	@Transactional(readOnly = true)
	public List<NodeConfigResponse> findNodes(Long serverId) {
		return currentConfigList(serverId, fileId -> nodeConfigRepository.findByConfigFileId(fileId).stream()
			.map(NodeConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<NodeConfigResponse> findNodes(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? nodeConfigRepository.findByConfigFileIdAndNodeNameContainingIgnoreCase(fileId, keyword, pr)
				: nodeConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(NodeConfigResponse::from);
		});
	}

	@Transactional(readOnly = true)
	public List<SvrgroupConfigResponse> findSvrgroups(Long serverId) {
		return currentConfigList(serverId, fileId -> svrgroupConfigRepository.findByConfigFileId(fileId).stream()
			.map(SvrgroupConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<SvrgroupConfigResponse> findSvrgroups(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? svrgroupConfigRepository.findByConfigFileIdAndSvrgroupNameContainingIgnoreCase(fileId, keyword, pr)
				: svrgroupConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(SvrgroupConfigResponse::from);
		});
	}

	@Transactional(readOnly = true)
	public List<ServerConfigResponse> findServerConfigs(Long serverId) {
		return currentConfigList(serverId, fileId -> serverConfigRepository.findByConfigFileId(fileId).stream()
			.map(ServerConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<ServerConfigResponse> findServerConfigs(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? serverConfigRepository.findByConfigFileIdAndServerNameContainingIgnoreCase(fileId, keyword, pr)
				: serverConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(ServerConfigResponse::from);
		});
	}

	@Transactional(readOnly = true)
	public List<ServiceConfigResponse> findServices(Long serverId) {
		return currentConfigList(serverId, fileId -> serviceConfigRepository.findByConfigFileId(fileId).stream()
			.map(ServiceConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<ServiceConfigResponse> findServices(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? serviceConfigRepository.findByConfigFileIdAndServiceNameContainingIgnoreCase(fileId, keyword, pr)
				: serviceConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(ServiceConfigResponse::from);
		});
	}

	@Transactional(readOnly = true)
	public List<GatewayConfigResponse> findGateways(Long serverId) {
		return currentConfigList(serverId, fileId -> gatewayConfigRepository.findByConfigFileId(fileId).stream()
			.map(GatewayConfigResponse::from)
			.toList());
	}

	@Transactional(readOnly = true)
	public PageResponse<GatewayConfigResponse> findGateways(Long serverId, int page, int size, String sort, Sort.Direction direction, String keyword) {
		PageRequest pr = pageRequest(page, size, sort, direction);
		return currentConfigPage(serverId, pr, fileId -> {
			var result = (keyword != null && !keyword.isBlank())
				? gatewayConfigRepository.findByConfigFileIdAndGatewayNameContainingIgnoreCase(fileId, keyword, pr)
				: gatewayConfigRepository.findByConfigFileId(fileId, pr);
			return result.map(GatewayConfigResponse::from);
		});
	}

	private ConfigFile findCurrentConfigFileEntity(Long serverId) {
			return configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
				.orElseThrow(() -> new ResponseStatusException(
					HttpStatus.NOT_FOUND,
					"Current config file not found for serverId=" + serverId
				));
	}

	private Optional<Long> findCurrentConfigFileId(Long serverId) {
		return configFileRepository.findByServerInfoIdAndCurrentTrue(serverId)
			.map(ConfigFile::getId);
	}

	private <T> List<T> currentConfigList(Long serverId, Function<Long, List<T>> finder) {
		return findCurrentConfigFileId(serverId)
			.map(finder)
			.orElseGet(List::of);
	}

	private <T> PageResponse<T> currentConfigPage(Long serverId, PageRequest pageRequest, Function<Long, Page<T>> finder) {
		return findCurrentConfigFileId(serverId)
			.map(fileId -> PageResponse.from(finder.apply(fileId)))
			.orElseGet(() -> PageResponse.from(Page.empty(pageRequest)));
	}

	private PageRequest pageRequest(int page, int size, String sort, Sort.Direction direction) {
		int normalizedPage = Math.max(page, 0);
		int normalizedSize = Math.max(1, Math.min(size, 200));
		String normalizedSort = sort == null || sort.isBlank() ? "id" : sort;
		Sort.Direction normalizedDirection = direction == null ? Sort.Direction.ASC : direction;
		return PageRequest.of(normalizedPage, normalizedSize, Sort.by(normalizedDirection, normalizedSort));
	}
}
