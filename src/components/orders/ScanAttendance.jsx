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
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
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

const formatDateKey = (date, timeZone = DEFAULT_TIMEZONE) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);

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
            value?.employee_id,
            value?.employeeId,
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

const resolveAttendanceActionStates = (attendanceDoc, schedule, timeZone = DEFAULT_TIMEZONE) => {
    const nowMinutes = getTimeParts(new Date(), timeZone).totalMinutes;
    const scheduleWindow = getScheduleWindow(schedule, timeZone);
    const checkInTime = toDate(attendanceDoc?.check_in_time);
    const checkOutTime = toDate(attendanceDoc?.check_out_time);
    const checkInTime2 = toDate(attendanceDoc?.check_in_time_2);
    const checkOutTime2 = toDate(attendanceDoc?.check_out_time_2);
    const checkInMinutes = checkInTime ? getTimeParts(checkInTime, timeZone).totalMinutes : null;
    const checkIn2Minutes = checkInTime2 ? getTimeParts(checkInTime2, timeZone).totalMinutes : null;
    const shiftOpens = scheduleWindow ? scheduleWindow.start - CHECK_IN_EARLY_MINUTES : null;
    const shiftEnds = scheduleWindow ? scheduleWindow.end : null;
    const isWithinShift = scheduleWindow
        ? nowMinutes >= shiftOpens && nowMinutes <= shiftEnds
        : false;

    const makeState = (enabled, reason = "") => ({ enabled, reason });

    return {
        check_in: checkInTime
            ? makeState(false, "Already checked in")
            : isWithinShift
                ? makeState(true)
                : makeState(false, "Check in opens 15 minutes before the shift"),
        check_out: !checkInTime
            ? makeState(false, "Check in first")
            : checkOutTime
                ? makeState(false, "Already checked out")
                : nowMinutes >= (checkInMinutes ?? 0) + CHECK_OUT_DELAY_MINUTES
                    ? makeState(true)
                    : makeState(false, "Check out becomes available 15 minutes after check in"),
        check_in_2: !checkOutTime
            ? makeState(false, "Complete check out first")
            : checkInTime2
                ? makeState(false, "Second check in already recorded")
                : scheduleWindow && nowMinutes <= shiftEnds
                    ? makeState(true)
                    : makeState(false, "Shift already ended"),
        check_out_2: !checkInTime2
            ? makeState(false, "Complete second check in first")
            : checkOutTime2
                ? makeState(false, "Second check out already recorded")
                : nowMinutes >= (checkIn2Minutes ?? 0) + CHECK_OUT_DELAY_MINUTES
                    ? makeState(true)
                    : makeState(false, "Check out 2 becomes available 15 minutes after check in 2"),
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
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [scanState, setScanState] = useState(null);
    const [lastScan, setLastScan] = useState(null);

    const html5QrCodeRef = useRef(null);
    const isMountedRef = useRef(true);
    const isStartingRef = useRef(false);
    const scannerId = "reader";
    const currentCompanyId = normalizeId(authUser?.uid);

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

    const loadManagedUsers = async (uid) => {
        if (!uid) {
            setEmployees([]);
            return;
        }

        setLoadingEmployees(true);

        try {
            const snapshot = await getDocs(
                query(collection(db, "users"), where("created_by", "==", uid))
            );
            const rows = snapshot.docs.map((docItem) => ({
                id: docItem.id,
                ...docItem.data(),
            }));

            if (isMountedRef.current) {
                setEmployees(rows);
            }
        } catch (error) {
            console.error("Load users error:", error);
            toast.error("Failed to load users collection");
        } finally {
            if (isMountedRef.current) {
                setLoadingEmployees(false);
            }
        }
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
            setScanState(null);
            setLastScan(null);

            if (user?.uid) {
                await loadManagedUsers(user.uid);
            } else {
                setEmployees([]);
            }
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
        const scannedCompanyId = normalizeId(qrPayload.companyId);

        if (scannedCompanyId && currentCompanyId && scannedCompanyId !== currentCompanyId) {
            throw new Error("This QR code belongs to another company");
        }

        const employee = employees.find((row) =>
            qrPayload.employeeIdentifiers.some((identifier) =>
                [row.id, row.token, row.phone, row.email, row.created_by].some(
                    (value) => normalizeId(value) === normalizeId(identifier)
                )
            )
        );

        if (!employee) {
            throw new Error("Scanned user is not in your users collection");
        }

        if (currentCompanyId && normalizeId(employee.created_by) !== currentCompanyId) {
            throw new Error("Scanned user does not belong to the current logged in company");
        }

        const employeeUid = employee.token || employee.id;
        const dayName = getDayName(new Date(), DEFAULT_TIMEZONE);
        const scheduleDetailSnapshot = await getDocs(
            query(
                collection(db, "schedule_details"),
                where("user_id", "==", employeeUid),
                where("day_name", "==", dayName),
                limit(10)
            )
        );
        const scheduleDetailDoc = scheduleDetailSnapshot.docs[0];
        const scheduleDetail = scheduleDetailDoc?.data();

        if (!scheduleDetail) {
            throw new Error(`No schedule detail found for ${dayName}`);
        }

        const scheduleId = scheduleDetail.section === "2"
            ? scheduleDetail.section_two || scheduleDetail.section_one
            : scheduleDetail.section_one || scheduleDetail.section_two;

        if (!scheduleId) {
            throw new Error("No schedule linked to this user section");
        }

        const scheduleSnapshot = await getDocs(
            query(collection(db, "schedules"), where("__name__", "==", scheduleId), limit(1))
        );
        const scheduleDoc = scheduleSnapshot.docs[0];
        const schedule = scheduleDoc?.data();

        if (!schedule) {
            throw new Error("Schedule document not found");
        }

        const companyId = scheduleDetail.company_id || schedule.company_id;

        if (!companyId) {
            throw new Error("No company linked to this user schedule");
        }

        if (scannedCompanyId && normalizeId(companyId) !== scannedCompanyId) {
            throw new Error("QR company id does not match the employee company");
        }

        const companySnapshot = await getDocs(
            query(collection(db, "companies"), where("__name__", "==", companyId), limit(1))
        );
        const companyDoc = companySnapshot.docs[0];
        const company = companyDoc?.data();

        if (!company) {
            throw new Error("Company document not found");
        }

        const timeZone = company.timezone || DEFAULT_TIMEZONE;
        const todayKey = formatDateKey(new Date(), timeZone);
        const attendanceSnapshot = await getDocs(
            query(
                collection(db, "attendances"),
                where("created_by", "==", employeeUid),
                where("company_id", "==", companyId)
            )
        );
        const todayAttendanceDoc = attendanceSnapshot.docs.find((docItem) => {
            const createdAt = docItem.data()?.created_at;
            return formatDateKey(toDate(createdAt) || new Date(0), timeZone) === todayKey;
        });
        const attendance = todayAttendanceDoc
            ? { id: todayAttendanceDoc.id, ref: todayAttendanceDoc.ref, ...todayAttendanceDoc.data() }
            : null;

        return {
            scannedValue: normalized,
            employee,
            employeeUid,
            scheduleId,
            schedule,
            scheduleDetail,
            scannedCompanyId,
            companyId,
            company,
            timeZone,
            attendance,
            attendanceRef: todayAttendanceDoc?.ref || null,
            actionStates: resolveAttendanceActionStates(attendance, schedule, timeZone),
            dayName,
        };
    };

    const handleScanSuccess = async (decodedText) => {
        try {
            const payload = await resolveScanPayload(decodedText);
            setScanState(payload);
            setLastScan(decodedText);
            toast.success(`Scanned ${payload.employee.name || payload.employee.phone}`);
            await stopScanner();
        } catch (error) {
            console.error("Resolve scan error:", error);
            toast.error(error?.message || "Failed to resolve scanned user");
        }
    };

    const startWithCamera = async (scanner, cameraConfig) => {
        await scanner.start(
            cameraConfig,
            scannerConfig,
            (decodedText) => {
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

        if (!employees.length) {
            toast.error("No users found in your users collection");
            return;
        }

        if (isStartingRef.current || isScanning) {
            return;
        }

        try {
            isStartingRef.current = true;
            setIsStarting(true);
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
        if (!scanState) {
            return;
        }

        const actionState = scanState.actionStates?.[actionKey];
        if (!actionState?.enabled) {
            toast.error(actionState?.reason || "This action is not available");
            return;
        }

        setActionLoading(actionKey);

        try {
            const payload = {
                updated_at: serverTimestamp(),
            };

            if (actionKey === "check_in") {
                payload.check_in_time = serverTimestamp();
            }

            if (actionKey === "check_out") {
                payload.check_out_time = serverTimestamp();
            }

            if (actionKey === "check_in_2") {
                payload.check_in_time_2 = serverTimestamp();
            }

            if (actionKey === "check_out_2") {
                payload.check_out_time_2 = serverTimestamp();
            }

            if (scanState.attendanceRef) {
                await updateDoc(scanState.attendanceRef, payload);
            } else {
                await addDoc(collection(db, "attendances"), {
                    check_in_time: actionKey === "check_in" ? serverTimestamp() : null,
                    check_in_time_2: actionKey === "check_in_2" ? serverTimestamp() : null,
                    check_out_time: actionKey === "check_out" ? serverTimestamp() : null,
                    check_out_time_2: actionKey === "check_out_2" ? serverTimestamp() : null,
                    company_id: scanState.companyId,
                    created_at: serverTimestamp(),
                    created_by: scanState.employeeUid,
                    schedule_id: scanState.scheduleId,
                    updated_at: serverTimestamp(),
                });
            }

            toast.success(`${ACTIONS.find((item) => item.key === actionKey)?.label} saved`);
            await refreshCurrentScan();
        } catch (error) {
            console.error("Attendance save error:", error);
            toast.error("Failed to save attendance");
        } finally {
            if (isMountedRef.current) {
                setActionLoading("");
            }
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
                                    {loadingEmployees ? "Loading users..." : `${employees.length} users available`}
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
                            disabled={isStarting || loadingEmployees}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all ${isScanning ? "bg-red-500" : "bg-blue-600"} ${(isStarting || loadingEmployees) ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                            {isScanning ? <BiCameraOff size={24} /> : <BiUserCheck size={24} />}
                            {isStarting
                                ? "Opening camera..."
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
                            {t("scanningAttendance", "Scanning attendance...")}
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
                                {scanState.employee.name || scanState.employee.phone || scanState.employeeUid}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {scanState.employee.phone || "--"} | {scanState.employee.email || "--"}
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
                            <p>Start: {formatDateTime(scanState.schedule.start_time, scanState.timeZone)}</p>
                            <p>End: {formatDateTime(scanState.schedule.end_time, scanState.timeZone)}</p>
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
