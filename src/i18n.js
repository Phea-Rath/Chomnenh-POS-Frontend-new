import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      profile: "Profile",
      logout: "Logout",
      dashboard: "Dashboard",
      home: "Home",
      settings: "Settings",
      notifications: "Notifications",
      // Dashboard
      revenue: "Revenue",
      purchases: "Purchases",
      expenses: "Expenses",
      netProfit: "Net Profit",
      profitAnalytics: "Profit Analytics",
      revenueTrends: "Revenue Trends",
      topSellingItems: "Top Selling Items",
      marketShare: "Market Share",
      purchaseInventory: "Purchase Inventory",
      recentStockIn: "Recent Stock In",
      expenseAnalysis: "Expense Analysis",
      majorExpenses: "Major Expenses",
    }
  },
  kh: {
    translation: {
      profile: "ប្រូហ្វាល",
      logout: "ចាកចេញ",
      dashboard: "ផ្ទាំងគ្រប់គ្រង",
      home: "ទំព័រដើម",
      settings: "ការកំណត់",
      notifications: "ការជូនដំណឹង",
      // Dashboard
      revenue: "ប្រាក់ចំណេញ",
      purchases: "ការទិញ",
      expenses: "ចំណាយ",
      netProfit: "ប្រាក់ចំណេញសុទ្ធ",
      profitAnalytics: "វិភាគប្រាក់ចំណេញ",
      revenueTrends: "ទំនោរប្រាក់ចំណេញ",
      topSellingItems: "ទំនិញលក់ដាច់បំផុត",
      marketShare: "ចំណែកទីផ្សារ",
      purchaseInventory: "ទិញសន្និធិ",
      recentStockIn: "ស្តុកចូលថ្មី",
      expenseAnalysis: "វិភាគចំណាយ",
      majorExpenses: "ចំណាយធំ",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
