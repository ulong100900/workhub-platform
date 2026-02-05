// src/routes/user.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Получить текущего пользователя
router.get('/me', authMiddleware, (req: any, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// Получить пользователя по ID
router.get('/:id', async (req, res) => {
  try {
    // Временная заглушка
    res.json({
      success: true,
      data: {
        id: req.params.id,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения пользователя'
    });
  }
});

// Обновить профиль
router.put('/profile', authMiddleware, async (req: any, res) => {
  try {
    // Временная заглушка
    res.json({
      success: true,
      message: 'Профиль обновлен',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления профиля'
    });
  }
});

export default router;