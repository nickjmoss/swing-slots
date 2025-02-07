import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { router } from './routes/index.routes';
import path from 'path';
const PORT = Number(process.env.PORT) || 4000;
const NODE_ENV = (process.env.NODE_ENV as string) || 'development';
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

interface LoggerOptions {
    [key: string]:
        | boolean
        | {
              transport: {
                  target: string;
              };
              serializers: {
                  res(reply: any): any;
                  req(request: any): any;
              };
          };
}

const envToLogger: LoggerOptions = {
    development: {
        transport: {
            target: 'pino-pretty',
        },
        serializers: {
            res(reply) {
                // The default
                return {
                    statusCode: reply.statusCode,
                };
            },
            req(request) {
                return {
                    method: request.method,
                    url: request.url,
                    path: request.routerPath,
                    parameters: request.params,
                    body: request.body,
                };
            },
        },
    },
    production: true,
    test: false,
};

const server = fastify({
    logger: envToLogger[NODE_ENV] ?? true,
});

// Send static index.html file in production since Vite cannot
// perform TS compilation when receiving the index.html file
// from a server request. So Vite handles the index.html file for development
// instead of the server
server.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend-build'),
});

server.register(fastifyCors, {
    origin: '*',
});

server.setNotFoundHandler((request, reply) => {
    reply.header('Content-Type', 'text/html');
    return reply.sendFile('index.html');
});

server.register(router);

server.listen({ host: HOST, port: PORT }, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server listening on port ${PORT}`);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing server');
    await server.close();
    console.log('server closed successfully');
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGTERM signal received: closing server');
    await server.close();
    console.log('server closed successfully');
    process.exit(0);
});
