import { axios } from "@/lib/axios";

export async function userLogin(data: {email: string; password: string}) {
  const res = await axios.post('/auth/login', data)
  return res.data
}