import axios from 'axios';

const backend = axios.create({
  baseURL: process.env.API_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const toolsApi = axios.create({
  baseURL: process.env.URI_TOOLS,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default backend;
