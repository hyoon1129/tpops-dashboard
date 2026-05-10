package com.shinhan.tpops.configfile;

import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.domainconfig.DomainConfig;
import com.shinhan.tpops.gatewayconfig.GatewayConfig;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.serverconfig.ServerConfig;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "config_file")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ConfigFile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "file_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "server_id", nullable = false)
	private ServerInfo serverInfo;

	@Column(name = "file_name", nullable = false, length = 255)
	private String fileName;

	@Column(name = "version_no", nullable = false)
	private Integer versionNo;

	@Column(name = "is_current", nullable = false)
	private Boolean current;

	@Column(name = "file_hash", nullable = false, length = 128)
	private String fileHash;

	@Column(name = "uploaded_at", nullable = false, updatable = false)
	private LocalDateTime uploadedAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "parse_status", nullable = false, length = 30)
	private ParseStatus parseStatus;

	@Column(name = "error_message", columnDefinition = "TEXT")
	private String errorMessage;

	@Column(name = "parsed_at")
	private LocalDateTime parsedAt;

	@OneToMany(mappedBy = "configFile")
	private List<DomainConfig> domainConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "configFile")
	private List<NodeConfig> nodeConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "configFile")
	private List<SvrgroupConfig> svrgroupConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "configFile")
	private List<ServerConfig> serverConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "configFile")
	private List<ServiceConfig> serviceConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "configFile")
	private List<GatewayConfig> gatewayConfigs = new ArrayList<>();

	public ConfigFile(ServerInfo serverInfo, String fileName, Integer versionNo, Boolean current, String fileHash) {
		this.serverInfo = serverInfo;
		this.fileName = fileName;
		this.versionNo = versionNo;
		this.current = current;
		this.fileHash = fileHash;
		this.parseStatus = ParseStatus.PENDING;
	}

	@PrePersist
	void prePersist() {
		this.uploadedAt = LocalDateTime.now();
	}
}
