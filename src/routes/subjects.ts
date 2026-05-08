import { Router } from 'express';
import * as ctrl from '../controllers/subjectController';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

export const subjectsRouter = Router();

subjectsRouter.use(requireAuth);

subjectsRouter.get('/', ctrl.list);
subjectsRouter.get('/:id', ctrl.getOne);

subjectsRouter.post('/', requireRole("ADMIN"), ctrl.create);
subjectsRouter.patch('/:id', requireRole("ADMIN"), ctrl.update);
subjectsRouter.delete('/:id', requireRole("ADMIN"), ctrl.remove);
