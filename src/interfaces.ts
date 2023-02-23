export interface ValueTypeConfiguration {
	type: "string" | "boolean" | "number" | "object" | "unknown";
	optional: boolean;
	is_array: boolean;
	object_keys?: TypeConfigurationObject;
}

export interface TypeConfigurationObject {
	[key: string]: ValueTypeConfiguration;
}

export interface InterfaceConfig {
	string: string;
	typesConfig: TypeConfigurationObject;
	interfaceName: string;
}

export type TypeStore = InterfaceConfig[];

export interface CreateInterfaceOptions {
	interfaceName?: string;
	nested?: string[];
}
