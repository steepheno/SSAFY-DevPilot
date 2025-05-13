import axios from 'axios';

const url = import.meta.env.VITE_API_URL;
const endpoint = `${url}/initial-setting/install`;

export const jenkinsInstall = async () => {
  const response = await axios.post(endpoint);
  console.log(response);
  return response.data;
};
