export interface ValueTypeConfiguration {
	type: string;
	optional: boolean;
	isArray: boolean;
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
	/**
	 * Customize the types that get rendered.
	 */
	customTypes?: {
		object?: string;
		string?: string;
		boolean?: string;
		number?: string;
		unknown?: string;
	};
	/**
	 * Forces each value in every type to be optional.
	 */
	forceOptional?: boolean;
	/**
	 * The name given to the first generated interface.
	 */
	initialInterfaceName?: string;
	/**
	 * Should a success message get rendered after successfully generating the types.
	 */
	logSuccess?: boolean;
	/**
	 * File name to give the rendered types file.
	 */
	outputFilename?: string;
	/**
	 * Where to render the generated types.
	 */
	outputPath?: string;
	/**
	 * Render semicolons in the outputted file.
	 */
	renderSemis?: boolean;
	/**
	 * Return the string that would get rendered to a file. Enabling this prevents the file from being written.
	 */
	returnFileString?: boolean;
	/**
	 * Whether to write the file or not.
	 */
	skipFileWrite?: boolean;
	/**
	 * Store of existing InterfaceConfiguration objects to use for this generation.
	 */
	useStore?: TypeStore;
	/**
	 * Whether to render "type"s instead of "interface"s.
	 */
	useTypes?: boolean;
}
