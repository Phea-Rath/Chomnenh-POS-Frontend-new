import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import {
    BiCameraOff,
    BiCheckCircle,
    BiLogIn,
    BiLogOut,
    BiRefresh,
    BiUserCheck,
    BiChevronRight,
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
    setDoc,
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
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (value instanceof Date) return value;
    return null;
};

const formatDateTime = (value, timeZone = DEFAULT_TIMEZONE) => {
    const date = toDate(value);
    if (!date) return "--";
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
    if (!startDate || !endDate) return null;
    return {
        start: getTimeParts(startDate, timeZone).totalMinutes,
        end: getTimeParts(endDate, timeZone).totalMinutes,
    };
};

const getCameraErrorMessage = (error) => {
    const message = String(error?.message || error || "").toLowerCase();
    if (!window.isSecureContext && window.location.hostname !== "localhost") return "Camera needs HTTPS";
    if (message.includes("permission")) return "Camera permission denied";
    if (message.includes("notfound")) return "No camera found";
    return "Unable to start camera";
};

const normalizeId = (value) => String(value ?? "").trim();
const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const buildAuthIdentifier = (value) => {
    const identifier = String(value ?? "").trim().replace(/\s+/g, "");
    const isPhone = !identifier.includes("@");
    return {
        identifier,
        isPhone,
        email: isPhone ? `${identifier}@phone.com` : normalizeEmail(identifier),
    };
};

const parseQrPayload = (decodedText) => {
    const normalized = normalizeId(decodedText);
    const fallbackPayload = { rawValue: normalized, companyId: "", employeeIdentifiers: [normalized] };
    if (!normalized) return fallbackPayload;

    const collectObjectPayload = (value) => {
        const companyId = normalizeId(value?.company_id ?? value?.companyId ?? value?.company ?? value?.profile_id);
        const employeeIdentifiers = [value?.user_id, value?.userId, value?.uid, value?.phone, value?.email]
            .map(normalizeId).filter(Boolean);
        return {
            rawValue: normalized,
            companyId,
            employeeIdentifiers: employeeIdentifiers.length ? employeeIdentifiers : fallbackPayload.employeeIdentifiers,
        };
    };

    try { return collectObjectPayload(JSON.parse(normalized)); } catch { }
    try {
        const url = normalized.startsWith("http") ? new URL(normalized) : new URL(`https://a.l/?${normalized.replace(/^\?/, "")}`);
        const p = url.searchParams;
        if ([...p.keys()].length) {
            return collectObjectPayload({
                company_id: p.get("company_id") || p.get("companyId") || p.get("profile_id"),
                employee_id: p.get("employee_id") || p.get("user_id") || p.get("uid"),
                phone: p.get("phone"),
                email: p.get("email"),
            });
        }
    } catch { }
    return fallbackPayload;
};

const CHECK_IN_WINDOW_MINUTES = 60;
const getMinutesOfDay = (date, timeZone = DEFAULT_TIMEZONE) => getTimeParts(date, timeZone).totalMinutes;

const resolveAttendanceActionStates = (attendanceDoc, scanState, timeZone = DEFAULT_TIMEZONE) => {
    const nowMinutes = getMinutesOfDay(new Date(), timeZone);
    const checkInTime = toDate(attendanceDoc?.check_in_time);
    const checkOutTime = toDate(attendanceDoc?.check_out_time);
    const checkInTime2 = toDate(attendanceDoc?.check_in_time_2);
    const checkOutTime2 = toDate(attendanceDoc?.check_out_time_2);
    const makeState = (enabled, reason = "") => ({ enabled, reason });

    const resolveShiftState = (schedule, type) => {
        if (!schedule) return makeState(false, "Shift not configured");
        const window = getScheduleWindow(schedule, timeZone);
        if (!window) return makeState(false, "No schedule time");
        if (type === "in") {
            return nowMinutes >= window.start - CHECK_IN_WINDOW_MINUTES && nowMinutes <= window.end + CHECK_IN_WINDOW_MINUTES
                ? makeState(true) : makeState(false, "Outside shift window");
        }
        return nowMinutes >= window.start ? makeState(true) : makeState(false, "Too early for checkout");
    };

    return {
        check_in: checkInTime ? makeState(false, "Already in") : resolveShiftState(scanState?.primarySchedule, "in"),
        check_out: !checkInTime ? makeState(false, "Check-in first") : checkOutTime ? makeState(false, "Already out") : resolveShiftState(scanState?.primarySchedule, "out"),
        check_in_2: scanState?.section !== "2" ? makeState(false, "No Section 2") : checkInTime2 ? makeState(false, "Already in") : resolveShiftState(scanState?.secondarySchedule, "in"),
        check_out_2: scanState?.section !== "2" ? makeState(false, "No Section 2") : !checkInTime2 ? makeState(false, "Check-in 2 first") : checkOutTime2 ? makeState(false, "Already out") : resolveShiftState(scanState?.secondarySchedule, "out"),
    };
};

