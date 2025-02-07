import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRegisterOptions,
} from 'fastify';
import { getTeeTimes } from '../../../controllers/teeTimeController';

export const teeTimesRoutes = function (
    fastify: FastifyInstance,
    options: FastifyRegisterOptions<FastifyPluginOptions>,
    next: () => void,
) {
    fastify.get('/', getTeeTimes);

    next();
};
