package com.shinhan.tpops.configfile;

import com.shinhan.tpops.configquery.ConfigFileDetailResponse;
import com.shinhan.tpops.configquery.ConfigFileResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/servers/{serverId}/config-files")
@RequiredArgsConstructor
public class ConfigFileParseController {

	private final ConfigFileParseService configFileParseService;

	@GetMapping
	public List<ConfigFileResponse> findHistory(@PathVariable Long serverId) {
		return configFileParseService.findHistory(serverId);
	}

	@GetMapping("/{fileId}")
	public ConfigFileDetailResponse findDetail(@PathVariable Long serverId, @PathVariable Long fileId) {
		return configFileParseService.findDetail(serverId, fileId);
	}

	@PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ConfigFileResponse parse(@PathVariable Long serverId, @RequestPart("file") MultipartFile file) {
		return configFileParseService.parse(serverId, file);
	}
}
