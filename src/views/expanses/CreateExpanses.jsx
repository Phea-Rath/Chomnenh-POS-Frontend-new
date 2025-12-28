import React, { useEffect, useState } from "react";
import AlertBox from "../../services/AlertBox";
import { useOutletsContext } from "../../layouts/Management";
import { useNavigate } from "react-router";
import { useExpContext } from "../../components/expanses/Expanses";
import {
  useCreateExpanseMutation,
  useGetAllExpansesQuery,
} from "../../../app/Features/expansesSlice";
import { toast } from "react-toastify";
import api from "../../services/api";

const CreateExpanses = () => {
  const [expanse_type, setexpanse_type] = useState([]);
  const { expanseType, onAdd } = useExpContext();
  const [expType, setexpType] = useState([]);
  const today = new Date();
  const navigator = useNavigate();
  const expDate = today.toISOString().split("T")[0];
  const {
    setLoading,
    loading,
    setAlert,
    setMessage,
    setAlertStatus,
    reload,
    setReload,
  } = useOutletsContext();
  const [alertBox, setAlertBox] = useState(false);
  const token = localStorage.getItem("token");
  const [expanse, setexpanse] = useState({
    expanse_supplier: "",
    expanse_by: "",
    expanse_date: expDate,
    expanse_other: "",
    amount: 0,
    items: [],
  });
  const { refetch } = useGetAllExpansesQuery(token);
  const [createExpanse, expanseCreated] = useCreateExpanseMutation();
  useEffect(() => {
    setexpType(expanseType || []);
  }, [expanseType]);

  function onSelectExptype(e) {
    const filterExp = expType.filter(
      (exp) => exp.expanse_type_id != e.target.value
    );
    setexpType(filterExp);
    const finding = expanseType.find(
      (exp) => exp.expanse_type_id == e.target.value
    );
    const exsistExp = expanse_type.find(
      (exp) => exp.expanse_type_id == e.target.value
    );
    if (exsistExp) {
      setexpanse_type((prev) =>
        prev.map((exp) =>
          exp.expanse_type_id == e.target.value
            ? { ...exp, quantity: Number(exsistExp.quantity) + 1 } // safely increment
            : exp
        )
      );
    } else {
      // finding.quantity = 1;
      const findingIncreament = { ...finding, quantity: 1 };
      setexpanse_type((prev) => {
        return [...prev, findingIncreament];
      });
    }

    e.target.value = "Pick a expanse type";
  }

  function handleRemove(id) {
    const filtering = expanse_type.filter((exp) => exp.expanse_type_id != id);
    const finding = expanse_type.find((exp) => exp.expanse_type_id == id);
    // console.log(finding);
    setexpanse_type(filtering);
    setexpType((prev) => {
      return [...prev, finding];
    });
  }

  function handleSubmit() {
    setexpanse((p) => {
      const amount = expanse_type.reduce(
        (init, exp) => Number(exp.sub_total) + init,
        0
      );
      return { ...p, amount: amount };
    });
    setAlertBox(true);
    expanse.items = expanse_type;
  }

  function handleCancel() {
    setAlertBox(false);
  }
  async function handleConfirm() {
    try {
      setLoading(true);
      setAlertBox(false);
      const response = await createExpanse({ itemData: expanse, token });
      // const response = await api.post('/expanse_masters', expanse, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 200) {
        refetch();
        toast.success("Expanse created successfully");
        setLoading(false);
        onAdd();
        navigator("/dashboard/expanse");
      }
    } catch (error) {
      toast.error(
        error?.message ||
        error ||
        "An error occurred while creating the expanse"
      );
      setLoading(false);
      setAlertBox(false);
    }
  }

  const handleChange = (index, field, value) => {
    setexpanse_type((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // Recalculate sub_total if quantity or unit_price is updated
      const quantity = parseFloat(updated[index].quantity) || 1;
      const unit_price = parseFloat(updated[index].unit_price) || 1;
      updated[index].sub_total = (quantity * unit_price).toFixed(2);

      return updated;
    });
  };

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
        <legend className="fieldset-legend text-xl text-black">
          Create Expanse
        </legend>
        <article className="grid grid-cols-3 gap-5">
          <nav className="flex flex-col gap-3 flex-1 col-span-2">
            <label className="select bg-transparent border-gray-400 order-1">
              <span className="label">Expanse Type</span>
              <select
                defaultValue={"Pick a expanse type"}
                onChange={onSelectExptype}
                className=" bg-transparent"
              >
                <option disabled={true}>Pick a expense type</option>
                {expType?.map(
                  ({ expanse_type_id, expanse_type_name }, index) => (
                    <option key={index} value={expanse_type_id}>
                      {expanse_type_name}
                    </option>
                  )
                )}
              </select>
            </label>
          </nav>
          <nav className=" order-3 col-span-2">
            <div className="overflow-x-auto rounded-box border border-base-300/10 text-gray-600">
              <table className="table">
                {/* head */}
                <thead className="text-gray-700">
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
                  {expanse_type?.map((exp, index) => (
                    <tr key={index}>
                      <th>{index + 1}</th>
                      <td>{exp.expanse_type_name}</td>
                      <td className="p-0 m-0">
                        <fieldset className="fieldset">
                          <input
                            type="text"
                            onChange={(e) =>
                              handleChange(index, "description", e.target.value)
                            }
                            defaultValue={exp.description ?? ""}
                            className="input bg-transparent border-none focus:outline-none"
                            placeholder="Enter here..."
                          />
                        </fieldset>
                      </td>
                      <td>
                        <fieldset className="fieldset">
                          <input
                            type="number"
                            min={1}
                            onChange={(e) =>
                              handleChange(index, "quantity", e.target.value)
                            }
                            defaultValue={exp.quantity ?? ""}
                            placeholder="0"
                            className="input  bg-transparent border-none focus:outline-none"
                          />
                        </fieldset>
                      </td>
                      <td className="p-0 m-0">
                        <fieldset className="fieldset">
                          <input
                            type="number"
                            min={1}
                            defaultValue={exp.unit_price ?? ""}
                            onChange={(e) =>
                              handleChange(index, "unit_price", e.target.value)
                            }
                            className="input bg-transparent border-none focus:outline-none"
                            placeholder="0"
                          />
                        </fieldset>
                      </td>
                      <td className="p-0 m-0">
                        <fieldset className="fieldset">
                          <input
                            type="text"
                            defaultValue={exp.sub_total || 1}
                            onChange={(e) =>
                              handleChange(index, "sub_total", e.target.value)
                            }
                            value={exp.sub_total}
                            className="input bg-transparent border-none focus:outline-none"
                            placeholder="0"
                          />
                        </fieldset>
                      </td>
                      <th className="flex gap-1">
                        <button
                          className="btn btn-ghost btn-xs btn-outline btn-error text-error hover:text-white"
                          onClick={() => handleRemove(exp.expanse_type_id)}
                        >
                          Delete
                        </button>
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </nav>
          <nav className="flex flex-col gap-3 flex-1 order-2 row-span-2">
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">អ្នកផ្គត់ផ្គង់</span>
              <input
                type="text"
                onChange={(e) => {
                  setexpanse((prev) => {
                    return { ...prev, expanse_supplier: e.target.value };
                  });
                }}
                placeholder="Enter here. . ."
              />
            </label>
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">អ្នកចំណាយ</span>
              <input
                type="text"
                onChange={(e) => {
                  setexpanse((prev) => {
                    return { ...prev, expanse_by: e.target.value };
                  });
                }}
                placeholder="Enter here. . ."
              />
            </label>
            <label className="input bg-transparent border-gray-400 focus:outline-none">
              <span className="label">ថ្ងៃចំណាយ</span>
              <input
                type="date"
                onChange={(e) => {
                  setexpanse((prev) => {
                    return { ...prev, expanse_date: e.target.value || expDate };
                  });
                }}
                defaultValue={expDate}
              />
            </label>
            <fieldset className="fieldset">
              <legend className="fieldset-legend text-gray-500">ផ្សេងៗ</legend>
              <textarea
                className="textarea h-24 bg-transparent border-gray-400"
                onChange={(e) => {
                  setexpanse((prev) => {
                    return { ...prev, expanse_other: e.target.value };
                  });
                }}
                placeholder="Discription. . ."
              ></textarea>
            </fieldset>
          </nav>
        </article>
        <div className="flex items-end gap-2">
          <button
            className="btn btn-success mt-4 flex-1"
            onClick={handleSubmit}
          >
            Submit
          </button>
          <div className="modal-action">
            <form
              onSubmit={async () => await navigator("/dashboard/expanse")}
              method="dialog"
            >
              {/* if there is a button, it will close the modal */}
              <button type="submit" className="btn btn-error">
                Close
              </button>
            </form>
          </div>
        </div>
      </fieldset>
    </section>
  );
};

export default CreateExpanses;
