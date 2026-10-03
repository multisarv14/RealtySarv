import { Router } from 'express';
import authRoutes from './auth';
import collectionRoutes from './collections';
import tenantRoutes from './tenants';
import { requireAuth } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import webhookRoutes, { recordingRoute } from './webhooks';
import integrationRoutes, { eventsHandler } from './integrations';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
// Main site (no company yet): check an address / create a company.
router.use('/tenants', tenantRoutes);
// Everything below belongs to one company, chosen by the address in the browser (acme.realtysarv.com).
router.use('/auth', resolveTenant, authRoutes);
// Vendors' callbacks and the simulator's sample recording (public, no session).
router.use('/webhooks', webhookRoutes);
router.get('/simulator/recording/:id.wav', recordingRoute);
// EventSource cannot send an Authorization header, so for the live-updates stream the token may come in the query.
router.get('/events', resolveTenant, (req, _res, next) => { if (!req.headers.authorization && typeof req.query.token === 'string') req.headers.authorization = `Bearer ${req.query.token}`; next(); }, requireAuth, eventsHandler);
router.use('/', resolveTenant, requireAuth, integrationRoutes, collectionRoutes);

export default router;
