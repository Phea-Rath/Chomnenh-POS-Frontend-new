import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
    BiCameraOff,
    BiCheckCircle,
    BiLogIn,
    BiLogOut,
    BiRefresh,
    BiUserCheck,
} from "react-icons/bi";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

const firebaseConfig = {
    apiKey: "AIzaSyA-auJnr3_rXmJr468jpbwF506nF9Xa0Ho",
    authDomain: "attendance-78fb1.firebaseapp.com",
    projectId: "attendance-78fb1",
    storageBucket: "attendance-78fb1.firebasestorage.app",
    messagingSenderId: "311096491117",
    appId: "1:311096491117:web:03df53ac7afb77cfb75364",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";
const CHECK_OUT_DELAY_MINUTES = 15;
const CHECK_IN_EARLY_MINUTES = 15;
const ACTIONS = [
    { key: "check_in", label: "Check In" },
    { key: "check_out", label: "Check Out" },
    { key: "check_in_2", label: "Check In 2" },
    { key: "check_out_2", label: "Check Out 2" },
];

const getDayName = (date, timeZone = DEFAULT_TIMEZONE) =>
    new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "long",
    }).format(date);

const getTimeParts = (date, timeZone = DEFAULT_TIMEZONE) => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
    const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);

    return {
        hour,
        minute,
        totalMinutes: hour * 60 + minute,
    };
};

const toDate = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    return null;
};

const formatDateTime = (value, timeZone = DEFAULT_TIMEZONE) => {
    const date = toDate(value);

    if (!date) {
        return "--";
    }

    return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

const getScheduleWindow = (schedule, timeZone = DEFAULT_TIMEZONE) => {
    const startDate = toDate(schedule?.start_time);
    const endDate = toDate(schedule?.end_time);

    if (!startDate || !endDate) {
        return null;
    }

    return {
        start: getTimeParts(startDate, timeZone).totalMinutes,
        end: getTimeParts(endDate, timeZone).totalMinutes,
    };
};

const getCameraErrorMessage = (error) => {
    const message = String(error?.message || error || "").toLowerCase();

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
        return "Camera needs HTTPS or localhost";
    }

    if (message.includes("permission") || message.includes("notallowed")) {
        return "Camera permission was denied";
    }

    if (message.includes("notfound") || message.includes("requested device not found")) {
        return "No usable camera was found on this device";
    }

    if (message.includes("notreadable") || message.includes("trackstart")) {
        return "Camera is being used by another app or browser tab";
    }

    return "Unable to start the camera on this device";
};

const normalizeId = (value) => String(value ?? "").trim();

const parseQrPayload = (decodedText) => {
    const normalized = normalizeId(decodedText);
    const fallbackPayload = {
        rawValue: normalized,
        companyId: "",
        employeeIdentifiers: normalized ? [normalized] : [],
    };

    if (!normalized) {
        return fallbackPayload;
    }

    const collectObjectPayload = (value) => {
        const companyId = normalizeId(
            value?.company_id ??
            value?.companyId ??
            value?.company ??
            value?.profile_id ??
            value?.profileId
        );
        const employeeIdentifiers = [
            value?.user_id,
            value?.userId,
            value?.uid,
            value?.id,
            value?.token,
            value?.phone,
            value?.email,
            value?.code,
        ]
            .map((item) => normalizeId(item))
            .filter(Boolean);

        return {
            rawValue: normalized,
            companyId,
            employeeIdentifiers: employeeIdentifiers.length
                ? employeeIdentifiers
                : fallbackPayload.employeeIdentifiers,
        };
    };

    try {
        return collectObjectPayload(JSON.parse(normalized));
    } catch {
        // Fall back to URL/query parsing for QR payloads encoded as links.
    }

    try {
        const url = normalized.startsWith("http://") || normalized.startsWith("https://")
            ? new URL(normalized)
            : new URL(`https://attendance.local/?${normalized.replace(/^\?/, "")}`);
        const params = url.searchParams;

        if ([...params.keys()].length) {
            return collectObjectPayload({
                company_id: params.get("company_id") || params.get("companyId") || params.get("profile_id"),
                employee_id:
                    params.get("employee_id") ||
                    params.get("employeeId") ||
                    params.get("user_id") ||
                    params.get("userId") ||
                    params.get("uid") ||
                    params.get("id"),
                token: params.get("token"),
                phone: params.get("phone"),
                email: params.get("email"),
                code: params.get("code"),
            });
        }
    } catch {
        // Keep supporting legacy QR codes that are just a single token/string.
    }

    return fallbackPayload;
};

