import { OpenAPIBuilder } from 'openapi3-ts/oas30';
import { registry } from './registry';

export const generateOpenApiSpec = () => {
  const builder = new OpenAPIBuilder()
    .addInfo({
      title: 'BañosTour API',
      description: 'API REST para la gestión de tours y reservas',
      version: '1.0.0',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'dev@banostour.ec',
      },
    })
    .addServer({
      url: 'http://localhost:3000/api',
      description: 'Servidor local de desarrollo',
    })
    .addSecurityScheme('cookieAuth', {
      type: 'apiKey',
      in: 'cookie',
      name: 'session',
    })
    .addSecurityScheme('bearerAuth', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });

  registry.registerPaths(builder);
  return builder.build();
};