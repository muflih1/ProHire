import axiosFactoty from "axios"

export const axios = axiosFactoty.create({
  baseURL: '/api',
  withCredentials: true
})