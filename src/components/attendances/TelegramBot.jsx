import React, { useState } from "react";

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID?.trim();

const ACTION_LABELS = {
    check_in: "Check-in 1",
    check_out: "Check-out 1",
    check_in_2: "Check-in 2",
    check_out_2: "Check-out 2",
};

const escapeTelegramMarkdownV2 = (value = "") =>
    String(value)
        .replace(/([_\*\[\]\(\)~`>#+\-=|\{\}\.\!])/g, "\\$1");

const formatAttendanceDate = (value, timeZone = "Asia/Phnom_Penh") =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(value);

const formatAttendanceDay = (value, timeZone = "Asia/Phnom_Penh") =>
    new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
    }).format(value);

const formatAttendanceTime = (value, timeZone = "Asia/Phnom_Penh") =>
    new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(value);

export const buildAttendanceTelegramMessage = ({
    employeeName,
    actionKey,
    actionLabel,
    status = "UNKNOWN",
    timestamp = new Date(),
    timeZone = "Asia/Phnom_Penh",
}) => {
    const userName = escapeTelegramMarkdownV2(employeeName || "Unknown");
    const label = escapeTelegramMarkdownV2(actionLabel || ACTION_LABELS[actionKey] || actionKey || "Unknown");
    const statusText = escapeTelegramMarkdownV2(String(status).toUpperCase());

    return [
        "🔔 *Attendance Checked*",
        `📅 Date: ${formatAttendanceDate(timestamp, timeZone)}`,
        `🗓️ Day: ${escapeTelegramMarkdownV2(formatAttendanceDay(timestamp, timeZone))}`,
        `👤 Employee: ${userName}`,
        `📍 Action: ${label}`,
        `⏰ Time: ${escapeTelegramMarkdownV2(formatAttendanceTime(timestamp, timeZone))}`,
        `📊 Status: ${statusText}`,
    ].join("\n");
};

const resolveTelegramChatId = (value) =>
    String(value ?? "").trim();

export const getTelegramChatIdFromCompany = (company) =>
    resolveTelegramChatId(company?.chat_id ?? company?.chatId ?? company?.telegram_chat_id ?? company?.telegramChatId);

export const sendTelegramMessage = async (message, chatId = TELEGRAM_CHAT_ID) => {
    const resolvedChatId = resolveTelegramChatId(chatId);
    if (!TELEGRAM_BOT_TOKEN || !resolvedChatId) {
        throw new Error("Telegram bot token or chat ID is missing");
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: resolvedChatId,
            text: message,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Telegram request failed");
    }
};

const TelegramBot = () => {
    const [status, setStatus] = useState("");

    const handleSendMessage = async () => {
        try {
            setStatus("Sending...");
            await sendTelegramMessage(
                buildAttendanceTelegramMessage({
                    employeeName: "Rath",
                    actionLabel: "Check-out 1",
                }),
                TELEGRAM_CHAT_ID
            );
            setStatus("Message sent successfully.");
        } catch (error) {
            console.error(error);
            setStatus("Unable to send Telegram message.");
        }
    };

    return (
        <div className="mt-6 rounded-2xl border border-[#232e3c] bg-[#101922] p-4">
            <button
                onClick={handleSendMessage}
                className="w-full rounded-xl bg-[#24a1de] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
                Send Test Telegram Message
            </button>
            {status && <p className="mt-3 text-center text-xs text-[#8e959b]">{status}</p>}
        </div>
    );
};

export default TelegramBot;
