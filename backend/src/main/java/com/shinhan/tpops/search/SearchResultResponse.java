package com.shinhan.tpops.search;

import com.shinhan.tpops.parser.ConfigSection;

public record SearchResultResponse(
	ConfigSection section,
	String name,
	String related,
	String matchedField,
	String value
) {
}
