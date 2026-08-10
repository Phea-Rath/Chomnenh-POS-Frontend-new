import { useTranslation } from "react-i18next";

/**
 * useViewText hook bridge connected to standard i18next dictionaries
 */
export function useViewText() {
  const { t, i18n } = useTranslation();
  const vt = (text) => t(text);
  return { vt, language: i18n.language };
}

export default useViewText;
