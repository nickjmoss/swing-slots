import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRegisterOptions,
} from 'fastify';
import { apiRoutes } from './api/api.routes';

export const router = (
    fastify: FastifyInstance,
    options: FastifyRegisterOptions<FastifyPluginOptions>,
    next: () => void,
) => {
    fastify.register(apiRoutes, { prefix: '/api' });

    next();
};
