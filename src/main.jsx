import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { ToastContainer } from 'react-toastify'
import { store } from "../app/store";
import { Provider } from "react-redux";
import NotificationProvider from './utils/NotificationProvider.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <Provider store={store} >
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        containerStyle={{ zIndex: 2147483647 }}
      />
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </Provider>
  </>

)
