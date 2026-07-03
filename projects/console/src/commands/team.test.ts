import type { TrumboAccountOrganization } from "@trumbo/core";
import { describe, expect, it } from "vitest";
import { resolveTeamMatch } from "./team";

const organizations: TrumboAccountOrganization[] = [
	{
		active: true,
		memberId: "mem-personal",
		name: "Personal",
		organizationId: "org-personal",
		roles: ["owner"],
	},
	{
		active: false,
		memberId: "mem-acme",
		name: "Acme Engineering",
		organizationId: "org-acme",
		roles: ["admin"],
	},
];

describe("resolveTeamMatch", () => {
	it("matches personal account alias", () => {
		expect(resolveTeamMatch(organizations, "personal")).toBe("personal");
	});

	it("matches by exact team id or name", () => {
		expect(resolveTeamMatch(organizations, "org-acme")).toEqual(
			organizations[1],
		);
		expect(resolveTeamMatch(organizations, "Acme Engineering")).toEqual(
			organizations[1],
		);
	});

	it("matches by prefix", () => {
		expect(resolveTeamMatch(organizations, "acme")).toEqual(organizations[1]);
	});

	it("returns null for unknown teams", () => {
		expect(resolveTeamMatch(organizations, "missing")).toBeNull();
	});
});
