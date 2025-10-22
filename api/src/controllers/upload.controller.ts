import { StatusCodes } from "http-status-codes";
import catchAsync from "../utils/catch-async.js";
import path from "node:path"
import { r2 } from "../lib/r2.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../env.js";

export const uploadResumeHandler = catchAsync(async (req, res) => {
  const file = req.file
  if (file == null) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: { message: 'No file uploaded.' } })
  }
  const fileKey = `resumes/${crypto.randomUUID()}${path.extname(file.originalname)}`
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype
    })
  );
  return res.json({ fileKey })
})