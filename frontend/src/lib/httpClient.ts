import Axios from 'axios'
import dotenv from "dotenv";


const httpClient = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL!,
  headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  withXSRFToken: true,
})

export default httpClient
