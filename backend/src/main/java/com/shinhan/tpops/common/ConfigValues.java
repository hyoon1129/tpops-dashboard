package com.shinhan.tpops.common;

import java.util.Map;

public final class ConfigValues {

	private ConfigValues() {
	}

	public static String stringValue(Map<String, String> values, String key) {
		return values.get(key);
	}

	public static Integer integerValue(Map<String, String> values, String key) {
		String value = values.get(key);
		if (value == null || value.isBlank()) {
			return null;
		}
		return Integer.valueOf(value);
	}
}
