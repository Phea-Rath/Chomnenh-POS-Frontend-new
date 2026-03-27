import React, { useEffect, useState, useMemo } from "react";
import { IoIosSearch, IoIosGrid, IoIosList } from "react-icons/io";
import { useOutletsContext } from "../../layouts/Management";
import AlertBox from "../../services/AlertBox";
import { useDebounce } from "use-debounce";
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";
import { useNavigate } from "react-router";
import {
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiAddLine,
  RiUploadCloudLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import api from "../../services/api";
import { useItemText } from "./itemText";

// Custom components
const Button = ({ children, onClick, variant = "default", icon, disabled, className = "" }) => {
  const base = "inline-flex items-center gap-2 px-4 py-2 border rounded text-sm font-medium transition-colors focus:outline-none";
  const variants = {
    default: "border-gray-300 bg-white hover:bg-gray-100 text-gray-700",
    primary: "border-blue-600 bg-blue-600 hover:bg-blue-700 text-white",
    danger: "border-red-600 bg-red-600 hover:bg-red-700 text-white",
    text: "border-transparent bg-transparent hover:bg-gray-100 text-gray-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {children}
    </button>
  );
};

const Tag = ({ children, color = "gray", className = "" }) => {
  const colors = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${colors[color]} ${className}`}>
      {children}
    </span>
  );
};

const Badge = ({ count, color = "blue", className = "" }) => {
  if (!count || count === 0) return null;
  return (
    <span className={`absolute -top-1 -right-1 w-5 h-5 bg-${color}-600 border-2 border-white rounded-full text-white text-xs font-medium flex items-center justify-center ${className}`}>
      {count > 9 ? "9+" : count}
    </span>
  );
};

const LoadingSpinner = ({ tip = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
    <p className="text-gray-600 text-sm">{tip}</p>
  </div>
);

const EmptyState = ({ description, buttonText, onButtonClick }) => (
  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-300 rounded bg-white">
    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4v10l8 4 8-4V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12l8-4m-8 4l-8-4m8 4v10" />
    </svg>
    <p className="text-gray-500 text-sm">{description}</p>
    {buttonText && (
      <Button onClick={onButtonClick} variant="primary" className="mt-4">
        {buttonText}
      </Button>
    )}
  </div>
);

const Pagination = ({ current, total, pageSize, onChange, it }) => {
  const totalPages = Math.ceil(total / pageSize);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded px-4 py-2">
      <div className="text-sm text-gray-600">
        {it("Showing")} {start} {it("to")} {end} {it("of")} {total} {it("items")}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(1)}
          disabled={current === 1}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟪
        </button>
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟨
        </button>
        <span className="px-3 py-1 text-sm">
          {it("Page")} {current} {it("of")} {totalPages}
        </span>
        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟩
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={current === totalPages}
          className="p-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ⟫
        </button>
      </div>
    </div>
  );
};

// Grid Card component
const GridCard = ({ item, onEdit, onDelete, onView, formatCurrency, getDiscount, it }) => {
  const discount = getDiscount(item.price, item.price_discount);
  const inStock = item?.stock?.in_stock || 0;

  return (
    <div className="border border-gray-200 rounded bg-white hover:shadow-sm transition-all duration-300 overflow-hidden group">
      <div onClick={onView} className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/300?text=No+Image";
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Tag color={inStock > 0 ? "success" : "error"}>
            {inStock > 0 ? `${it("Stock:")} ${inStock}` : it("Sold Out")}
          </Tag>
        </div>
        {item.discount > 0 && (
          <div className="absolute top-2 right-0">
            <Tag color="error" className="rounded-l-md border-none font-bold">{item.discount}% {it("off")}</Tag>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="mb-2">
          <p className="text-xs text-gray-500 uppercase font-bold">{item.category_name}</p>
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{item.name}</h3>
        </div>
        <div className="bg-gray-50 rounded p-2 flex justify-between items-center">
          <span className="font-bold text-lg text-green-600">{formatCurrency(item.price_discount || item.price)}</span>
          <div className="flex gap-1">
            <button onClick={onView} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
              <RiEyeLine size={14} />
            </button>
            <button onClick={onEdit} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200">
              <RiEditLine size={14} />
            </button>
            <button onClick={onDelete} className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
              <RiDeleteBinLine size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// List View Table
const ListView = ({ items, navigator, onDelete, formatCurrency, it }) => (
  <div className="bg-white border border-gray-200 rounded overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">{it("Product")}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">{it("Code")}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">{it("Stock")}</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">{it("Price")}</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">{it("Actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => {
            const inStock = item?.stock?.in_stock || 0;
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40?text=No+Image";
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Tag color="gray">#{item.code}</Tag>
                </td>
                <td className="px-4 py-3">
                  <Tag color={inStock > 0 ? "success" : "error"}>
                    {inStock} {it("In Stock")}
                  </Tag>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(item.price_discount || item.price)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => navigator(`detail/${item.id}`)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <RiEyeLine size={14} />
                    </button>
                    <button
                      onClick={() => navigator(`update/${item.id}`)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <RiEditLine size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <RiDeleteBinLine size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const ListItem = () => {
  const { it } = useItemText();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(localStorage.getItem("itemViewMode") || "grid");
  const [alertBox, setAlertBox] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const { setLoading } = useOutletsContext();
  const token = localStorage.getItem("token");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const { data, isLoading, isFetching, refetch } = useGetAllItemsQuery({
    token,
    limit: pageSize,
    page: currentPage,
    search: debouncedSearch
  });

  const items = useMemo(() => data?.data || [], [data]);
  const totalItems = data?.pagination?.total || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleDelete = (itemId) => {
    setDeleteItemId(itemId);
    setAlertBox(true);
  };

  const handleConfirmDelete = async () => {
    setAlertBox(false);
    setLoading(true);
    try {
      const res = await api.delete(`items/${deleteItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 200) {
        toast.success(it("Item deleted successfully"));
        refetch();
      }
    } catch (error) {
      toast.error(error?.message || it("Error deleting item"));
    } finally {
      setLoading(false);
      setDeleteItemId(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const getDiscountPercentage = (price, discountPrice) => {
    if (!price || !discountPrice || price <= discountPrice) return 0;
    return Math.round(((price - discountPrice) / price) * 100);
  };

  return (
    <div className="items-page min-h-screen bg-transparent pb-5">
      <AlertBox
        isOpen={alertBox}
        title={it("Delete Item")}
        message={it("This action is permanent. Are you sure?")}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAlertBox(false)}
        confirmColor="error"
      />

      {/* Header */}
      <div className="border-b border-gray-200 p-3">
        <div className="mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{it("Items")}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {totalItems} {it("total items found")}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={() => navigate("import")}
              icon={<RiUploadCloudLine />}
              variant="default"
              className="flex-1 md:flex-none"
            >
              {it("Import")}
            </Button>
            <Button
              onClick={() => navigate("create")}
              icon={<RiAddLine />}
              variant="primary"
              className="flex-1 md:flex-none"
            >
              {it("Add New")}
            </Button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto px-2">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              placeholder={it("Search database by name, code or category...")}
              className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IoIosSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>

          <div className="flex items-center gap-2 bg-white p-1 border border-gray-300 rounded self-end lg:self-auto">
            <button
              onClick={() => { setViewMode("grid"); localStorage.setItem("itemViewMode", "grid"); }}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <IoIosGrid size={20} />
            </button>
            <button
              onClick={() => { setViewMode("list"); localStorage.setItem("itemViewMode", "list"); }}
              className={`p-2 rounded ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              <IoIosList size={20} />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border-0 bg-transparent text-sm focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading || isFetching ? (
          <LoadingSpinner tip={it("Syncing with database...")} />
        ) : items.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {items.map((item) => (
                <GridCard
                  key={item.id}
                  item={item}
                  onEdit={() => navigate(`update/${item.id}`)}
                  onDelete={() => handleDelete(item.id)}
                  onView={() => navigate(`detail/${item.id}`)}
                  formatCurrency={formatCurrency}
                  getDiscount={getDiscountPercentage}
                  it={it}
                />
              ))}
            </div>
          ) : (
            <ListView
              items={items}
              navigator={navigate}
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
              it={it}
            />
          )
        ) : (
          <EmptyState
            description={it("No results found matching your search")}
            buttonText={it("Add Item")}
            onButtonClick={() => navigate("create")}
          />
        )}

        {/* Pagination */}
        {items.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              it={it}
              onChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ListItem;
