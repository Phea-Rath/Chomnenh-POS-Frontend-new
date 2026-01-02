const url = 'http://206.189.155.96/api';
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