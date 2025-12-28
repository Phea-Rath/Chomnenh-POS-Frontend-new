import React from 'react';
import { Button, message } from 'antd';
import { TbShoppingCartPlus } from 'react-icons/tb';
const Information = ({label,onAction}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const info = () => {
    messageApi.info(label);
    onAction();
  };
  return (
    <>
      {contextHolder}
      <button className="btn btn-xs btn-primary text-lg md:text-xl" onClick={info}>
        <TbShoppingCartPlus />
      </button>
    </>
  );
};
export default Information;