import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRegisterOptions,
} from 'fastify';
import { clubRoutes } from './clubs/clubs.routes';
import { teeTimesRoutes } from './teeTimes/teeTimes.routes';

export const apiRoutes = function (
    fastify: FastifyInstance,
    options: FastifyRegisterOptions<FastifyPluginOptions>,
    next: () => void,
) {
    fastify.get('/ping', async () => {
        return 'pong';
    });

    fastify.register(clubRoutes, { prefix: '/clubs' });
    fastify.register(teeTimesRoutes, { prefix: '/teeTimes' });

    next();
};
