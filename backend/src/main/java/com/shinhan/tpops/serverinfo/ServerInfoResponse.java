package com.shinhan.tpops.serverinfo;

import java.time.LocalDateTime;

public record ServerInfoResponse(
	Long serverId,
	String serverName,
	String serverIp,
	String environment,
	String description,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static ServerInfoResponse from(ServerInfo serverInfo) {
		return new ServerInfoResponse(
			serverInfo.getId(),
			serverInfo.getServerName(),
			serverInfo.getServerIp(),
			serverInfo.getEnvironment(),
			serverInfo.getDescription(),
			serverInfo.getCreatedAt(),
			serverInfo.getUpdatedAt()
		);
	}
}
