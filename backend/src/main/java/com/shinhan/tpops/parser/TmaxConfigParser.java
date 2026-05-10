package com.shinhan.tpops.parser;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class TmaxConfigParser {

	public ParsedTmaxConfig parse(String content) {
		ParsedTmaxConfig parsedConfig = new ParsedTmaxConfig();
		ConfigSection currentSection = null;
		MutableEntry currentEntry = null;
		String[] lines = content.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);

		for (int index = 0; index < lines.length; index++) {
			int lineNumber = index + 1;
			String line = lines[index];
			String trimmed = line.trim();
			if (trimmed.isBlank()) {
				continue;
			}

			if (trimmed.startsWith("*")) {
				if (currentEntry != null) {
					parsedConfig.add(currentEntry.toParsedEntry());
					currentEntry = null;
				}
				currentSection = parseSection(trimmed);
				continue;
			}

			if (currentSection == null) {
				continue;
			}

			if (startsNewEntry(line)) {
				if (currentEntry != null) {
					parsedConfig.add(currentEntry.toParsedEntry());
				}
				currentEntry = newEntry(currentSection, trimmed, lineNumber);
				continue;
			}

			if (currentEntry != null) {
				putAssignment(currentEntry.values, trimmed);
				currentEntry.endLine = lineNumber;
			}
		}

		if (currentEntry != null) {
			parsedConfig.add(currentEntry.toParsedEntry());
		}

		return parsedConfig;
	}

	private ConfigSection parseSection(String line) {
		String sectionName = line.substring(1).trim().toUpperCase(Locale.ROOT);
		return ConfigSection.valueOf(sectionName);
	}

	private boolean startsNewEntry(String line) {
		return !Character.isWhitespace(line.charAt(0));
	}

	private MutableEntry newEntry(ConfigSection section, String line, int lineNumber) {
		String[] parts = line.split("\\s+", 2);
		MutableEntry entry = new MutableEntry(section, parts[0], lineNumber);
		if (parts.length > 1) {
			putAssignment(entry.values, parts[1].trim());
		}
		return entry;
	}

	private void putAssignment(Map<String, String> values, String line) {
		int equalsIndex = line.indexOf('=');
		if (equalsIndex < 0) {
			return;
		}

		String key = line.substring(0, equalsIndex).trim().toUpperCase(Locale.ROOT);
		String value = line.substring(equalsIndex + 1).trim();
		if (value.endsWith(",")) {
			value = value.substring(0, value.length() - 1).trim();
		}
		if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
			value = value.substring(1, value.length() - 1);
		}
		values.put(key, value);
	}

	private static class MutableEntry {

		private final ConfigSection section;
		private final String name;
		private final Map<String, String> values = new LinkedHashMap<>();
		private final Integer startLine;
		private Integer endLine;

		private MutableEntry(ConfigSection section, String name, Integer startLine) {
			this.section = section;
			this.name = name;
			this.startLine = startLine;
			this.endLine = startLine;
		}

		private ParsedConfigEntry toParsedEntry() {
			return new ParsedConfigEntry(section, name, new LinkedHashMap<>(values), startLine, endLine);
		}
	}
}
