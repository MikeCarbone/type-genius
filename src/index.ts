import { writeFile } from "fs";
import { join } from "path";
import deepEqual from "deep-equal";

import {
	type BuildOptions,
	type CreateInterfaceOptions,
	type InterfaceConfig,
	type TypeConfigurationObject,
	type TypeStore,
	type ValueTypeConfiguration,
} from "./interfaces";

function capitalize(sentence: string) {
	return sentence
		.split(" ")
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Get the type of a value
 * This function will return a type configration object that is a type config
 * We assume everything is required.
 * If something is null or undefined, we can assume that value is not required in the object
 */
function getTypeConfig(
	value: any,
	options?: BuildOptions
): ValueTypeConfiguration {
	const typeConfig: ValueTypeConfiguration = {
		type: "unknown",
		optional: !!options?.forceOptional || false,
		is_array: false,
	};

	const types = {
		string: "string",
		number: "number",
		object: "object",
		boolean: "boolean",
		unknown: "unknown",
		...options?.customTypes,
	};

	if (typeof value === "string") {
		typeConfig.type = types.string;
		return typeConfig;
	}
	if (typeof value === "number") {
		typeConfig.type = types.number;
		return typeConfig;
	}
	if (typeof value === "boolean") {
		typeConfig.type = types.boolean;
		return typeConfig;
	}
	if (value === null) {
		typeConfig.type = types.unknown;
		typeConfig.optional = true;
		return typeConfig;
	}
	if (typeof value === "object") {
		// item is array
		if (Array.isArray(value)) {
			typeConfig.is_array = true;

			// If there is no value in the array, we can't be sure what it is, and we know its optional
			if (value.length === 0) {
				typeConfig.type = types.unknown;
				typeConfig.optional = true;
			} else {
				// We can figure out what's in the array based on the first value
				const arrayContentsType = getTypeConfig(value[0]).type;

				// Set the newly determined type
				typeConfig.type = arrayContentsType;

				// If it's an object, we can run this recursively until everything is figured out
				if (arrayContentsType === "object") {
					typeConfig.object_keys = generateTypeConfigFromObject(
						value[0]
					);
				}
			}
			return typeConfig;
		}

		// If the object has no keys, so we don't want to try to figure out the nested type
		const hasKeys = !!Object.keys(value).length;

		// instead we just say it's an object
		typeConfig.type = types.object;

		// if it does have keys, figure out what's inside
		if (hasKeys) {
			typeConfig.object_keys = generateTypeConfigFromObject(value);
		}

		return typeConfig;
	}
	// This shouldn't get hit
	return typeConfig;
}

/**
 * This function will break down an object's keys and return an object with its type configurations
 * Each key gets a new object as its value. That object describes the type to render.
 */
function generateTypeConfigFromObject(
	obj: { [key: string]: any },
	options?: BuildOptions
) {
	const typeConfigObject: TypeConfigurationObject = {};
	Object.keys(obj).forEach((key) => {
		const val = obj[key];
		typeConfigObject[key] = getTypeConfig(val, options);
	});
	return typeConfigObject;
}

/**
 * This is how we write our string to a file
 * Called multiple places so making this explicit in one spot
 */
function generateKeyString({
	key,
	type,
	isOptional,
	isArray,
	renderSemis,
}: {
	key: string;
	type: string;
	isOptional: boolean;
	isArray: boolean;
	renderSemis?: boolean;
}) {
	return `  ${key}${isOptional ? "?" : ""}: ${type}${isArray ? "[]" : ""}${
		renderSemis ? ";" : ""
	}\n`;
}

/**
 * This function will actually render the types to a file
 */
function createInterface(
	typesConfig: TypeConfigurationObject,
	typesStore: TypeStore,
	options?: CreateInterfaceOptions
) {
	const interfaceName =
		options?.interfaceName || options?.initialInterfaceName || "Response";
	const nested = options?.nested || [];

	// If the config is the same, skip generation, reference that interface
	// We use a deep comparison of the typesConfig object
	// Everything will have to be equal
	const match = typesStore
		.map((config) => {
			if (deepEqual(config.typesConfig, typesConfig)) {
				return config;
			} else {
				return null;
			}
		})
		.find((v) => v !== null);
	if (match) return match;

	// This is the general object that will outline an interface construction
	// string is what gets written
	// typesConfig is what we use as comparison
	// interfaceName so we can refer back to it in the future
	const interfaceConfig: InterfaceConfig = {
		string: "",
		typesConfig,
		interfaceName,
	};

	// Let's start the string for the interface
	let str = options?.useTypes
		? `export type ${interfaceName} = {\n`
		: `export interface ${interfaceName} {\n`;

	// For each type configuration object (one per key, original object key is preserved)
	Object.keys(typesConfig).map((key) => {
		const config = typesConfig[key];

		// If it's an object, we want to think about its types and handle those differently
		if (config.type === "object" && "object_keys" in config) {
			// We keep track of how nested this object is so we can determine a good name automatically
			const newNested = [...nested, key];

			// Generate a new type name based on how nested it is
			// This may or may not get used, depending on if a match was found in our typesStore
			// If a match was found, we use that name to refer to existing interface
			const newTypeName = newNested.map((w) => capitalize(w)).join("");

			// This either returns an existing interfaceConfig or creates a new one
			const newOrExistingInterface = createInterface(
				config.object_keys || {},
				typesStore,
				{
					interfaceName: newTypeName,
					nested: newNested,
					...options,
				}
			);

			// Let's render that key in our string using the proper interface
			str += generateKeyString({
				key,
				type: newOrExistingInterface.interfaceName,
				isOptional: config.optional,
				isArray: config.is_array,
				renderSemis: options?.renderSemis,
			});
			return str;
		}

		// For everything else that's not an object we can just use the type determined in our type configuration
		str += generateKeyString({
			key,
			type: config.type,
			isOptional: config.optional,
			isArray: config.is_array,
			renderSemis: options?.renderSemis,
		});
		return str;
	});
	str += "}";

	// Set the properties of our interfaceConfig
	interfaceConfig.string = str;
	interfaceConfig.typesConfig = typesConfig;
	interfaceConfig.interfaceName = interfaceName;

	// Save the interfaceConfig to our store
	typesStore.push(interfaceConfig);

	return interfaceConfig;
}

export function buildTypes(
	data: { [key: string]: any },
	options?: BuildOptions
) {
	// Convert our object into our type configurations object
	const types = generateTypeConfigFromObject(data);

	// Types store will be our saved types for a file
	// We can reuse these so future objects can reuse types or start from nothing to generate new ones
	const typesStore: TypeStore = options?.useStore || [];

	// Populate our store so we can write the interfaces to a file
	createInterface(types, typesStore, options);

	if (options?.returnConfigurations) {
		return typesStore;
	}

	// Flatten to interface configurations to a single string
	const fileString = typesStore.map((t) => t.string).join("\n\n") + "\n";

	// Write the file using that string
	const outputPath = options?.outputPath || "../dist/";
	const outputFilename = options?.outputFilename || "exported.d.ts";
	writeFile(
		join(__dirname, outputPath, outputFilename),
		fileString,
		(err) => {
			if (err) {
				console.error("Could not complete file write.", err);
			} else {
				console.log("File written successfully!");
			}
		}
	);
}
