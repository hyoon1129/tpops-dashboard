package com.shinhan.tpops.serverconfig;

import com.shinhan.tpops.common.ConfigValues;
import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.serviceconfig.ServiceConfig;
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
@Table(name = "server_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServerConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "server_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "svrgroup_config_id")
	private SvrgroupConfig svrgroupConfig;

	@Column(name = "server_name", nullable = false, length = 255)
	private String serverName;

	@Column(nullable = false, length = 255)
	private String svgname;

	@Column(length = 100)
	private String svrtype;

	@Column(columnDefinition = "TEXT")
	private String clopt;

	@Column(name = "db_info", length = 100)
	private String dbInfo;

	@Column(name = "min_value")
	private Integer minValue;

	@Column(name = "max_value")
	private Integer maxValue;

	@Column(length = 255)
	private String target;

	@Column(length = 50)
	private String schedule;

	private Integer maxqcount;
	private Integer cpc;
	private Integer asqcount;

	@Column(length = 10)
	private String restart;

	private Integer maxrstart;
	private Integer gperiod;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "serverConfig")
	private List<ServiceConfig> serviceConfigs = new ArrayList<>();

	public ServerConfig(ConfigFile configFile, SvrgroupConfig svrgroupConfig, String serverName, Map<String, String> values, Integer startLine, Integer endLine) {
		this.configFile = configFile;
		this.svrgroupConfig = svrgroupConfig;
		this.serverName = serverName;
		this.svgname = ConfigValues.stringValue(values, "SVGNAME");
		this.svrtype = ConfigValues.stringValue(values, "SVRTYPE");
		this.clopt = ConfigValues.stringValue(values, "CLOPT");
		this.dbInfo = parseDbInfo(this.clopt);
		this.minValue = ConfigValues.integerValue(values, "MIN");
		this.maxValue = ConfigValues.integerValue(values, "MAX");
		this.target = ConfigValues.stringValue(values, "TARGET");
		this.schedule = ConfigValues.stringValue(values, "SCHEDULE");
		this.maxqcount = ConfigValues.integerValue(values, "MAXQCOUNT");
		this.cpc = ConfigValues.integerValue(values, "CPC");
		this.asqcount = ConfigValues.integerValue(values, "ASQCOUNT");
		this.restart = ConfigValues.stringValue(values, "RESTART");
		this.maxrstart = ConfigValues.integerValue(values, "MAXRSTART");
		this.gperiod = ConfigValues.integerValue(values, "GPERIOD");
		this.startLine = startLine;
		this.endLine = endLine;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}

	private static String parseDbInfo(String clopt) {
		if (clopt == null || clopt.isBlank()) {
			return null;
		}
		// -k DBU01:CORCON1 → CORCON1, -k CORCON1 → CORCON1
		java.util.regex.Matcher matcher = java.util.regex.Pattern
			.compile("-k\\s+(?:[^:\\s]+:)?(\\S+)")
			.matcher(clopt);
		return matcher.find() ? matcher.group(1) : null;
	}
}
