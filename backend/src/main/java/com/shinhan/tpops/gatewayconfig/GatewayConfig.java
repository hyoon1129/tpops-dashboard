package com.shinhan.tpops.gatewayconfig;

import com.shinhan.tpops.common.ConfigValues;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "gateway_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GatewayConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "gateway_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "node_config_id")
	private NodeConfig nodeConfig;

	@Column(name = "gateway_name", nullable = false, length = 255)
	private String gatewayName;

	@Column(nullable = false, length = 100)
	private String gwtype;

	@Column(nullable = false, length = 255)
	private String nodename;

	@Column(nullable = false)
	private Integer portno;

	@Column(nullable = false)
	private Integer rgwportno;

	@Column(nullable = false, length = 255)
	private String rgwaddr;

	private Integer cpc;

	@Column(columnDefinition = "TEXT")
	private String clopt;

	@Column(name = "load_value")
	private Integer loadValue;

	@Column(name = "backup_rgwaddr", length = 255)
	private String backupRgwaddr;

	@Column(name = "backup_rgwportno")
	private Integer backupRgwportno;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	public GatewayConfig(ConfigFile configFile, NodeConfig nodeConfig, String gatewayName, Map<String, String> values, Integer startLine, Integer endLine) {
		this.configFile = configFile;
		this.nodeConfig = nodeConfig;
		this.gatewayName = gatewayName;
		this.gwtype = ConfigValues.stringValue(values, "GWTYPE");
		this.nodename = ConfigValues.stringValue(values, "NODENAME");
		this.portno = ConfigValues.integerValue(values, "PORTNO");
		this.rgwportno = ConfigValues.integerValue(values, "RGWPORTNO");
		this.rgwaddr = ConfigValues.stringValue(values, "RGWADDR");
		this.cpc = ConfigValues.integerValue(values, "CPC");
		this.clopt = ConfigValues.stringValue(values, "CLOPT");
		this.loadValue = ConfigValues.integerValue(values, "LOAD");
		this.backupRgwaddr = ConfigValues.stringValue(values, "BACKUP_RGWADDR");
		this.backupRgwportno = ConfigValues.integerValue(values, "BACKUP_RGWPORTNO");
		this.startLine = startLine;
		this.endLine = endLine;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
