# CRUDKIT

## What is it

Crudkit is a tool to generate a Typescript file from any object. Originally, it was created to help type API responses with no supplied type files. The tool, however, can work with any object.

For example, if we made an HTTP request, the object returned can always be _something_, but we don't always know. For development purposes, it makes it much easier if we can quickly unlock intellisense for the response.

```ts
import { types } from "@crdkit/types";

const res = await fetch("https://json.com");
const data = await res.json();

types(data);
```

## Architecture

Before we can create our Typescript file, we have to run through a few steps to make sure things run correctly. Some features

1. Convert object to type configuration object

2. Initialize type store

3. Populate store with interface configurations

4. Concatenate string properties from interface configurations

## Options

-   Return configurations
-   Initial interface name
-   Output path
-   Output filename
-   Customize unknown type
-   Customeize all types
-   Everything optional
-   Use types instead of interfaces
-   Render semi-colons
