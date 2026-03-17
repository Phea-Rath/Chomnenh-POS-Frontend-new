import React, { useState } from 'react';
import api from '../../services/api';

const ABAPaymentComponent = () => {
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem('token');

    const handlePayment = async () => {
        // 1. ហៅទៅ Laravel ដើម្បីយក Hash
        const res = await api.post('/aba-checkout',
            { amount: '1.00' },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            }
        );
        const data = res.data;

        // 2. បង្កើត Form ដើម្បីកុហក Browser ឱ្យហោះទៅ ABA
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.api_url; // https://checkout-sandbox.payway.com.kh/... 

        const fields = {
            hash: data.hash,
            tran_id: data.tran_id,
            req_time: data.req_time,
            merchant_id: data.merchant_id,
            amount: data.amount,
            firstname: 'Sok',
            lastname: 'Dara',
            phone: '012345678',
            email: 'customer@email.com',
            payment_option: 'abapay', // ឬ 'cards'
        };

        Object.keys(fields).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    };

    return (
        <div className="payment-container">
            <h2>ជ្រើសរើសវិធីបង់ប្រាក់</h2>
            <button
                onClick={handlePayment}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#005a8d', // ពណ៌ ABA
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'កំពុងរៀបចំ...' : 'បង់ប្រាក់ជាមួយ ABA PayWay'}
            </button>
        </div>
    );
};

export default ABAPaymentComponent;