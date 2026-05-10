package com.shinhan.tpops.configfile;

import com.shinhan.tpops.serverinfo.ServerInfo;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
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

	@Column(name = "file_hash", length = 128)
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
