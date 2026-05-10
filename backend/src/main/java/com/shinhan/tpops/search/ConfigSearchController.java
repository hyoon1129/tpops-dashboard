package com.shinhan.tpops.search;

import com.shinhan.tpops.parser.ConfigSection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servers/{serverId}/search")
@RequiredArgsConstructor
public class ConfigSearchController {

	private final ConfigSearchService configSearchService;

	@GetMapping
	public List<SearchResultResponse> search(
		@PathVariable Long serverId,
		@RequestParam(required = false) ConfigSection section,
		@RequestParam String keyword
	) {
		return configSearchService.search(serverId, section, keyword);
	}
}
