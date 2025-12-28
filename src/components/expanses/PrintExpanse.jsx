import React from 'react'

const PrintExpanse = () => {
  
  return (
    <section className='text-gray-800 h-[100vh]'>

      <div className="button-group">
        <button onClick={()=>window.print()}>🖨️ Print</button>
        <button onclick="copyURL()">🔗 Copy URL</button>
        <button onclick="downloadReceiptImage()">📷 Download</button>
      </div>

      <div className="receipt-container">
        <div className="header">
          <h1>Expense Receipt</h1>
          <p>Printed from Accounting System</p>
        </div>

        <div className="info">
          <p><span>Expense No:</span> </p>
          <p><span>Date:</span></p>
          <p><span>Created By:</span> </p>
          <p><span>Description:</span></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Expense Type</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount (៛)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="3"></td>
              <td><strong>Total:</strong></td>
              <td><strong>0.00</strong></td>
            </tr>
          </tbody>
        </table>

        <div className="footer">
          <p>Generated on| www.yoursystem.com</p>
        </div>
      </div>
      <style>{`
          body {
            font-family: 'Khmer OS Battambang', Arial, sans-serif;
            background: #f9f9f9;
            padding: 20px;
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
            color: #222;
          }
          .info {
            margin-bottom: 20px;
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
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: 700;
            border-bottom: 2px solid #555;
          }
          tbody tr:hover {
            background-color: #f9f9f9;
          }
          .totals {
            text-align: right;
            font-size: 1rem;
          }
          .totals p {
            margin: 5px 0;
            font-weight: bold;
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
            font-weight: bold;
          }
          section{
            background: transparent;
          }
          button:hover {
            background-color: #555;
          }
          @media print {
            .button-group {
              display: none;
            }
          }
        `}
      </style>
    </section>
  )
}

export default PrintExpanse