const CHECK_IN_WINDOW_MINUTES = 60; // Flutter uses 60 mins early/late

// Helper to get total minutes from a JS Date
const getMinutesOfDay = (date, timeZone = DEFAULT_TIMEZONE) => {
    const parts = getTimeParts(date, timeZone);
    return parts.totalMinutes;
};

const resolveAttendanceActionStates = (attendanceDoc, scanState, timeZone = DEFAULT_TIMEZONE) => {
    const nowMinutes = getMinutesOfDay(new Date(), timeZone);
    const checkInTime = toDate(attendanceDoc?.check_in_time);
    const checkOutTime = toDate(attendanceDoc?.check_out_time);
    const checkInTime2 = toDate(attendanceDoc?.check_in_time_2);
    const checkOutTime2 = toDate(attendanceDoc?.check_out_time_2);
    const makeState = (enabled, reason = "") => ({ enabled, reason });
    const resolveShiftState = (schedule, type) => {
        if (!schedule) {
            return makeState(false, "Shift schedule not configured");
        }

        const scheduleWindow = getScheduleWindow(schedule, timeZone);
        if (!scheduleWindow) {
            return makeState(false, "Schedule time not found");
        }

        const startMin = scheduleWindow.start;
        const endMin = scheduleWindow.end;

        if (type === "in") {
            return nowMinutes >= startMin - CHECK_IN_WINDOW_MINUTES &&
                nowMinutes <= endMin + CHECK_IN_WINDOW_MINUTES
                ? makeState(true)
                : makeState(false, `Too early/late. Shift starts ${formatDateTime(schedule.start_time, timeZone)}`);
        }

        return nowMinutes >= startMin
            ? makeState(true)
            : makeState(false, "Cannot check out before shift starts");
    };

    return {
        check_in: checkInTime
            ? makeState(false, "Already checked in (1)")
            : resolveShiftState(scanState?.primarySchedule, "in"),
        check_out: !checkInTime
            ? makeState(false, "Must check-in first")
            : checkOutTime
                ? makeState(false, "Already checked out (1)")
                : resolveShiftState(scanState?.primarySchedule, "out"),
        check_in_2: scanState?.section !== "2"
            ? makeState(false, "Section 2 is not assigned")
            : checkInTime2
                ? makeState(false, "Already checked in (2)")
                : resolveShiftState(scanState?.secondarySchedule, "in"),
        check_out_2: scanState?.section !== "2"
            ? makeState(false, "Section 2 is not assigned")
            : !checkInTime2
                ? makeState(false, "Must check-in 2 first")
                : checkOutTime2
                    ? makeState(false, "Already checked out (2)")
                    : resolveShiftState(scanState?.secondarySchedule, "out"),
    };
};

