package com.shinhan.tpops.configfile;

import com.shinhan.tpops.configquery.ConfigFileDetailResponse;
import com.shinhan.tpops.configquery.ConfigFileResponse;
import com.shinhan.tpops.parser.ParsedTmaxConfig;
import com.shinhan.tpops.parser.TmaxConfigParser;
import com.shinhan.tpops.serverinfo.ServerInfo;
import com.shinhan.tpops.serverinfo.ServerInfoRepository;
import java.io.IOException;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ConfigFileParseService {

	private static final Charset CONFIG_FILE_CHARSET = Charset.forName("EUC-KR");

	private final ServerInfoRepository serverInfoRepository;
	private final ConfigFileRepository configFileRepository;
	private final ConfigFilePersistenceService persistenceService;
	private final TmaxConfigParser tmaxConfigParser;

	public ConfigFileResponse parse(Long serverId, MultipartFile file) {
		ServerInfo serverInfo = serverInfoRepository.findById(serverId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
				"Server not found. serverId=" + serverId));

		byte[] bytes = readBytes(file);
		String fileContent = new String(bytes, CONFIG_FILE_CHARSET);
		String fileHash = sha256(bytes);
		Integer versionNo = persistenceService.nextVersionNo(serverId);

		// 1단계: ConfigFile 레코드 저장 (즉시 커밋 — 이후 파싱 실패해도 이력 유지)
		ConfigFile configFile = persistenceService.saveInitial(
			serverInfo, fileName(file), versionNo, fileHash, fileContent);

		try {
			// 2단계: 파싱 + 전체 저장 + SUCCESS 마킹
			ParsedTmaxConfig parsedConfig = tmaxConfigParser.parse(fileContent);
			return persistenceService.saveParsedAndMarkSuccess(
				configFile.getId(), serverId, parsedConfig);
		} catch (Exception e) {
			// 3단계: 실패 시 FAILED 상태 기록 (즉시 커밋)
			String errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
			persistenceService.markFailed(configFile.getId(), errorMessage);
			throw new ResponseStatusException(
				HttpStatus.UNPROCESSABLE_ENTITY, "파싱에 실패했습니다: " + errorMessage, e);
		}
	}

	@Transactional(readOnly = true)
	public List<ConfigFileResponse> findHistory(Long serverId) {
		if (!serverInfoRepository.existsById(serverId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
				"Server not found. serverId=" + serverId);
		}
		return configFileRepository.findByServerInfoIdOrderByVersionNoDesc(serverId).stream()
			.map(ConfigFileResponse::from)
			.toList();
	}

	@Transactional(readOnly = true)
	public ConfigFileDetailResponse findDetail(Long serverId, Long fileId) {
		ConfigFile configFile = configFileRepository.findById(fileId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
				"Config file not found. fileId=" + fileId));
		if (!configFile.getServerInfo().getId().equals(serverId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND,
				"Config file not found. fileId=" + fileId);
		}
		return ConfigFileDetailResponse.from(configFile);
	}

	private byte[] readBytes(MultipartFile file) {
		try {
			return file.getBytes();
		} catch (IOException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
				"Cannot read config file.", exception);
		}
	}

	private String sha256(byte[] bytes) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			byte[] digest = messageDigest.digest(bytes);
			StringBuilder builder = new StringBuilder();
			for (byte value : digest) {
				builder.append(String.format("%02x", value));
			}
			return builder.toString();
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 algorithm is not available.", exception);
		}
	}

	private String fileName(MultipartFile file) {
		String originalFilename = file.getOriginalFilename();
		if (originalFilename == null || originalFilename.isBlank()) {
			return "uploaded.m";
		}
		return originalFilename;
	}
}
