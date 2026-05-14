package com.shinhan.tpops.serverinfo;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ServerInfoService {

	private final ServerInfoRepository serverInfoRepository;

	@Transactional(readOnly = true)
	public List<ServerInfoResponse> findAll() {
		return serverInfoRepository.findAll().stream()
			.map(ServerInfoResponse::from)
			.toList();
	}

	@Transactional
	public ServerInfoResponse create(ServerInfoCreateRequest request) {
		ServerInfo serverInfo = new ServerInfo(
			request.serverName(),
			request.serverIp(),
			request.environment(),
			request.description()
		);

		return ServerInfoResponse.from(serverInfoRepository.save(serverInfo));
	}

	@Transactional
	public ServerInfoResponse update(Long serverId, ServerInfoUpdateRequest request) {
		ServerInfo serverInfo = serverInfoRepository.findById(serverId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Server not found. serverId=" + serverId));

		serverInfo.update(
			request.serverName(),
			request.serverIp(),
			request.environment(),
			request.description()
		);

		return ServerInfoResponse.from(serverInfo);
	}
}
