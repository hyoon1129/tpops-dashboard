package com.shinhan.tpops.parser;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TmaxConfigParserTest {

	private final TmaxConfigParser parser = new TmaxConfigParser();

	@Test
	void parsesRealisticSampleWithCommentsAndInlineAssignments() throws Exception {
		ParsedTmaxConfig parsedConfig = parser.parse(sampleConfig());

		assertThat(parsedConfig.entries(ConfigSection.DOMAIN))
			.singleElement()
			.satisfies(domain -> {
				assertThat(domain.name()).isEqualTo("SHTDOM01");
				assertThat(domain.values()).containsEntry("MAXUSER", "3700");
			});

		assertThat(parsedConfig.entries(ConfigSection.NODE))
			.filteredOn(node -> node.name().equals("DEFAULT"))
			.singleElement()
			.satisfies(defaultNode -> assertThat(defaultNode.values()).containsEntry("TMAXHOME", "/asdf/abab"));

		assertThat(parsedConfig.entries(ConfigSection.SVRGROUP))
			.filteredOn(svrgroup -> svrgroup.name().equals("svg_gateway01"))
			.singleElement()
			.satisfies(svrgroup -> assertThat(svrgroup.values())
				.containsEntry("NODENAME", "COR01")
				.containsEntry("COUSIN", "svg_gateway02, GWTINF01")
				.containsEntry("LOAD", "-2"));

		assertThat(parsedConfig.entries(ConfigSection.SERVICE))
			.filteredOn(service -> service.name().equals("SFMCACLID"))
			.singleElement()
			.satisfies(service -> assertThat(service.values()).containsEntry("SVCTIME", "30"));
	}

	private String sampleConfig() throws Exception {
		return """
			*DOMAIN
			SHTDOM01        DOMAINID = 12,
			                MAXUSER = 3700

			*NODE
			DEFAULT:        TMAXHOME = "/asdf/abab",
			                NODETYPE = SHM_USER

			COR01           HOSTNAME = "host01",
			                TMAXDIR = "/running/aaaa/tmax"

			*SVRGROUP
			# inline assignments with comma inside a quoted value
			svg_gateway01   NODENAME = "COR01", COUSIN = "svg_gateway02, GWTINF01", LOAD = -2

			*SERVICE
			SFMCACLID       SVRNAME = UFMSGCLI, SVCTIME = 30 ## inline comment
			""";
	}
}
