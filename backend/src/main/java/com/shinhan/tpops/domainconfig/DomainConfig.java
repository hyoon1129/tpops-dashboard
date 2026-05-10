package com.shinhan.tpops.domainconfig;

import com.shinhan.tpops.configfile.ConfigFile;
import com.shinhan.tpops.common.ConfigValues;
import com.shinhan.tpops.nodeconfig.NodeConfig;
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
@Table(name = "domain_config")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DomainConfig {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "domain_config_id")
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "file_id", nullable = false)
	private ConfigFile configFile;

	@Column(name = "domain_name", nullable = false, length = 255)
	private String domainName;

	@Column(name = "domain_id")
	private Integer domainId;

	@Column(nullable = false, length = 50)
	private String shmkey;

	private Integer maxuser;
	private Integer minclh;
	private Integer maxclh;
	private Integer tportno;
	private Integer racport;
	private Integer blocktime;
	private Integer maxsvg;
	private Integer maxsvr;
	private Integer maxspr;
	private Integer maxsvc;
	private Integer maxsacall;
	private Integer maxcacall;
	private Integer maxtotalsvg;
	private Integer maxgw;
	private Integer maxcpc;
	private Integer maxcousin;
	private Integer maxcousinsvg;
	private Integer gwchkint;

	@Column(name = "gwconnect_timeout")
	private Integer gwconnectTimeout;

	private Integer nclhchktime;
	private Integer nliveinq;

	@Column(length = 50)
	private String ipcperm;

	private Integer maxnode;

	@Column(name = "start_line", nullable = false)
	private Integer startLine;

	@Column(name = "end_line", nullable = false)
	private Integer endLine;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@OneToMany(mappedBy = "domainConfig")
	private List<NodeConfig> nodeConfigs = new ArrayList<>();

	public DomainConfig(ConfigFile configFile, String domainName, Map<String, String> values, Integer startLine, Integer endLine) {
		this.configFile = configFile;
		this.domainName = domainName;
		this.domainId = ConfigValues.integerValue(values, "DOMAINID");
		this.shmkey = ConfigValues.stringValue(values, "SHMKEY");
		this.maxuser = ConfigValues.integerValue(values, "MAXUSER");
		this.minclh = ConfigValues.integerValue(values, "MINCLH");
		this.maxclh = ConfigValues.integerValue(values, "MAXCLH");
		this.tportno = ConfigValues.integerValue(values, "TPORTNO");
		this.racport = ConfigValues.integerValue(values, "RACPORT");
		this.blocktime = ConfigValues.integerValue(values, "BLOCKTIME");
		this.maxsvg = ConfigValues.integerValue(values, "MAXSVG");
		this.maxsvr = ConfigValues.integerValue(values, "MAXSVR");
		this.maxspr = ConfigValues.integerValue(values, "MAXSPR");
		this.maxsvc = ConfigValues.integerValue(values, "MAXSVC");
		this.maxsacall = ConfigValues.integerValue(values, "MAXSACALL");
		this.maxcacall = ConfigValues.integerValue(values, "MAXCACALL");
		this.maxtotalsvg = ConfigValues.integerValue(values, "MAXTOTALSVG");
		this.maxgw = ConfigValues.integerValue(values, "MAXGW");
		this.maxcpc = ConfigValues.integerValue(values, "MAXCPC");
		this.maxcousin = ConfigValues.integerValue(values, "MAXCOUSIN");
		this.maxcousinsvg = ConfigValues.integerValue(values, "MAXCOUSINSVG");
		this.gwchkint = ConfigValues.integerValue(values, "GWCHKINT");
		this.gwconnectTimeout = ConfigValues.integerValue(values, "GWCONNECT_TIMEOUT");
		this.nclhchktime = ConfigValues.integerValue(values, "NCLHCHKTIME");
		this.nliveinq = ConfigValues.integerValue(values, "NLIVEINQ");
		this.ipcperm = ConfigValues.stringValue(values, "IPCPERM");
		this.maxnode = ConfigValues.integerValue(values, "MAXNODE");
		this.startLine = startLine;
		this.endLine = endLine;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}
}
