import React, { useEffect, useRef, useState } from 'react'
import { IoIosSearch } from 'react-icons/io'
import AlertBox from '../../services/AlertBox'
import { useOutletsContext } from '../../layouts/Management'
import CreateStockTypes from '../../views/stocks/CreateStockTypes'
import UpdateStockTypes from '../../views/stocks/UpdateStockTypes'
import { Button, Empty, Skeleton, Tag, Typography } from 'antd'
import { motion } from "framer-motion";
import { useGetAllStockTypesQuery, useDeleteStockTypeMutation } from '../../../app/Features/stockTypesSlice'
import { toast } from 'react-toastify'

const StockType = () => {
  const [stock_types, setStockTypes] = useState([]);
  const [id, setId] = useState(0)
  const [alertBox, setAlertBox] = useState(false)
  const [edit, setEdit] = useState({ id: 1, name: "" });
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const addModalRef = useRef(null);
  const updateModalRef = useRef(null);
  const token = localStorage.getItem('token');
  const { data, isError, isLoading, refetch } = useGetAllStockTypesQuery(token);
  const [deleteStockType, stockTypeDel] = useDeleteStockTypeMutation();

  useEffect(() => {
    setStockTypes(data?.data || []);
  }, [data]);

  function handleDelete(stock_type_id) {
    setAlertBox(true);
    setId(stock_type_id);
  }
  function handleCancel() {
    setAlertBox(false);
  }
  async function handleConfirm() {
    try {
      setAlertBox(false);
      setLoading(true);
      const response = await deleteStockType({ id, token });
      if (response.data.status === 200) {
        refetch();
        toast.success(response.data.message || 'Stock type deleted successfully!');
        setAlertBox(false);
        setLoading(false);
      } else {
        throw new Error(response.error.data.message || "Failed to delete stock type");
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while deleting the stock type');
      setLoading(false);
      setAlertBox(false);
    }
  }


  function onSearch() {
    if (event.target.value) {
      const filterStockType = data?.data.filter((item) => item.stock_type_name.toLowerCase().includes(event.target.value.toLowerCase()));
      setStockTypes(filterStockType || []);
    } else {
      setStockTypes(data?.data || []);
    }
  }

  function handleUpdate(id, name) {
    updateModalRef.current?.showModal();
    setEdit(prev => { return { ...prev, name: name, id: id } })
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <section className='p-2 md:px-10'>
        <AlertBox
          isOpen={alertBox}
          title="Question"
          message="Are you sure you want delete stock_type?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmText="Ok"
          cancelText="Cancel"
        />
        <article className='flex flex-col gap-5'>
          <article className='flex justify-between items-end'>
            <fieldset className="fieldset p-0 relative">
              <legend className="fieldset-legend text-gray-700 text-xl">Stock Types</legend>
              <input onChange={onSearch} type="text" className="input text-gray-700 bg-white border-none border-gray-400 pl-8 focus:outline-none" placeholder="ស្វែងរក. . ." />
              <IoIosSearch className=' absolute left-2 top-[10px] z-1 text-xl text-gray-400' />
            </fieldset>
            {/* <button className="btn btn-outline btn-success" onClick={() => addModalRef.current?.showModal()}>Add New</button> */}
            <dialog id="my_modal_5" ref={addModalRef} className="modal modal-bottom sm:modal-middle">
              <div className="modal-box bg-gray-100">
                <CreateStockTypes onAdd={() => addModalRef.current?.close()} />
              </div>
            </dialog>
            <dialog id="my_modal_5" ref={updateModalRef} className="modal modal-bottom sm:modal-middle">
              <div className="modal-box bg-gray-100">
                <UpdateStockTypes onAdd={() => updateModalRef.current?.close()} data={edit} />
              </div>
            </dialog>
          </article>
          <div className="overflow-x-auto rounded-box border border-base-300/10 text-gray-600">
            <table className="table bg-white">
              {/* head */}
              <thead className='text-gray-700'>
                <tr>
                  <th>No</th>
                  <th>Stock Type Name</th>
                  <th>created_by</th>
                  {/* <th>Action</th> */}
                </tr>
              </thead>
              <tbody>
                {stock_types.length == 0 && !isLoading ? <tr>
                  <td colSpan={11} rowSpan={11} >
                    <Empty
                      className='w-full flex flex-col items-center justify-center'
                      image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                      styles={{ image: { height: 60 } }}
                      description={
                        <Typography.Text>
                          Not data
                        </Typography.Text>
                      }
                    >
                      <Button type="primary" onClick={() => addModalRef.current?.showModal()}>Create Now</Button>
                    </Empty>
                  </td>
                </tr>
                  : stock_types.map(({ stock_type_id, stock_type_name, created_by }, index) => <tr key={index}>
                    <th>{index + 1}</th>
                    <td>{stock_type_name}</td>
                    <td>{created_by == 0 ? <Tag color='success'>default</Tag> : created_by}</td>
                    {/* <th className='flex gap-1'>
                      <button className="btn btn-ghost btn-xs btn-outline btn-accent text-accent hover:text-white">details</button>
                      <button className="btn btn-ghost btn-xs btn-outline btn-primary text-primary hover:text-white" onClick={() => handleUpdate(stock_type_id, stock_type_name)}>edit</button>
                      <button className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white" onClick={() => handleDelete(stock_type_id)}>delete</button>
                    </th> */}
                  </tr>)}
              </tbody>
            </table>
            <div className={`flex flex-col gap-3 p-3 transition-all duration-500 ${isLoading ? '' : 'hidden'}`}>
              <Skeleton.Button style={{ width: "100%" }} avatar={true} active={true} size={'small'} shape={'default'} block={true} />
              <Skeleton.Button style={{ width: "100%" }} avatar={true} active={true} size={'small'} shape={'default'} block={true} />
              <Skeleton.Button style={{ width: "100%" }} avatar={true} active={true} size={'small'} shape={'default'} block={true} />
              <Skeleton.Button style={{ width: "100%" }} avatar={true} active={true} size={'small'} shape={'default'} block={true} />
            </div>
          </div>
        </article>
      </section>
    </motion.div>
  )
}

export default StockType