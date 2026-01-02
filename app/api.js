<<<<<<< HEAD
import baseUrl from "../src/services/baseUrl";

const url = baseUrl + '/api';
=======
const url = 'https://api.chomnenhapp.com/api';
>>>>>>> 9505cd1e90c9eee4c6916e19339f8d4e66d0f090
const queryData = (path, token) => ({
    url: `${path}`,
    method: 'GET',
    headers: {
        Authorization: `Bearer ${token}`
    }
});

const queryDataById = (id, path, token) => ({
    url: `${path}/${id}`,
    method: 'GET',
    headers: {
        Authorization: `Bearer ${token}`
    }
});

const createData = (itemData, path, token) => ({
    url: `${path}`,
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`
    },
    body: itemData
});

const updateDataByPost = (id, itemData, path, token) => ({
    url: `${path}/${id}`,
    method: 'POST',
    headers: {
        Authorization: `Bearer ${token}`
    },
    body: itemData
});

const updateData = (id, itemData, path, token) => ({
    url: `${path}/${id}`,
    method: 'PUT',
    headers: {
        Authorization: `Bearer ${token}`
    },
    body: itemData
});

const deleteData = (id, path, token) => ({
    url: `${path}/${id}`,
    method: 'DELETE',
    headers: {
        Authorization: `Bearer ${token}`
    }
});
const cancelData = (id, path, token) => ({
    url: `${path}/${id}`,
    method: 'PUT',
    headers: {
        Authorization: `Bearer ${token}`
    }
});
const uncancelData = (id, path, token) => ({
    url: `${path}/${id}`,
    method: 'PUT',
    headers: {
        Authorization: `Bearer ${token}`
    }
});

export {
    queryData,
    queryDataById,
    createData,
    updateDataByPost,
    updateData,
    deleteData,
    cancelData,
    uncancelData,
    url
}
