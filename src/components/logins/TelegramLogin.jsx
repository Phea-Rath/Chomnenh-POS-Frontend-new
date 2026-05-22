import React, { useEffect, useRef } from "react";

const TELEGRAM_CALLBACK_NAME = "onTelegramAuth";

const TelegramLogin = ({ botUsername, onAuthSuccess }) => {
  const widgetRef = useRef(null);
  const authSuccessRef = useRef(onAuthSuccess);

  useEffect(() => {
    authSuccessRef.current = onAuthSuccess;
  }, [onAuthSuccess]);

  useEffect(() => {
    if (!widgetRef.current || !botUsername) return undefined;

    window[TELEGRAM_CALLBACK_NAME] = (user) => {
      authSuccessRef.current?.(user);
    };

    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", `${TELEGRAM_CALLBACK_NAME}(user)`);
    script.setAttribute("data-request-access", "write");
    widgetRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = "";
      }
      delete window[TELEGRAM_CALLBACK_NAME];
    };
  }, [botUsername]);

  return (
    <div
      ref={widgetRef}
      id="telegram-auth-button"
      style={{ minHeight: "40px", display: "flex", justifyContent: "center" }}
    />
  );
};

export default TelegramLogin;
