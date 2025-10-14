import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { selectCurrentOrganizationHandler } from "../controllers/organization.controller.js";

const router: Router = Router()

router.post('/select', auth, selectCurrentOrganizationHandler)

export default router