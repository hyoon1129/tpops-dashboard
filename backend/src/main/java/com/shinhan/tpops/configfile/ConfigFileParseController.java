package com.shinhan.tpops.configfile;

import com.shinhan.tpops.configquery.ConfigFileResponse;
import lombok.RequiredArgsConstructor;
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

	@PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ConfigFileResponse parse(@PathVariable Long serverId, @RequestPart("file") MultipartFile file) {
		return configFileParseService.parse(serverId, file);
	}
}
