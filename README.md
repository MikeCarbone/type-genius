# Type Genius

## What is it

Type Genius is a library that can generate a Typescript file from any JSON object.

This generator can be useful for many reasons:

-   Creating interfaces for JSON data returned from HTTP requests
-   Migrating JavaScript code to Typescript
-   Quickly scaffolding Typescript interfaces based on existing data structures

For example, the object returned from an HTTP request can be _anything_, but generally, it's going to be consistent in its return. It would be great to leverage Typescript to have intellisense for the response object. However, many APIs don't ship with a Typescript library, so you have to assume `any` as its type, or type it by hand.

On the other hand, you can use this package to quickly generate an interface from an API response.

```ts
import { buildTypes } from "type-genius";

// Get some data
const res = await fetch("https://json.com");
const data = await res.json();

// Generate type file
buildTypes(data);
```

## Options

| **Option Name** | **Type** | **Default** | **Description** |
|---|---|---|---|
| customTypes | Object? | ```js {  string: "string",  number: "number",  boolean: "boolean",  object: "object"  } ``` | Customize the types that get rendered. For objects, you can render a Record like this:  ```js customTypes: { object: "Record<string, unknown>" ``` |
| forceOptional | Boolean? | false | Forces each value in every type to be optional. |
| initialInterfaceName | String? | "Response" | The name given to the first generated interface. |
| logSuccess | Boolean? | false | Should a success message get rendered after successfully generating the types. |
| outputFilename | String? | "exported.d.ts" | File name to give the rendered types file. |
| outputPath | String? | "../dist/" | Where to render the generated types. |
| renderSemis | Boolean? | false | Render semicolons in the outputted file. |
| skipFileWrite | Boolean? | false | Whether to write the file or not. |
| useStore | TypeStore? | [] | Store of existing InterfaceConfiguration objects to use for this generation. |
| useTypes | Boolean? | false | Whether to render "type"s instead of "interface"s. |

## Architecture

Before we can create our Typescript file, we have to run through a few steps to make sure things run correctly. Here is what happens under the hood:

### 1. PARSE - Convert object to a type configuration object

We first parse our object to determine each value's type. For example, this object:

```json
{
	"key_name_1": "value",
	"key_name_2": 1,
	"key_name_3": {
		"key_name_4": true
	}
}
```

will become this:

```json
{
	"key_name_1": {
		"type": "string",
		"optional": false
	},
	"key_name_2": {
		"type": "number",
		"optional": false
	},
	"key_name_3": {
		"type": "object",
		"optional": false,
		"object_keys": {
			"key_name_4": {
				"type": "boolean",
				"optional": false
			}
		}
	}
}
```

### 2. SAVE - Initialize type store

Soon we're going to create configuration objects that describe how to construct our interface. Before we do that, we need to save them somewhere so we can refer back to this list if we have to. We have to do this in order to remove duplicate interfaces.

```js
const typesStore = [];
```

If you want to save interfaces generated in the past and refer back to them, you can use a populated array here. This is useful if you have recurring interfaces in multiple places. You don't always want to generate every interface from scratch.

### 3. CREATE - Populate store with interface configurations

An interface configuration is a set of instructions that outline how to create each interface. It includes the name of the interface, the various type configuration objects within, and the generated file string.

An interface configuration looks like this:

```js
{
	"string": "", // string that will get written to a file
	"typesConfig": {}, // type configuration object
	"interfaceName": "" // name of the interface
}
```

Here is how each interface configuration gets produced.
First, let's assume our store is empty. The engine will go key-by-key through our type configuration object and generate the string necessary.

```json
{
	"key_name_1": {
		"type": "string",
		"optional": false
	}
}
```

will produce the string:

```typescript
export interface Response {
	key_name_1: string;
}
```

At this point the interface configuration is saved and stored.

If one of the keys has a type of `object`, the function will run recursively to determine an interface for the nested object. For example, when the engine reaches a key like the one below, the function is going to rerun on the `object_keys` field:

```json
{
	"key_name_3": {
		"type": "object",
		"optional": false,
		"object_keys": {
			"key_name_4": {
				"type": "boolean",
				"optional": false
			}
		}
	}
}
```

#### Interface Resolution

Each time the engine attempts to create an interface configuration, it will first do a deep comparison of its type configuration object against all existing interface configurations' type configuration objects already in the store. If it finds a match, it will return that interface and the key will now reference that interface.

### 4. EXPORT - Concatenate string properties from interface configurations

At this stage, each interface configuration string is concatenated into a single string. This big string will get written to a file, and exported with the specified options.
