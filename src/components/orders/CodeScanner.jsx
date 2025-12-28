import { useEffect, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";
import { BiBarcodeReader } from "react-icons/bi";
import { useGetAllUserQuery } from "../../../app/Features/usersSlice";
import AlertBox from "../../services/AlertBox"; // Assuming AlertBox is in the same directory
import { useGetAllItemsQuery } from "../../../app/Features/itemsSlice";

const CodeScanner = () => {
    const token = localStorage.getItem("token");
    const [scanResult, setScanResult] = useState([]);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const { data } = useGetAllItemsQuery(token);

    useEffect(() => {
        const init = async () => {
            try {
                await ScanbotSDK.initialize({
                    licenseKey: "",
                    enginePath: "/wasm/",
                });
                console.log("Scanbot SDK initialized successfully");
            } catch (error) {
                console.error("Failed to initialize Scanbot SDK:", error);
            }
        };

        init();
    }, []);

    const startScanner = async () => {
        setScanResult([]); // Clear previous results
        const config = new ScanbotSDK.UI.Config.BarcodeScannerScreenConfiguration();

        // Customize UI
        config.palette.sbColorPrimary = "#1E90FF"; // Default blue
        config.palette.sbColorSecondary = "#87CEEB";
        config.userGuidance.title.text = "Place the finder over the barcode";
        config.topBar.mode = "GRADIENT";
        config.actionBar.zoomButton.backgroundColor = "#1E90FF";

        // Configure use case
        const useCase = new ScanbotSDK.UI.Config.MultipleScanningMode();
        useCase.arOverlay.visible = true;
        useCase.arOverlay.automaticSelectionEnabled = true;
        config.useCase = useCase;

        try {
            const result = await ScanbotSDK.UI.createBarcodeScanner(config);

            if (result && result.items.length > 0) {
                let matchedItems = [];
                let unmatchedCodes = [];

                // Verify scanned items against data
                result.items.forEach((scannedItem) => {
                    const scannedCode = scannedItem.barcode?.text;
                    const matchedItem = data?.data.find(
                        (item) => item.barcode == scannedCode
                    );

                    if (matchedItem) {
                        matchedItems.push(matchedItem);
                    } else {
                        unmatchedCodes.push(scannedCode);
                        config.palette.sbColorPrimary = "#EF4444"; // Change to red for unmatched
                        config.userGuidance.title.text = "Item not found";
                    }
                });

                // Update scan results
                setScanResult(matchedItems);

                // Show alert for unmatched items
                if (unmatchedCodes.length > 0) {
                    setAlertMessage(
                        `No matching items found for code(s): ${unmatchedCodes.join(", ")}`
                    );
                    setIsAlertOpen(true);
                }

                console.log("Matched items:", matchedItems);
                console.log("Unmatched codes:", unmatchedCodes);
            }

            return result;
        } catch (error) {
            console.error("Error starting scanner:", error);
            setAlertMessage("Error starting scanner. Please try again.");
            setIsAlertOpen(true);
        }
    };

    const handleAlertClose = () => {
        setIsAlertOpen(false);
        setAlertMessage("");
    };

    return (
        <div className="p-4">
            <button
                className="btn text-4xl text-gray-500 hover:text-gray-700 transition-colors"
                onClick={startScanner}
            >
                <BiBarcodeReader />
            </button>

            <div className="mt-4">
                {scanResult.length > 0 ? (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Scanned Items:</h3>
                        <ul className="mt-2 space-y-4">
                            {scanResult.map((item, index) => (
                                <li
                                    key={index}
                                    className="p-4 bg-gray-50 rounded-lg shadow-sm flex items-center gap-4"
                                >
                                    <img
                                        src={item.item_image}
                                        alt={item.item_name}
                                        className="w-16 h-16 object-cover rounded"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {item.item_name} ({item.item_code})
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Price: ${item.item_price} | Size: {item.size_name} | Category: {item.category_name}
                                        </p>
                                        <p className="text-sm text-gray-500">Brand: {item.brand_name}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-600">No items scanned yet.</p>
                )}
            </div>

            <AlertBox
                isOpen={isAlertOpen}
                title="Scan Result"
                message={alertMessage}
                onConfirm={handleAlertClose}
                onCancel={handleAlertClose}
                confirmText="OK"
                cancelText="Close"
            />
        </div>
    );
};

export default CodeScanner;