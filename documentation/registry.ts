import { OpenAPIBuilder } from 'openapi3-ts/oas30';
import { ErrorResponseSchema } from './responses/common';

export const registry = {
  components: new Map<string, any>(),
  paths: new Map<string, any>(),

  registerComponent(type: 'schemas' | 'securitySchemes', name: string, schema: any) {
    if (!this.components.has(type)) {
      this.components.set(type, {});
    }
    this.components.get(type)![name] = schema;
  },

  registerPath(path: any) {
    this.paths.set(path.path, path);
  },

  registerPaths(builder: OpenAPIBuilder) {
    this.paths.forEach(path => {
      builder.addPath(path.path, path.method, path.options);
    });

    this.components.forEach((components, type) => {
      Object.entries(components).forEach(([name, schema]) => {
        if (type === 'schemas') {
          builder.addSchema(name, schema);
        } else if (type === 'securitySchemes') {
          builder.addSecurityScheme(name, schema);
        }
      });
    });
  },
};