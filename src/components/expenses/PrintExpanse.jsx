import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router';
import { useGetExpanseByIdQuery } from '../../../app/Features/expensesSlice';
import { toast } from 'react-toastify';
import handleDownload from '../../services/imageDowload';

const PrintExpanse = () => {
  const [data, setData] = useState({
    expense_no: '',
    expense_date: '',
    expense_by: '',
    expense_other: '',
    amount: '',
    items: []
  });
  const receiptRef = useRef();
  const [totalAmount, setTotalAmount] = useState(0);
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data: expenseData } = useGetExpanseByIdQuery({ id, token });
  console.log(expenseData);



  useEffect(() => {
    setData(expenseData?.data);
    const totalAmount = expenseData?.data?.items?.reduce(
      (sum, item) => sum + Number(item.sub_total || 0),
      0
    );
    setTotalAmount(totalAmount)
  }, [expenseData])

  const copyURL = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('URL copied!');
  }

  return (
    <section className="text-gray-800 h-[100vh]">

      <div className="button-group">
        <button onClick={() => window.print()}>🖨️ Print</button>
        <button onClick={copyURL}>🔗 Copy URL</button>
        <button onClick={() => handleDownload(receiptRef, 'jpg', 'Expanse', data?.expense_no)}>Download</button>
      </div>

      <div ref={receiptRef} className="receipt-container">
        <div className="header">
          <h1>Expense Receipt</h1>
          <p>Printed from Accounting System</p>
        </div>

        <div className="info">
          <p><span>Expense No:</span> {data?.expense_no}</p>
          <p><span>Date:</span> {data?.expense_date}</p>
          <p><span>Created By:</span> {data?.expense_by}</p>
          <p><span>Description:</span> {data?.expense_other}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Expense Type</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount (៛)</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((item, index) => (
              <tr key={index}>
                <td>{item.expense_type_name}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unit_price}</td>
                <td>{item.sub_total}</td>
              </tr>
            ))}

            <tr>
              <td colSpan="3"></td>
              <td><strong>Total:</strong></td>
              <td><strong>{totalAmount}</strong></td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <p>Generated on | www.chomnenhapp.com</p>
        </div>
      </div>

      <style>{`
        body {
          font-family: 'Khmer OS Battambang', Arial, sans-serif;
        }
        .receipt-container {
          max-width: 600px;
          background: #fff;
          margin: 0 auto;
          padding: 25px 30px;
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          margin-bottom: 25px;
        }
        .header h1 {
          margin: 0;
          font-weight: 700;
        }
        .info p {
          margin: 6px 0;
          font-size: 0.95rem;
        }
        .info span {
          font-weight: bold;
          min-width: 120px;
          display: inline-block;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        th, td {
          padding: 10px;
        }
        th {
          background-color: #f0f0f0;
          border-bottom: 2px solid #555;
        }
        .footer {
          text-align: center;
          font-size: 0.9rem;
          color: #777;
          border-top: 1px solid #ddd;
          padding-top: 15px;
        }
        .button-group {
          text-align: center;
          margin-bottom: 20px;
        }
        button {
          background-color: #333;
          color: white;
          padding: 10px 20px;
          margin: 0 10px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        @media print {
          .button-group {
            display: none;
          }
        }
      `}</style>
    </section>
  )
}

export default PrintExpanse
