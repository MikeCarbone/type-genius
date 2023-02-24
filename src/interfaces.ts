export interface ValueTypeConfiguration {
	type: string;
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

export interface CreateInterfaceOptions extends BuildOptions {
	interfaceName?: string;
	nested?: string[];
}

export interface BuildOptions {
	useStore?: TypeStore;
	returnConfigurations?: boolean;
	initialInterfaceName?: string;
	outputPath?: string;
	outputFilename?: string;
	customTypes?: {
		object?: string;
		string?: string;
		boolean?: string;
		number?: string;
		unknown?: string;
	};
	forceOptional?: boolean;
	useTypes?: boolean;
	renderSemis?: boolean;
}
