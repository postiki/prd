import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const AuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.SECRET_KEY as string, (err, user) => {
        if (err) {
            return res.status(403).send({ message: 'Token expired' });
        }

        // req.user = user as MyUserType; // MyUserType - это ваш пользовательский тип данных

        next();
    });
};

export default AuthMiddleware;
