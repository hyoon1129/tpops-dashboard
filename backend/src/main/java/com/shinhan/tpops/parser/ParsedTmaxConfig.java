package com.shinhan.tpops.parser;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public class ParsedTmaxConfig {

	private final Map<ConfigSection, List<ParsedConfigEntry>> entries = new EnumMap<>(ConfigSection.class);

	public void add(ParsedConfigEntry entry) {
		entries.computeIfAbsent(entry.section(), ignored -> new ArrayList<>()).add(entry);
	}

	public List<ParsedConfigEntry> entries(ConfigSection section) {
		return entries.getOrDefault(section, List.of());
	}
}
