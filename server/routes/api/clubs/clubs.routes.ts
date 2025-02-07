import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRegisterOptions,
} from 'fastify';
import {
    fixForeUpBookingClasses,
    getClubs,
    refreshClubData,
} from '../../../controllers/clubsController';

export const clubRoutes = function (
    fastify: FastifyInstance,
    options: FastifyRegisterOptions<FastifyPluginOptions>,
    next: () => void,
) {
    fastify.get('/refresh', refreshClubData);
    fastify.put('/fixForeUp', fixForeUpBookingClasses);
    fastify.get('/', getClubs);

    next();
};