const ScanAttendance = () => {
    const { t } = useTranslation();
    const [authUser, setAuthUser] = useState(null);
    const [loginForm, setLoginForm] = useState({ identifier: "", password: "" });
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

    const stopScanner = async () => {
        const scanner = html5QrCodeRef.current;
        if (!scanner) {
            if (isMountedRef.current) { setIsScanning(false); setIsStarting(false); }
            return;
        }
        try {
            const state = scanner.getState();
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                await scanner.stop();
            }
        } catch (e) { console.error(e); } finally {
            try { scanner.clear(); } catch { }
            html5QrCodeRef.current = null;
            isStartingRef.current = false;
            if (isMountedRef.current) { setIsScanning(false); setIsStarting(false); }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!isMountedRef.current) return;
            setAuthUser(user);
        });
        return () => { isMountedRef.current = false; unsubscribe(); void stopScanner(); };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        const { identifier, isPhone, email } = buildAuthIdentifier(loginForm.identifier);
        if (!identifier || !loginForm.password) return toast.error("Missing credentials");
        setLoginLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, loginForm.password);
            const uid = cred.user.uid;
            const userRef = doc(db, "users", uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
                await setDoc(userRef, { name: isPhone ? identifier : email.split("@")[0], email: isPhone ? "" : email, phone: isPhone ? identifier : "", role: "employee", token: uid, isActive: 1, created_by: uid, last_login_at: serverTimestamp() });
            } else {
                await updateDoc(userRef, { last_login_at: serverTimestamp() });
            }
        } catch (e) { toast.error(e.message); } finally { if (isMountedRef.current) setLoginLoading(false); }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setScanState(null);
        void stopScanner();
    };

    const resolveScanPayload = async (text) => {
        const normalized = normalizeId(text);
        const qr = parseQrPayload(normalized);
        const companyId = normalizeId(qr.companyId || normalized);
        if (!authUser?.uid) throw new Error("Not logged in");
        
        const userDoc = await getDoc(doc(db, "users", authUser.uid));
        const userData = userDoc.data();
        const compSnap = await getDoc(doc(db, "companies", companyId));
        const company = compSnap.data();
        if (!company) throw new Error("Invalid Company QR");

        const tz = company.timezone || DEFAULT_TIMEZONE;
        const now = new Date();
        const day = getDayName(now, tz);
        const schedSnap = await getDocs(query(collection(db, "schedule_details"), where("user_id", "==", authUser.uid), where("company_id", "==", companyId), where("day_name", "==", day), limit(1)));
        const schedDetail = schedSnap.docs[0]?.data();
        if (!schedDetail) throw new Error(`No schedule for ${day}`);

        const s1 = schedDetail.section_one ? (await getDoc(doc(db, "schedules", schedDetail.section_one))).data() : null;
        const s2 = schedDetail.section_two ? (await getDoc(doc(db, "schedules", schedDetail.section_two))).data() : null;

        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start); end.setDate(end.getDate() + 1);
        const attSnap = await getDocs(query(collection(db, "attendances"), where("created_by", "==", authUser.uid), where("company_id", "==", companyId), where("created_at", ">=", Timestamp.fromDate(start)), where("created_at", "<", Timestamp.fromDate(end)), limit(1)));
        const attDoc = attSnap.docs[0];
        const attendance = attDoc ? { id: attDoc.id, ref: attDoc.ref, ...attDoc.data() } : null;

        const state = { 
            scannedValue: normalized, companyId, company, userName: userData?.name || authUser.email, 
            timeZone: tz, dayName: day, section: String(schedDetail.section || "1"), 
            primarySchedule: s1, secondarySchedule: s2, 
            primaryScheduleId: schedDetail.section_one, secondaryScheduleId: schedDetail.section_two,
            attendance, attendanceRef: attDoc?.ref, employeeUid: authUser.uid 
        };
        return { ...state, actionStates: resolveAttendanceActionStates(attendance, state, tz) };
    };

    const handleScanSuccess = async (text) => {
        if (isProcessingScanRef.current) return;
        isProcessingScanRef.current = true;
        setIsProcessingScan(true);
        try {
            const payload = await resolveScanPayload(text);
            setScanState(payload);
            setLastScan(text);
            await stopScanner();
        } catch (e) { toast.error(e.message); } finally {
            isProcessingScanRef.current = false;
            setIsProcessingScan(false);
        }
    };

    const startScanner = async () => {
        if (isStartingRef.current || isScanning) return;
        isStartingRef.current = true; setIsStarting(true);
        setScanState(null);
        try {
            const scanner = html5QrCodeRef.current || new Html5Qrcode(scannerId);
            html5QrCodeRef.current = scanner;
            setIsScanning(true);
            await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, handleScanSuccess, () => {});
        } catch (e) { toast.error(getCameraErrorMessage(e)); await stopScanner(); } finally {
            isStartingRef.current = false; setIsStarting(false);
        }
    };

    const submitAction = async (key) => {
        if (!scanState) return;
        const state = scanState.actionStates?.[key];
        if (!state?.enabled) return toast.error(state?.reason);
        setActionLoading(key);
        try {
            const now = serverTimestamp();
            const field = { check_in: "check_in_time", check_out: "check_out_time", check_in_2: "check_in_time_2", check_out_2: "check_out_time_2" }[key];
            if (scanState.attendanceRef) {
                await updateDoc(scanState.attendanceRef, { [field]: now, updated_at: now });
            } else {
                await addDoc(collection(db, "attendances"), { 
                    company_id: scanState.companyId, schedule_id: scanState.primaryScheduleId, 
                    user_name: scanState.userName, status: "present", 
                    [field]: now, created_by: scanState.employeeUid, created_at: now, updated_at: now 
                });
            }
            toast.success("Success");
            const next = await resolveScanPayload(scanState.scannedValue);
            setScanState(next);
        } catch { toast.error("Update failed"); } finally { setActionLoading(""); }
    };

    return (
        <div className="min-h-screen bg-[#0e1621] p-4 text-[#f5f5f5] font-sans antialiased selection:bg-[#24a1de]/30">
            <div className="mx-auto max-w-md">
                {/* Header */}
                <header className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#24a1de] text-white">
                            <BiUserCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight">Attendance</h1>
                            <p className="text-xs text-[#8e959b]">Smart Scanner</p>
                        </div>
                    </div>
                    {authUser && (
                        <button onClick={handleLogout} className="p-2 text-[#8e959b] hover:text-white transition-colors">
                            <BiLogOut size={20} />
                        </button>
                    )}
                </header>

                {!authUser ? (
                    <div className="rounded-2xl bg-[#17212b] p-6 shadow-xl border border-[#232e3c]">
                        <h2 className="mb-4 text-xl font-bold">Sign In</h2>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                value={loginForm.identifier}
                                onChange={e => setLoginForm(p => ({ ...p, identifier: e.target.value }))}
                                placeholder="Phone or email"
                                className="w-full rounded-xl bg-[#242f3d] px-4 py-3 text-sm outline-none border border-transparent focus:border-[#24a1de] transition-all"
                            />
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                                placeholder="Password"
                                className="w-full rounded-xl bg-[#242f3d] px-4 py-3 text-sm outline-none border border-transparent focus:border-[#24a1de] transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full rounded-xl bg-[#24a1de] py-3 text-sm font-bold text-white transition-opacity active:scale-[0.98] disabled:opacity-50"
                            >
                                {loginLoading ? "..." : "Login"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Profile Summary */}
                        <div className="flex items-center justify-between rounded-2xl bg-[#17212b] p-4 border border-[#232e3c]">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-[#2b5278] flex items-center justify-center font-bold text-[#24a1de]">
                                    {authUser.email?.[0].toUpperCase() || "U"}
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{authUser.email || "Employee"}</p>
                                    <p className="text-[10px] text-[#8e959b] uppercase tracking-wider">Verified Account</p>
                                </div>
                            </div>
                        </div>

                        {/* Scanner Area */}
                        <div className={`relative overflow-hidden rounded-2xl bg-black transition-all ${isScanning ? "aspect-square border-2 border-[#24a1de]" : "h-0"}`}>
                            <div id={scannerId} className="h-full w-full"></div>
                            {isProcessingScan && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#24a1de] border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {/* Scan Button */}
                        <button
                            onClick={isScanning ? stopScanner : startScanner}
                            disabled={isStarting}
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] ${isScanning ? "bg-[#e53935]" : "bg-[#24a1de] shadow-[0_4px_12px_rgba(36,161,222,0.3)]"}`}
                        >
                            {isScanning ? <BiCameraOff size={20} /> : <BiUserCheck size={20} />}
                            {isScanning ? "Cancel Scanning" : "Start Attendance Scan"}
                        </button>

                        {/* Results Card */}
                        {scanState && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 rounded-2xl bg-[#17212b] border border-[#232e3c] overflow-hidden">
                                <div className="p-4 border-b border-[#232e3c] flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">{scanState.userName}</h3>
                                        <p className="text-xs text-[#8e959b]">{scanState.company.company_name}</p>
                                    </div>
                                    <button onClick={() => void resolveScanPayload(scanState.scannedValue).then(setScanState)} className="text-[#24a1de]">
                                        <BiRefresh size={20} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-px bg-[#232e3c]">
                                    {ACTIONS.map(a => {
                                        const s = scanState.actionStates[a.key];
                                        return (
                                            <button
                                                key={a.key}
                                                onClick={() => submitAction(a.key)}
                                                disabled={!s.enabled || !!actionLoading}
                                                className={`bg-[#17212b] p-4 text-left transition-colors active:bg-[#242f3d] disabled:opacity-40`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold uppercase text-[#24a1de]">{a.label}</span>
                                                    <BiChevronRight size={16} className="text-[#8e959b]" />
                                                </div>
                                                <p className="text-[10px] text-[#8e959b] line-clamp-1">{s.enabled ? "Tap to record" : s.reason}</p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-[#242f3d]/30 space-y-2">
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#8e959b]">Status</span>
                                        <span className="text-[#31b46f] font-bold uppercase">Present Today</span>
                                    </div>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="text-[#8e959b]">Shift 1</span>
                                        <span>{scanState.attendance?.check_in_time ? "Check-in at " + formatDateTime(scanState.attendance.check_in_time, scanState.timeZone).split(',')[1] : "--:--"}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {lastScan && !isScanning && !scanState && (
                            <div className="flex items-center gap-3 rounded-2xl bg-[#31b46f]/10 border border-[#31b46f]/20 p-4">
                                <BiCheckCircle className="text-[#31b46f]" size={24} />
                                <div>
                                    <p className="text-xs font-bold text-[#31b46f]">Last scan successful</p>
                                    <p className="text-[10px] text-[#8e959b] font-mono">{lastScan.slice(0, 30)}...</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {!isScanning && (
                    <footer className="mt-8 text-center">
                        <p className="text-[10px] text-[#54687a] uppercase tracking-widest">Powered by Gemini AI • Secure Attendance</p>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default ScanAttendance;
