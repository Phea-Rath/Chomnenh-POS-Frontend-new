import { FaTrash } from "react-icons/fa";
import Input from "./Input";

const ItemTable = ({ data, t, onDelete, onQtyChange, onCostChange ,haedTitle    }) => {
    
    return (
        <div className="overflow-hidden  border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600 dark:bg-gray-900/50 dark:text-gray-400">
                    <tr>
                        {haedTitle.map((item, index) => (
                            <th key={index} className="px-6 py-4 font-semibold">{item.title}</th>
                        ))}
                        <th></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                    {data?.map((item, index) => (
                        <tr
                            key={index}
                            className="group transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                        >
                            <td className="px-6 py-4">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {item.name}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex justify-center">
                                    <Input
                                        type="number"
                                        name="quantity"
                                        value={item?.quantity}
                                        id="quantity"
                                        placeholder="0"
                                        onChange={(value) => onQtyChange(index, Number(value))}
                                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-center transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                {/* ${item.item_cost.toLocaleString()} */}
                                <div className="flex items-center">
                                    <Input
                                        type="number"
                                        name="item_cost"
                                        value={item?.item_cost}
                                        id="item_cost"
                                        placeholder="0"
                                        onChange={(value) => onCostChange(index, Number(value))}
                                        className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1 text-center transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        onWheel={(e) => e.target.blur()}
                                    />
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                                ${(item.quantity * item.item_cost).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onDelete(index)}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ItemTable;