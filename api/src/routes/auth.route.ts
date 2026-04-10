import {Router} from 'express';
import {
  loginHandler,
  createAccountHandler,
  logoutHandler,
  sessionHandler,
} from '../controllers/auth.controller.js';
import {validate} from '../middlewares/validate.middleware.js';
import {
  userLoginSchema,
  userRegistrationSchema,
} from '../validations/schema.js';
import {auth} from '../middlewares/auth.middleware.js';

const router: Router = Router();

router
  .get('/session', sessionHandler)
  .post('/sign_up', createAccountHandler)
  .post('/sign_in', validate(userLoginSchema), loginHandler)
  .delete('/sign_out', auth, logoutHandler);

export default router;
