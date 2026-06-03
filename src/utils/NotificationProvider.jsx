import React, { createContext, useContext } from "react";
import { notification } from "antd";

const NotificationContext = createContext();

export const useNotify = () => {
    return useContext(NotificationContext);
};

const NotificationProvider = ({ children }) => {
    const [api, contextHolder] = notification.useNotification();

    const notify = {
        success: (title, description) => {
            api.success({
                message: title,
                description,
                placement: "topRight",
            });
        },

        error: (title, description) => {
            api.error({
                message: title,
                description,
                placement: "topRight",
            });
        },

        warning: (title, description) => {
            api.warning({
                message: title,
                description,
                placement: "topRight",
            });
        },

        info: (title, description) => {
            api.info({
                message: title,
                description,
                placement: "topRight",
            });
        },
    };

    return (
        <NotificationContext.Provider value={notify}>
            {contextHolder}
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;