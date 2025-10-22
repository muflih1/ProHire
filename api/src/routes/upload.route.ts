import { Router } from "express";
import multer from "multer";
import { uploadResumeHandler } from "../controllers/upload.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router: Router = Router()

const upload = multer({ storage: multer.memoryStorage() })

router.post('/resume.json', auth, upload.single('file'), uploadResumeHandler)

export default router