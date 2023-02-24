import { test, expect, describe } from "@jest/globals";
import { buildTypes, buildTypesFileString } from ".";

const testObj = {
	a: 1,
	b: true,
	c: {
		d: "three",
	},
};

describe("custom options are working correctly", () => {
	const build = buildTypes(testObj, {
		useTypes: true,
		renderSemis: true,
		skipFileWrite: true,
		initialInterfaceName: "Runner",
		outputPath: "../../",
		forceOptional: true,
		customTypes: {
			string: "test",
		},
	});

	test("ensures functioning useTypes option", () => {
		const val = build[0].string.slice(7, 11);
		expect(val).toBe("type");
	});

	test("ensures functioning renderSemis option", () => {
		const val = build[0].string.charAt(28);
		expect(val).toBe(";");
	});

	test("ensures functioning initialInterfaceName option", () => {
		const val = build[1].string.slice(12, 18);
		expect(val).toBe("Runner");
	});

	test("ensures functioning forceOptional option", () => {
		const val = build[1].typesConfig.a.optional;
		expect(val).toBe(true);
	});

	test("ensures functioning customType option", () => {
		const val = build[0].typesConfig.d.type;
		expect(val).toBe("test");
	});
});

describe("default options are working correctly", () => {
	const build = buildTypes(testObj, { skipFileWrite: true });

	test("ensures interfaces rendering", () => {
		const val = build[0].string.slice(7, 16);
		expect(val).toBe("interface");
	});

	test("ensures correct number type", () => {
		const val = build[1].typesConfig.a.type;
		expect(val).toBe("number");
	});

	test("ensures correct string type", () => {
		const val = build[0].typesConfig.d.type;
		expect(val).toBe("string");
	});

	test("ensures correct boolean type", () => {
		const val = build[1].typesConfig.b.type;
		expect(val).toBe("boolean");
	});

	test("ensures correct object type", () => {
		const val = build[1].typesConfig.c.type;
		expect(val).toBe("object");
	});

	test("ensures InterfaceConfig has all properties", () => {
		const val = Object.keys(build[0]).length;
		expect(val).toBe(3);
	});
});

describe("buildTypesFileString function", () => {
	const str = buildTypesFileString(testObj);

	test("ensures function returns a string", () => {
		const val = typeof str;
		expect(val).toBe("string");
	});
});
