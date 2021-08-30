import * as path from "path";
import { ensureDir, remove } from "fs-extra";
import { components } from "@open-rpc/generator"

import * as fs from "fs";
import { promisify } from "util";
import { template } from "lodash";
import { ContentDescriptorObject, ExamplePairingObject, ExampleObject, MethodObject } from "@open-rpc/meta-schema";
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

const methodMappingTemplate = template(`// Code generated by @open-rpc/generator DO NOT EDIT or ur gonna have a bad tiem
import methods from "./methods";

export const methodMapping: Record<string, (...params: any) => any> = {
<% openrpcDocument.methods.forEach(({ name }) => { %>  <%= name %>: methods.<%= name %>,
<% }); %>};

export default methodMapping;
`);

const generatedTypingsTemplate = template(`<%= methodTypings.toString("typescript") %>`);

const hooks: components.IHooks = {
  afterCopyStatic: [
    async (dest, frm, component, openrpcDocument) => {
      const destPath = path.join(dest, "package.json");
      const tmplPath = path.join(dest, "_package.json");

      const tmplPkgStr = await readFile(tmplPath, "utf8");
      let tmplPkg = JSON.parse(tmplPkgStr);

      tmplPkg.name = component.name || openrpcDocument.info.title;
      tmplPkg.version = openrpcDocument.info.version;

      let currPkgStr;
      try {
        currPkgStr = await readFile(destPath, "utf8");
        const currPkg = JSON.parse(currPkgStr);
        tmplPkg = {
          ...tmplPkg,
          ...currPkg,
          scripts: {
            ...tmplPkg.scripts,
            ...currPkg.scripts,
          },
          dependencies: {
            ...tmplPkg.dependencies,
            ...currPkg.dependencies,
          },
          devDependencies: {
            ...tmplPkg.devDependencies,
            ...currPkg.devDependencies,
          },
        };
      } catch (e) {
        // do nothing
      }

      await writeFile(destPath, JSON.stringify(tmplPkg, undefined, "  "));
      await remove(tmplPath);
    },
  ],
  afterCompileTemplate: [
    async (dest, frm, component, openrpcDocument, typings) => {

      const methodsFolder = `${dest}/src/methods/`;
      await ensureDir(methodsFolder);

      // Only write new one if there isnt one already.
      await Promise.all(openrpcDocument.methods.map(async (methodOrReference) => {
        const method: MethodObject = methodOrReference as MethodObject;

        const methodFileName = `${methodsFolder}/${method.name}.ts`;

        const functionAliasName = typings.getTypingNames("typescript", method).method;
        const params = method.params as ContentDescriptorObject[];
        const functionParams = params.map(({ name }) => name).join(", ");

        const newFunctionInterface = `const ${method.name}: ${functionAliasName} = (${functionParams}) => {`;

        let exists = true;
        try {
          await access(methodFileName, fs.constants.F_OK);
        } catch (e) {
          exists = false;
        }

        let codeToWrite = "";
        if (exists) {
          const existingMethod = await readFile(methodFileName, "utf8");
          const methodRegExp = new RegExp(`const ${method.name}: ${functionAliasName} = \(.*\) =>`, "gm");
          existingMethod.replace(methodRegExp, newFunctionInterface);
          codeToWrite = existingMethod;
        } else {
          let returnVal = "";
          if (method.examples) {
            const example = method.examples[0] as ExamplePairingObject;
            const exRes = example.result as ExampleObject;
            returnVal = exRes.value;
          }

          let outputReturnVal = returnVal;
          if (typeof returnVal === "string") {
            outputReturnVal = `"${returnVal}"`;
          }

          codeToWrite = [
            `import { ${functionAliasName} } from "../generated-typings";`,
            "",
            newFunctionInterface,
            `  return Promise.resolve(${outputReturnVal});`,
            `};`,
            "",
            `export default ${method.name};`,
            "",
          ].join("\n");
        }

        await writeFile(methodFileName, codeToWrite, "utf8");
      }));

      const imports = openrpcDocument.methods.map((methodOrReference) => {
          const method: MethodObject = methodOrReference as MethodObject;
        return `import ${method.name} from "./${method.name}";`;
      });
      const methodMappingStr = [
        "const methods = {",
        ...openrpcDocument.methods.map((methodOrReference) => {
          const method: MethodObject = methodOrReference as MethodObject;
          return `  ${method.name},`;
        }),
        "};",
      ];

      const defaultExportStr = "export default methods;";

      await writeFile(
        `${methodsFolder}/index.ts`,
        [...imports, "", ...methodMappingStr, "", defaultExportStr, ""].join("\n"),
        "utf8",
      );
    },
  ],
  templateFiles: {
    typescript: [
      {
        path: "src/generated-method-mapping.ts",
        template: methodMappingTemplate,
      },
      {
        path: "src/generated-typings.ts",
        template: generatedTypingsTemplate,
      },
    ],
  },
};

const snapComponent: components.IComponentModule = {
  hooks,

  staticPath: (language: string, type?: string)=> {
    if(!type || type?.search("nostatic") > -1) return undefined
    return path.resolve(__dirname, '..', '..', `templates/snap/`);
  },

}

export default snapComponent;
