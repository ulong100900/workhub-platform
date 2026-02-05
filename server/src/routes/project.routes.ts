import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware, clientMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProjectById);

// Protected routes
router.post('/', authMiddleware, clientMiddleware, ProjectController.createProject);
router.put('/:id', authMiddleware, ProjectController.updateProject);
router.delete('/:id', authMiddleware, ProjectController.deleteProject);
router.put('/:id/status', authMiddleware, ProjectController.updateProjectStatus);
router.post('/:id/select-freelancer', authMiddleware, ProjectController.selectFreelancer);
router.get('/user/me', authMiddleware, ProjectController.getUserProjects); // Изменено с /:userId на /me

export default router;