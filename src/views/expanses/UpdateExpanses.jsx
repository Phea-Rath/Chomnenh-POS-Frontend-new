import React, { useEffect, useState } from 'react'
import AlertBox from '../../services/AlertBox';
import { useOutletsContext } from '../../layouts/Management';
import { useNavigate } from 'react-router';
import { useExpContext } from '../../components/expanses/Expanses';
import { useGetAllExpansesQuery, useUpdateExpanseMutation } from '../../../app/Features/expansesSlice';
import { toast } from 'react-toastify';

const UpdateExpanses = () => {
  const { expanseType, onAdd, expanseItems, edit } = useExpContext();

  const [expType, setexpType] = useState([]);
  const navigator = useNavigate();
  const { setLoading, loading, setAlert, setMessage, setAlertStatus } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem('token');
  const [expanse, setexpanse] = useState({ expanse_supplier: '', expanse_by: '', expanse_date: '', expanse_other: '', amount: 0, items: [] })
  const { refetch } = useGetAllExpansesQuery(token);
  const [updateExpanse, { isLoading, isError }] = useUpdateExpanseMutation();

  useEffect(() => {
    setexpType(expanseType || []);
    setexpanse(() => {
      return {
        expanse_supplier: edit?.expanse_supplier || '',
        expanse_by: edit?.expanse_by || '',
        expanse_date: edit?.expanse_date || '',
        expanse_other: edit?.expanse_other || '',
        amount: edit?.amount || '',
        items: expanseItems || []
      }
    });

  }, [expanseType, expanseItems, edit]);

  function onSelectExptype(e) {
    const filterExp = expType.filter(exp => exp.expanse_type_id != e.target.value);
    setexpType(filterExp);
    const finding = expType.find(exp => exp.expanse_type_id == e.target.value);
    const exsistExp = expanse?.items?.find(exp => exp.expanse_type_id == e.target.value);
    if (exsistExp) {
      setexpanse(prev => ({
        ...prev,
        items: prev.items.map(exp =>
          exp.expanse_type_id == e.target.value
            ? { ...exp, quantity: Number(exp.quantity || 0) + 1 }
            : exp
        )
      }));
    } else {
      const filterIncreament = { ...finding, quantity: 1 };
      setexpanse(prev => ({
        ...prev,
        items: [...prev.items, filterIncreament]
      }));
    }

    e.target.value = "Pick a expanse type";
  }


  function handleSubmit() {
    setexpanse(p => {
      const amount = p.items?.reduce((init, exp) => Number(exp.sub_total) + init, 0);
      return { ...p, amount: amount };
    });
    setAlertBox(true);
  }

  function handleCancel() {
    setAlertBox(false);
  }


  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await updateExpanse({ id: edit.expanse_id, itemData: expanse, token });
      if (response.data.status === 200) {
        refetch();
        toast.success(response.data.message || 'Expanse updated successfully');
        setLoading(false);
        onAdd();
        navigator('/dashboard/expanse');
      } else {
        toast.error(response.data.message || 'Failed to update the expanse');
        setLoading(false);
        setAlertBox(false);
      }
    } catch (error) {
      toast.error(error?.message || error || 'An error occurred while updating the expanse');
      setLoading(false);
      setAlertBox(false);
    }
  }


  const handleChange = (index, field, value) => {
    setexpanse(prev => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // Recalculate sub_total if quantity or unit_price is updated
      const quantity = parseFloat(updated[index].quantity) || 1;
      const unit_price = parseFloat(updated[index].unit_price) || 1;
      updated[index].sub_total = (quantity * unit_price).toFixed(2);

      return { ...prev, items: updated };
    });
  };

  function handleRemove(id) {
    const filtering = expanse?.items?.filter(exp => exp.expanse_type_id != id);
    console.log('expType', expType);
    const finding = expanseType.find(exp => exp.expanse_type_id == id);
    setexpType(prev => { return [...prev, finding] });
    setexpanse(p => {
      return {
        ...p, items: filtering
      }
    })
  }


  return (
    <section>
      <AlertBox
        isOpen={alertBox}
        title="Question"
        message="Are you sure you want create expanse?"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Ok"
        cancelText="Cancel"
      />
      <fieldset className="fieldset w-full text-black bg-transparent">
        <legend className="fieldset-legend text-xl text-black">Update Expanse</legend>
        <article className='grid grid-cols-3 gap-5'>
          <nav className='flex flex-col gap-3 flex-1 col-span-2'>
            <label className="select bg-transparent border-gray-400 order-1">
              <span className="label">Expanse Type</span>
              <select value={'Pick a expanse type'} onChange={onSelectExptype} className=' bg-transparent'>
                <option disabled={true} >Pick a expanse type</option>
                {expType?.map(({ expanse_type_id, expanse_type_name }, index) => <option key={index} value={expanse_type_id}>{expanse_type_name}</option>)}
              </select>
            </label>
          </nav>
          <nav className=' order-3 col-span-2'>
            <div className="overflow-x-auto rounded-box border border-base-300/10 text-gray-600">
              <table className="table">
                {/* head */}
                <thead className='text-gray-700'>
                  <tr>
                    <th>ល.រ</th>
                    <th>ប្រភេទចំណាយ</th>
                    <th>បរិយាយ</th>
                    <th>បរិមាណ</th>
                    <th>តម្លៃឯកតា</th>
                    <th>សរុប</th>
                    <th>លុប</th>
                  </tr>
                </thead>
                <tbody>
                  {/* row 1 */}
                  {expanse.items?.map((exp, index) => <tr key={index}>
                    <th>{index + 1}</th>
                    <td>{exp.expanse_type_name}</td>
                    <td className='p-0 m-0'>
                      <fieldset className="fieldset">
                        <input type="text" value={exp.description || ""} onChange={(e) => handleChange(index, 'description', e.target.value)} className="input bg-transparent border-none focus:outline-none" placeholder="Enter here..." />
                      </fieldset>
                    </td>
                    <td>
                      <fieldset className="fieldset">
                        <input type="number" min={1} onChange={(e) => handleChange(index, 'quantity', e.target.value)} value={exp.quantity || ""} placeholder="0" className="input  bg-transparent border-none focus:outline-none" />
                      </fieldset>
                    </td>
                    <td className='p-0 m-0'>
                      <fieldset className="fieldset">
                        <input type="number" min={1} value={exp.unit_price || ""} onChange={(e) => handleChange(index, 'unit_price', e.target.value)} className="input bg-transparent border-none focus:outline-none" placeholder="0" />
                      </fieldset>
                    </td>
                    <td className='p-0 m-0'>
                      <fieldset className="fieldset">
                        <input type="text" onChange={(e) => handleChange(index, 'sub_total', e.target.value)} value={exp.sub_total || ""} className="input bg-transparent border-none focus:outline-none" placeholder="0" />
                      </fieldset>
                    </td>
                    <th className='flex gap-1'>
                      <button className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white" onClick={() => handleRemove(exp.expanse_type_id)}>Delete</button>
                    </th>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </nav>
          <nav className='flex flex-col gap-3 flex-1 order-2 row-span-2'>
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">អ្នកផ្គត់ផ្គង់</span>
              <input type="text" defaultValue={expanse.expanse_supplier} onChange={(e) => { setexpanse(prev => { return { ...prev, expanse_supplier: e.target.value } }); }} placeholder="Enter here. . ." />
            </label>
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">អ្នកចំណាយ</span>
              <input type="text" defaultValue={expanse.expanse_by} onChange={(e) => { setexpanse(prev => { return { ...prev, expanse_by: e.target.value } }) }} placeholder="Enter here. . ." />
            </label>
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">ថ្ងៃចំណាយ</span>
              <input type="date" defaultValue={expanse.expanse_date} onChange={(e) => { setexpanse(prev => { return { ...prev, expanse_date: e.target.value || expDate } }) }} />
            </label>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-gray-500">ផ្សេងៗ</legend>
              <textarea className="textarea h-24 bg-transparent border-gray-400" defaultValue={expanse.expanse_other} onChange={(e) => { setexpanse(prev => { return { ...prev, expanse_other: e.target.value } }) }} placeholder="Discription. . ."></textarea>
            </fieldset>
          </nav>
        </article>
        <div className='flex items-end gap-2'>
          <button className="btn btn-success mt-4 flex-1" onClick={handleSubmit}>Submit</button>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button, it will close the modal */}
              <button className="btn btn-error" onClick={() => navigator('/dashboard/expanse')}>Close</button>
            </form>
          </div>
        </div>
      </fieldset>
    </section>
  )
}

export default UpdateExpanses