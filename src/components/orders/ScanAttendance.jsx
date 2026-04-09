import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { BiUserCheck, BiCameraOff, BiCheckCircle } from "react-icons/bi";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA-auJnr3_rXmJr468jpbwF506nF9Xa0Ho",
    authDomain: "attendance-78fb1.firebaseapp.com",
    projectId: "attendance-78fb1",
    storageBucket: "attendance-78fb1.firebasestorage.app",
    messagingSenderId: "311096491117",
    appId: "1:311096491117:web:03df53ac7afb77cfb75364",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ScanAttendance = () => {
    const { t } = useTranslation();

    const [isScanning, setIsScanning] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [lastScan, setLastScan] = useState(null);

    const html5QrCodeRef = useRef(null);
    const isMountedRef = useRef(true);
    const isStartingRef = useRef(false);
    const scannerId = "reader";

    // prevent duplicate scan
    const lastScanTimeRef = useRef(0);
    const SCAN_COOLDOWN = 3000; // 3 seconds

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

    // Save to Firebase
    const saveScanToFirestore = async (decodedText) => {
        const now = Date.now();

        if (now - lastScanTimeRef.current < SCAN_COOLDOWN) {
            return; // prevent duplicate
        }

        lastScanTimeRef.current = now;

        try {
            const docRef = await addDoc(collection(db, "attendance"), {
                userId: decodedText,
                timestamp: serverTimestamp(),
                type: "check-in",
            });

            console.log("Saved:", docRef.id);
            setLastScan(decodedText);
            toast.success(`${t("attendanceRecorded")}: ${decodedText}`);
        } catch (e) {
            console.error(e);
            toast.error("Firebase save failed");
        }
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

    // Stop scanner safely
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
        } catch (err) {
            console.error("Stop error:", err);
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

    const startWithCamera = async (scanner, cameraConfig) => {
        await scanner.start(
            cameraConfig,
            scannerConfig,
            (decodedText) => {
                void saveScanToFirestore(decodedText);
                void stopScanner();
            },
            () => { }
        );
    };

    // Start scanner
    const startScanner = async () => {
        if (isStartingRef.current || isScanning) {
            return;
        }

        try {
            isStartingRef.current = true;
            setIsStarting(true);
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
        } catch (err) {
            console.error("Start error:", err);
            toast.error(getCameraErrorMessage(err));
            await stopScanner();
        } finally {
            isStartingRef.current = false;
            if (isMountedRef.current) {
                setIsStarting(false);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
            void stopScanner();
        };
    }, []);

    const toggleScanner = () => {
        if (isScanning) {
            stopScanner();
        } else {
            startScanner();
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto text-center">
            <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center justify-center gap-2 mb-4">
                    <BiUserCheck className="text-green-600 text-2xl" />
                    {t("scanAttendance")}
                </h2>

                <button
                    onClick={toggleScanner}
                    disabled={isStarting}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isScanning
                        ? "bg-red-500 text-white"
                        : "bg-blue-600 text-white"
                        } ${isStarting ? "cursor-not-allowed opacity-70" : ""}`}
                >
                    {isScanning ? <BiCameraOff size={24} /> : <BiUserCheck size={24} />}
                    {isStarting ? t("loading", "Opening camera...") : isScanning ? t("stopScanning") : t("scanAttendance")}
                </button>
            </div>

            {/* Scanner */}
            <div
                className={`relative overflow-hidden rounded-2xl border-2 transition-all ${isScanning
                    ? "border-blue-500 bg-black aspect-square"
                    : "h-0 opacity-0 border-0"
                    }`}
            >
                <div id={scannerId} className="w-full h-full"></div>

                {isScanning && (
                    <div className="absolute top-0 w-full p-2 bg-blue-600 text-white text-xs animate-pulse">
                        {t("scanningAttendance")}
                    </div>
                )}
            </div>

            {/* Result */}
            {lastScan && (
                <div className="mt-6 p-4 bg-green-100 border rounded-xl flex items-center gap-3">
                    <BiCheckCircle className="text-green-600 text-2xl" />
                    <div className="text-left">
                        <p className="text-xs font-bold">{t("successfully")}</p>
                        <p className="text-sm font-mono font-bold truncate">
                            {lastScan}
                        </p>
                    </div>
                </div>
            )}

            {!isScanning && !lastScan && (
                <div className="py-12 text-gray-400">
                    <BiUserCheck size={64} className="mx-auto opacity-20 mb-4" />
                    <p>{t("noAttendanceYet")}</p>
                </div>
            )}
        </div>
    );
};

export default ScanAttendance;
