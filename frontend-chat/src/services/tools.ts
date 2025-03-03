import axios from 'axios';

const tools = axios.create({
  baseURL: process.env.API_TOOLS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default tools;
