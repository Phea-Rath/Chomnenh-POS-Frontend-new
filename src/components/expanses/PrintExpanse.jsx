import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router';
import { useGetExpanseTypeByIdQuery } from '../../../app/Features/expanseTypesSlice';

const PrintExpanse = () => {
  const [data, setData] = useState({
    expanse_no,
    expanse_date,
    expanse_by,
    expanse_other,
    amount,
    items: []
  });
  const { id } = useParams();
  const token = localStorage.getItem('token');
  const { data: expenseData } = useGetExpanseTypeByIdQuery({ id, token });
  if (!data) return null


  useEffect(() => {
    setData(expenseData?.data?.data);
  }, [expenseData])
  const totalAmount = items.reduce(
    (sum, item) => sum + Number(item.sub_total || 0),
    0
  )

  const copyURL = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('URL copied!')
  }

  return (
    <section className="text-gray-800 h-[100vh]">

      <div className="button-group">
        <button onClick={() => window.print()}>🖨️ Print</button>
        <button onClick={copyURL}>🔗 Copy URL</button>
      </div>

      <div className="receipt-container">
        <div className="header">
          <h1>Expense Receipt</h1>
          <p>Printed from Accounting System</p>
        </div>

        <div className="info">
          <p><span>Expense No:</span> {expanse_no}</p>
          <p><span>Date:</span> {expanse_date}</p>
          <p><span>Created By:</span> {expanse_by}</p>
          <p><span>Description:</span> {expanse_other}</p>
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
            {items?.map((item, index) => (
              <tr key={index}>
                <td>{item.expanse_type_name}</td>
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
          <p>Generated on | www.yoursystem.com</p>
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
