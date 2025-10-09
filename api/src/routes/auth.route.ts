import { Router } from "express";
import { createAccountHandler, loginHandler, logoutHandler } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { userLoginSchema, userRegistrationSchema } from "../validations/schema.js";
import { auth } from "../middlewares/auth.middleware.js";

const router: Router = Router()

router
  .post('/register', validate(userRegistrationSchema), createAccountHandler)
  .post('/login', validate(userLoginSchema), loginHandler)
  .delete('/logout', auth, logoutHandler)

export default router