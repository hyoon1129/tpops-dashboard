package com.shinhan.tpops.parser;

import java.util.LinkedHashMap;
import java.util.Map;

public record ParsedConfigEntry(
	ConfigSection section,
	String name,
	Map<String, String> values,
	Integer startLine,
	Integer endLine
) {

	public ParsedConfigEntry withValues(Map<String, String> values) {
		return new ParsedConfigEntry(section, name, new LinkedHashMap<>(values), startLine, endLine);
	}
}
