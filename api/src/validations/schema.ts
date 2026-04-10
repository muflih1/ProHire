import {z} from "zod";

export const userRegistrationSchema = z.object({
  displayName: z.string().nonempty(),
  email: z.email().nonempty(),
  password: z.string().nonempty().min(6)
})

export const userLoginSchema = z.object({
  email_address: z.email().nonempty(),
  password: z.string()
})