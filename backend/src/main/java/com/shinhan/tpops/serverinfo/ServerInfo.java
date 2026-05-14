package com.shinhan.tpops.serverinfo;

import com.shinhan.tpops.configfile.ConfigFile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "server_info")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServerInfo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "server_id")
	private Long id;

	@Column(name = "server_name", nullable = false, length = 100)
	private String serverName;

	@Column(name = "server_ip", length = 50)
	private String serverIp;

	@Column(length = 30)
	private String environment;

	@Column(length = 255)
	private String description;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@OneToMany(mappedBy = "serverInfo")
	private List<ConfigFile> configFiles = new ArrayList<>();

	public ServerInfo(String serverName, String serverIp, String environment, String description) {
		this.serverName = serverName;
		this.serverIp = serverIp;
		this.environment = environment;
		this.description = description;
	}

	public void update(String serverName, String serverIp, String environment, String description) {
		this.serverName = serverName;
		this.serverIp = serverIp;
		this.environment = environment;
		this.description = description;
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = LocalDateTime.now();
	}
}
