// import { Request, Response, NextFunction } from 'express';
// import { AnyZodObject, ZodError } from 'zod';

// const validate =
//   (schema: AnyZodObject) =>
//   (req: Request, res: Response, next: NextFunction) => {
//     try {
//       schema.parse(req.body);
//       next();
//     } catch (e) {
//       if (e instanceof ZodError) {
//         return res.status(400).json({ error: e.errors });
//       }
//       next(e); // Pass any unexpected errors to the next middleware
//     }
//   };

// export default validate;
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      return res.status(400).json({ error: error.errors });
    }
  };

export default validate;
