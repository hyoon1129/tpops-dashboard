package com.shinhan.tpops.nodeconfig;

import com.shinhan.tpops.common.ConfigValues;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.domainconfig.DomainConfig;
import com.shinhan.tpops.gatewayconfig.GatewayConfig;
import com.shinhan.tpops.svrgroupconfig.SvrgroupConfig;
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
@Table(name = "node_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NodeConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "node_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "domain_config_id")
	private DomainConfig domainConfig;

	@Column(name = "node_name", nullable = false, length = 255)
	private String nodeName;

	@Column(length = 255)
	private String hostname;

	@Column(nullable = false, length = 500)
	private String tmaxdir;

	@Column(nullable = false, length = 500)
	private String appdir;

	@Column(length = 500)
	private String tmaxhome;

	@Column(length = 500)
	private String pathdir;

	@Column(length = 500)
	private String tlogdir;

	@Column(length = 500)
	private String ulogdir;

	@Column(length = 500)
	private String slogdir;

	@Column(length = 50)
	private String nodetype;

	@Column(length = 10)
	private String autobackup;

	private Integer maxgwcpc;
	private Integer maxgwsvr;

	@Column(columnDefinition = "TEXT")
	private String clhopt;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "nodeConfig")
	private List<SvrgroupConfig> svrgroupConfigs = new ArrayList<>();

	@OneToMany(mappedBy = "nodeConfig")
	private List<GatewayConfig> gatewayConfigs = new ArrayList<>();

	public NodeConfig(ConfigFile configFile, DomainConfig domainConfig, String nodeName, Map<String, String> values, Integer startLine, Integer endLine) {
		this.configFile = configFile;
		this.domainConfig = domainConfig;
		this.nodeName = nodeName;
		this.hostname = ConfigValues.stringValue(values, "HOSTNAME");
		this.tmaxdir = ConfigValues.stringValue(values, "TMAXDIR");
		this.appdir = ConfigValues.stringValue(values, "APPDIR");
		this.tmaxhome = ConfigValues.stringValue(values, "TMAXHOME");
		this.pathdir = ConfigValues.stringValue(values, "PATHDIR");
		this.tlogdir = ConfigValues.stringValue(values, "TLOGDIR");
		this.ulogdir = ConfigValues.stringValue(values, "ULOGDIR");
		this.slogdir = ConfigValues.stringValue(values, "SLOGDIR");
		this.nodetype = ConfigValues.stringValue(values, "NODETYPE");
		this.autobackup = ConfigValues.stringValue(values, "AUTOBACKUP");
		this.maxgwcpc = ConfigValues.integerValue(values, "MAXGWCPC");
		this.maxgwsvr = ConfigValues.integerValue(values, "MAXGWSVR");
		this.clhopt = ConfigValues.stringValue(values, "CLHOPT");
		this.startLine = startLine;
		this.endLine = endLine;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
