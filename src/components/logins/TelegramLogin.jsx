import React, { useEffect, useRef } from 'react';

const TelegramLogin = ({ botUsername, onAuthSuccess }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    // 1. Create a globally scoped callback function that Telegram's script will call
    window.onTelegramAuth = (user) => {
      onAuthSuccess(user);
    };

    // 2. Programmatically configure the official Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large'); // small, medium, large
    script.setAttribute('data-radius', '8');     // corner roundness pixel depth
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write'); // allows your bot to message them
    script.async = true;

    // 3. Render the script cleanly inside our designated DOM container node
    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
    }

    // 4. Memory cleanup: strip elements and properties when user leaves the route
    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
      delete window.onTelegramAuth;
    };
  }, [botUsername, onAuthSuccess]);

  return (
    <div 
      ref={widgetRef} 
      id="telegram-auth-button" 
      style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }} 
    />
  );
};

export default TelegramLogin;