const ScanAttendance = () => {
    const { t } = useTranslation();

    const [authUser, setAuthUser] = useState(null);
    const [loginForm, setLoginForm] = useState({
        identifier: "",
        password: "",
    });
    const [loginLoading, setLoginLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [scanState, setScanState] = useState(null);
    const [lastScan, setLastScan] = useState(null);

    const html5QrCodeRef = useRef(null);
    const isMountedRef = useRef(true);
    const isStartingRef = useRef(false);
    const isProcessingScanRef = useRef(false);
    const scannerId = "reader";

    const scannerConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
    };

    const waitForScannerContainer = () =>
        new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
            });
        });

    const getScannerInstance = () => {
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(scannerId);
        }

        return html5QrCodeRef.current;
    };

    const stopScanner = async () => {
        const scanner = html5QrCodeRef.current;

        if (!scanner) {
            if (isMountedRef.current) {
                setIsScanning(false);
                setIsStarting(false);
            }
            return;
        }

        try {
            const state = scanner.getState();

            if (
                state === Html5QrcodeScannerState.SCANNING ||
                state === Html5QrcodeScannerState.PAUSED
            ) {
                await scanner.stop();
            }
        } catch (error) {
            console.error("Stop error:", error);
        } finally {
            try {
                scanner.clear();
            } catch (clearError) {
                console.error("Clear error:", clearError);
            }

            if (html5QrCodeRef.current === scanner) {
                html5QrCodeRef.current = null;
            }

            isStartingRef.current = false;
            if (isMountedRef.current) {
                setIsScanning(false);
                setIsStarting(false);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!isMountedRef.current) {
                return;
            }

            setAuthUser(user);
            setIsProcessingScan(false);
            isProcessingScanRef.current = false;
            setScanState(null);
            setLastScan(null);

        });

        return () => {
            isMountedRef.current = false;
            unsubscribe();
            void stopScanner();
        };
    }, []);

    const resolveEmailFromIdentifier = async (identifier) => {
        if (identifier.includes("@")) {
            return identifier;
        }

        const phoneSnapshot = await getDocs(
            query(collection(db, "users"), where("phone", "==", identifier), limit(1))
        );
        const phoneUser = phoneSnapshot.docs[0]?.data();

        if (!phoneUser?.email) {
            throw new Error("No email found for this phone number");
        }

        return phoneUser.email;
    };

    const handleLogin = async (event) => {
        event.preventDefault();

        const identifier = loginForm.identifier.trim();
        const password = loginForm.password;

        if (!identifier || !password) {
            toast.error("Please enter phone or email and password");
            return;
        }

        setLoginLoading(true);

        try {
            const email = await resolveEmailFromIdentifier(identifier);
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login successful");
        } catch (error) {
            console.error("Login error:", error);
            toast.error(
                error?.message?.includes("No email found")
                    ? "Phone login needs a user record with email saved"
                    : "Login failed. Please check your credentials"
            );
        } finally {
            if (isMountedRef.current) {
                setLoginLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setIsProcessingScan(false);
            isProcessingScanRef.current = false;
            setScanState(null);
            setLastScan(null);
            void stopScanner();
            toast.success("Logged out");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to log out");
        }
    };

    const resolveScanPayload = async (decodedText) => {
        const normalized = normalizeId(decodedText);

        if (!normalized) {
            throw new Error("Scanned code is empty");
        }

        const qrPayload = parseQrPayload(normalized);
        const scannedCompanyId = normalizeId(qrPayload.companyId || normalized);

        if (!authUser?.uid) {
            throw new Error("User not logged in");
        }

        if (!scannedCompanyId) {
            throw new Error("QR company id not found");
        }

        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        const userData = userDoc.data();

        if (!userData) {
            throw new Error("Current user data not found");
        }

        const requestSnapshot = await getDocs(
            query(
                collection(db, "requests"),
                where("user_id", "==", authUser.uid),
                where("company_id", "==", scannedCompanyId),
                where("status", "==", "approved"),
                limit(1)
            )
        );

        if (requestSnapshot.empty && normalizeId(userData.company_id) !== scannedCompanyId) {
            throw new Error("You are not authorized for this company. Please join first.");
        }

        const companyDoc = await getDoc(doc(db, "companies", scannedCompanyId));
        const company = companyDoc.data();

        if (!company) {
            throw new Error("Company data not found");
        }

        const timeZone = company.timezone || DEFAULT_TIMEZONE;
        const now = new Date();
        const dayName = getDayName(now, timeZone);
        const scheduleDetailSnapshot = await getDocs(
            query(
                collection(db, "schedule_details"),
                where("user_id", "==", authUser.uid),
                where("company_id", "==", scannedCompanyId),
                where("day_name", "==", dayName),
                limit(1)
            )
        );
        const scheduleDetail = scheduleDetailSnapshot.docs[0]?.data();

        if (!scheduleDetail) {
            throw new Error(`No schedule assigned for today (${dayName})`);
        }

        const section = String(scheduleDetail.section || "1");
        const primaryScheduleId = scheduleDetail.section_one || null;
        const secondaryScheduleId = section === "2" ? (scheduleDetail.section_two || null) : null;

        if (!primaryScheduleId && !secondaryScheduleId) {
            throw new Error("Shift schedule not configured");
        }

        const primaryScheduleDoc = primaryScheduleId
            ? await getDoc(doc(db, "schedules", primaryScheduleId))
            : null;
        const secondaryScheduleDoc = secondaryScheduleId
            ? await getDoc(doc(db, "schedules", secondaryScheduleId))
            : null;
        const primarySchedule = primaryScheduleDoc?.data() || null;
        const secondarySchedule = secondaryScheduleDoc?.data() || null;

        if (!primarySchedule && !secondarySchedule) {
            throw new Error("Schedule details not found");
        }

        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);
        const attendanceSnapshot = await getDocs(
            query(
                collection(db, "attendances"),
                where("created_by", "==", authUser.uid),
                where("company_id", "==", scannedCompanyId),
                where("created_at", ">=", Timestamp.fromDate(startOfDay)),
                where("created_at", "<", Timestamp.fromDate(endOfDay)),
                limit(1)
            )
        );
        const todayAttendanceDoc = attendanceSnapshot.docs[0];
        const attendance = todayAttendanceDoc
            ? { id: todayAttendanceDoc.id, ref: todayAttendanceDoc.ref, ...todayAttendanceDoc.data() }
            : null;

        const scanState = {
            scannedValue: normalized,
            scannedCompanyId,
            companyId: scannedCompanyId,
            company,
            employee: {
                id: authUser.uid,
                ...userData,
            },
            employeeUid: authUser.uid,
            userName: userData.name || userData.email || authUser.email || "Unknown User",
            timeZone,
            dayName,
            section,
            scheduleDetail,
            primaryScheduleId,
            secondaryScheduleId,
            primarySchedule,
            secondarySchedule,
            scheduleId: primaryScheduleId || secondaryScheduleId || "",
            schedule: primarySchedule || secondarySchedule || null,
            attendance,
            attendanceRef: todayAttendanceDoc?.ref || null,
        };

        return {
            ...scanState,
            actionStates: resolveAttendanceActionStates(attendance, scanState, timeZone),
        };
    };

    const handleScanSuccess = async (decodedText) => {
        if (isProcessingScanRef.current) {
            return;
        }

        isProcessingScanRef.current = true;
        if (isMountedRef.current) {
            setIsProcessingScan(true);
        }

        try {
            const payload = await resolveScanPayload(decodedText);
            setScanState(payload);
            setLastScan(decodedText);
            toast.success(`Scanned ${payload.employee.name || payload.employee.phone}`);
            await stopScanner();
        } catch (error) {
            console.error("Resolve scan error:", error);
            toast.error(error?.message || "Failed to resolve scanned user");
        } finally {
            isProcessingScanRef.current = false;
            if (isMountedRef.current) {
                setIsProcessingScan(false);
            }
        }
    };

    const startWithCamera = async (scanner, cameraConfig) => {
        await scanner.start(
            cameraConfig,
            scannerConfig,
            (decodedText) => {
                if (isProcessingScanRef.current) {
                    return;
                }
                void handleScanSuccess(decodedText);
            },
            () => { }
        );
    };

    const startScanner = async () => {
        if (!authUser?.uid) {
            toast.error("Please log in first");
            return;
        }

        if (isStartingRef.current || isScanning || isProcessingScanRef.current) {
            return;
        }

        try {
            isStartingRef.current = true;
            setIsStarting(true);
            setIsProcessingScan(false);
            isProcessingScanRef.current = false;
            setScanState(null);
            setLastScan(null);
            await waitForScannerContainer();
            await stopScanner();

            if (!window.isSecureContext && window.location.hostname !== "localhost") {
                throw new Error("Camera requires secure context");
            }

            const scanner = getScannerInstance();
            setIsScanning(true);

            try {
                await startWithCamera(scanner, { facingMode: { exact: "environment" } });
                return;
            } catch (environmentError) {
                try {
                    await startWithCamera(scanner, { facingMode: "environment" });
                    return;
                } catch {
                    const devices = await Html5Qrcode.getCameras();

                    if (!devices?.length) {
                        throw environmentError;
                    }

                    const preferredCamera = devices.find((device) =>
                        /back|rear|environment/i.test(device.label)
                    );

                    await startWithCamera(scanner, preferredCamera?.id || devices[0].id);
                }
            }
        } catch (error) {
            console.error("Start error:", error);
            toast.error(getCameraErrorMessage(error));
            await stopScanner();
        } finally {
            isStartingRef.current = false;
            if (isMountedRef.current) {
                setIsStarting(false);
            }
        }
    };

    const refreshCurrentScan = async () => {
        if (!scanState?.scannedValue) {
            return;
        }

        try {
            const payload = await resolveScanPayload(scanState.scannedValue);
            setScanState(payload);
        } catch (error) {
            console.error("Refresh scan error:", error);
            toast.error(error?.message || "Failed to refresh attendance");
        }
    };

    const submitAttendanceAction = async (actionKey) => {
        if (!scanState) return;

        const actionState = scanState.actionStates?.[actionKey];
        if (!actionState?.enabled) {
            toast.error(actionState?.reason || "Action not allowed");
            return;
        }

        if (scanState.attendance) {
            const lastUpdate = toDate(scanState.attendance.updated_at || scanState.attendance.created_at);
            const diffSeconds = lastUpdate
                ? (new Date().getTime() - lastUpdate.getTime()) / 1000
                : Number.POSITIVE_INFINITY;
            if (diffSeconds < 15) {
                toast.error("Please wait 15 seconds before scanning again");
                return;
            }
        }

        setActionLoading(actionKey);

        try {
            const timestamp = serverTimestamp();
            const fieldMap = {
                check_in: "check_in_time",
                check_out: "check_out_time",
                check_in_2: "check_in_time_2",
                check_out_2: "check_out_time_2",
            };
            const targetScheduleId = actionKey === "check_in" || actionKey === "check_out"
                ? scanState.primaryScheduleId
                : scanState.secondaryScheduleId;

            if (scanState.attendanceRef) {
                await updateDoc(scanState.attendanceRef, {
                    [fieldMap[actionKey]]: timestamp,
                    updated_at: timestamp,
                });
            } else {
                if (!actionKey.startsWith("check_in")) {
                    toast.error("Please check-in first");
                    return;
                }

                await addDoc(collection(db, "attendances"), {
                    company_id: scanState.companyId,
                    schedule_id: targetScheduleId,
                    user_name: scanState.userName,
                    status: "present",
                    check_in_time: actionKey === "check_in" ? timestamp : null,
                    check_in_time_2: actionKey === "check_in_2" ? timestamp : null,
                    created_by: scanState.employeeUid,
                    created_at: timestamp,
                    updated_at: timestamp,
                });
            }

            toast.success("Attendance Updated Successfully");
            await refreshCurrentScan();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save attendance");
        } finally {
            setActionLoading("");
        }
    };

    return (
        <div className="mx-auto max-w-3xl p-4">
            <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <BiUserCheck className="text-2xl text-green-600" />
                    {t("scanAttendance", "Scan Attendance")}
                </h2>

                {!authUser ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Phone or Email
                            </label>
                            <input
                                value={loginForm.identifier}
                                onChange={(event) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        identifier: event.target.value,
                                    }))
                                }
                                placeholder="Phone or email"
                                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(event) =>
                                    setLoginForm((prev) => ({
                                        ...prev,
                                        password: event.target.value,
                                    }))
                                }
                                placeholder="Password"
                                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <BiLogIn size={22} />
                            {loginLoading ? "Signing in..." : "Login"}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                            <div>
                                <p className="text-sm text-gray-500">Current user</p>
                                <p className="font-semibold">{authUser.email || authUser.uid}</p>
                                <p className="text-sm text-gray-500">
                                    Firebase UID: {authUser.uid}
                                </p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-xl border px-4 py-2 font-medium text-gray-700"
                            >
                                <BiLogOut size={20} />
                                Logout
                            </button>
                        </div>

                        <button
                            onClick={isScanning ? () => void stopScanner() : startScanner}
                            disabled={isStarting || isProcessingScan}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all ${isScanning ? "bg-red-500" : "bg-blue-600"} ${(isStarting || isProcessingScan) ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                            {isScanning ? <BiCameraOff size={24} /> : <BiUserCheck size={24} />}
                            {isStarting
                                ? "Opening camera..."
                                : isProcessingScan
                                    ? "Processing scan..."
                                : isScanning
                                    ? t("stopScanning", "Stop Scanning")
                                    : t("scanAttendance", "Scan Attendance")}
                        </button>
                    </div>
                )}
            </div>

            {authUser && (
                <div
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all ${isScanning ? "mb-6 aspect-square border-blue-500 bg-black" : "h-0 border-0 opacity-0"}`}
                >
                    <div id={scannerId} className="h-full w-full"></div>

                    {isScanning && (
                        <div className="absolute top-0 w-full animate-pulse bg-blue-600 p-2 text-xs text-white">
                            {isProcessingScan
                                ? t("processingAttendance", "Processing attendance...")
                                : t("scanningAttendance", "Scanning attendance...")}
                        </div>
                    )}

                    {isProcessingScan && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                            <div className="rounded-2xl bg-white/10 px-6 py-4 text-center text-white backdrop-blur">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                <p className="text-sm font-semibold">Processing scan...</p>
                                <p className="mt-1 text-xs text-white/80">Please hold still and wait</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {scanState && (
                <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Scanned employee</p>
                            <h3 className="text-lg font-bold text-gray-900">
                                {scanState.userName}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {scanState.employee.phone || "--"} | {scanState.employee.email || authUser?.email || "--"}
                            </p>
                            <p className="text-sm text-gray-600">
                                Company: {scanState.company.company_name || scanState.companyId}
                            </p>
                            <p className="text-sm text-gray-600">
                                Day: {scanState.dayName} | Section: {scanState.scheduleDetail.section || "--"}
                            </p>
                        </div>

                        <button
                            onClick={refreshCurrentScan}
                            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            <BiRefresh size={18} />
                            Refresh
                        </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {ACTIONS.map((action) => {
                            const state = scanState.actionStates?.[action.key];
                            const isBusy = actionLoading === action.key;

                            return (
                                <button
                                    key={action.key}
                                    onClick={() => void submitAttendanceAction(action.key)}
                                    disabled={!state?.enabled || !!actionLoading}
                                    className={`rounded-xl border px-4 py-3 text-left transition-all ${state?.enabled ? "border-green-500 bg-green-50 text-green-700" : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"}`}
                                >
                                    <div className="font-semibold">
                                        {isBusy ? "Saving..." : action.label}
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {state?.enabled ? "Available now" : state?.reason || "Not available"}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-gray-700 md:grid-cols-2">
                        <div>
                            <p className="font-semibold">Schedule</p>
                            <p>Shift 1 Start: {formatDateTime(scanState.primarySchedule?.start_time, scanState.timeZone)}</p>
                            <p>Shift 1 End: {formatDateTime(scanState.primarySchedule?.end_time, scanState.timeZone)}</p>
                            <p>Shift 2 Start: {formatDateTime(scanState.secondarySchedule?.start_time, scanState.timeZone)}</p>
                            <p>Shift 2 End: {formatDateTime(scanState.secondarySchedule?.end_time, scanState.timeZone)}</p>
                            <p>Timezone: {scanState.timeZone}</p>
                        </div>

                        <div>
                            <p className="font-semibold">Today Attendance</p>
                            <p>Check in: {formatDateTime(scanState.attendance?.check_in_time, scanState.timeZone)}</p>
                            <p>Check out: {formatDateTime(scanState.attendance?.check_out_time, scanState.timeZone)}</p>
                            <p>Check in 2: {formatDateTime(scanState.attendance?.check_in_time_2, scanState.timeZone)}</p>
                            <p>Check out 2: {formatDateTime(scanState.attendance?.check_out_time_2, scanState.timeZone)}</p>
                        </div>
                    </div>
                </div>
            )}

            {lastScan && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border bg-green-100 p-4">
                    <BiCheckCircle className="text-2xl text-green-600" />
                    <div>
                        <p className="text-xs font-bold">{t("successfully", "Successfully")}</p>
                        <p className="font-mono text-sm font-bold">{lastScan}</p>
                    </div>
                </div>
            )}

            {!authUser && (
                <div className="py-12 text-center text-gray-400">
                    <BiUserCheck size={64} className="mx-auto mb-4 opacity-20" />
                    <p>Login with phone or email and password to start attendance scanning.</p>
                </div>
            )}
        </div>
    );
};

export default ScanAttendance;
