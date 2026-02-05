// src/routes/message.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Messages endpoint' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Message ${req.params.id}` });
});

export default router;