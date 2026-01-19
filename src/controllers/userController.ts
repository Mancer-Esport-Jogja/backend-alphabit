import { Request, Response, NextFunction } from 'express';

export const userController = {
  /**
   * Returns the authenticated user's profile.
   */
  getMe: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
