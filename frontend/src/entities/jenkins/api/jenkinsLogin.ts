import axios from 'axios';

const url = import.meta.env.VITE_API_URL;
const endpoint = `${url}/jenkinsapi/login`;

export const jenkinsLogin = async (initialPassword: string) => {
  const response = await axios.post(endpoint, initialPassword);
  console.log(response);
  return response.data;
};
