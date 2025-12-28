import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

// បង្កើតធាតុថ្មី
const createItem = async (path,itemData,token) => {
  const response = await axios.post(API_URL+`${path}`, itemData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

// ទាញយកធាតុទាំងអស់
const getItems = async (path,token) => {
  const response = await axios.get(API_URL+`${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

// ធ្វើបច្ចុប្បន្នភាពធាតុ
const updateItem = async (path,id, itemData,token) => {
  const response = await axios.put(`${API_URL}${path}/${id}`, itemData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
const updateItemByPost = async (path,id, itemData,token) => {
  const response = await axios.post(`${API_URL}${path}/${id}`, itemData, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

// លុបធាតុ
const deleteItem = async (path,id,token) => {
  const response = await axios.delete(`${API_URL}${path}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
const cancelItem = async (id,token) => {
  const response = await axios.put(`${API_URL}order_cancel/${id}`,null, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};
const uncancelItem = async (id,token) => {
  const response = await axios.put(`${API_URL}order_uncancel/${id}`,null, { headers: { Authorization: `Bearer ${token}` } });
  return response.data;
};

const apiService = {
  createItem,
  getItems,
  updateItem,
  updateItemByPost,
  deleteItem,
  cancelItem,
  uncancelItem
};

export default apiService;