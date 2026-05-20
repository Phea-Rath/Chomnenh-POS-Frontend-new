// id="zkn2zt"
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

function timeAgo(date) {
    const {t} = useTranslation();
    const target = dayjs(date).startOf("day");
    const today = dayjs().startOf("day");

    const years = today.diff(target, "year");

    if (years > 0) {
        return `${years} year${years > 1 ? "s" : ""} ${t("ago")}`;
    }

    const months = today.diff(target, "month");

    if (months > 0) {
        return `${months} ${t("month")}${months > 1 && t("month") == "month" ? "s" : ""} ${t("ago")}`;
    }

    const days = today.diff(target, "day");

    if (days > 0) {
        return `${days} ${t("day")}${days > 1 && t("day") == "day" ? "s" : ""} ${t("ago")}`;
    }

    if (days < 0) {
        const futureDays = Math.abs(days);
        return `${t("in")} ${futureDays} ${t("day")}${futureDays > 1 && t("day") == "day" ? "s" : ""}`;
    }

    return t("today");
}

export default timeAgo;