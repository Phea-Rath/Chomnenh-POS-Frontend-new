import { Alert } from 'antd'
import React from 'react'

const AlertMessage = ({show,message,status}) => {
  return (
    <section className={` absolute w-[calc(100%-40px)] transition-all duration-500 mx-5 ${show?'top-18 z-50 opacity-100':'top-16 -z-10 opacity-0'}`}>
      {status == "success"?<Alert message={message} type="success" showIcon />: ""}
      {status == "warning"?<Alert message={message} type="warning" showIcon closable /> : ""}
      {status == "error"?<Alert message={message} type="error" showIcon />:""}
    </section>
  )
}

export default AlertMessage