package com.shinhan.tpops.svrgroupconfig;

import com.shinhan.tpops.common.ConfigValues;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.nodeconfig.NodeConfig;
import com.shinhan.tpops.serverconfig.ServerConfig;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "svrgroup_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SvrgroupConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "svrgroup_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "node_config_id")
	private NodeConfig nodeConfig;

	@Column(name = "svrgroup_name", nullable = false, length = 255)
	private String svrgroupName;

	@Column(nullable = false, length = 255)
	private String nodename;

	@Column(length = 255)
	private String cousin;

	@Column(name = "load_value")
	private Integer loadValue;

	@Column(length = 255)
	private String backup;

	@Column(length = 500)
	private String envfile;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "svrgroupConfig")
	private List<ServerConfig> serverConfigs = new ArrayList<>();

	public SvrgroupConfig(ConfigFile configFile, NodeConfig nodeConfig, String svrgroupName, Map<String, String> values, Integer startLine, Integer endLine) {
		this.configFile = configFile;
		this.nodeConfig = nodeConfig;
		this.svrgroupName = svrgroupName;
		this.nodename = ConfigValues.stringValue(values, "NODENAME");
		this.cousin = ConfigValues.stringValue(values, "COUSIN");
		this.loadValue = ConfigValues.integerValue(values, "LOAD");
		this.backup = ConfigValues.stringValue(values, "BACKUP");
		this.envfile = ConfigValues.stringValue(values, "ENVFILE");
		this.startLine = startLine;
		this.endLine = endLine;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
