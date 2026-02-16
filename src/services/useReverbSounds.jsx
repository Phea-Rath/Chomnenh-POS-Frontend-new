import { useEffect, useState } from "react";

export default function useReverbSounds(echo, profileId) {
    const [audioUnlocked, setAudioUnlocked] = useState(false);

    useEffect(() => {
        const unlockAudio = () => {
            const audio = new Audio("/sounds/auto.wav");
            audio.play().catch(() => { }); // silent catch
            setAudioUnlocked(true);
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
        };

        // Listen for first interaction
        document.addEventListener("click", unlockAudio);
        document.addEventListener("keydown", unlockAudio);

        // Reverb event listeners
        echo.private(`my-private-channel.user.${profileId}`).listen("PrivateChannelEvent", (data) => {
            if (audioUnlocked) {
                const audio = new Audio("/sounds/auto.wav");
                audio.currentTime = 0;
                audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
            }
            console.log("📡 Event received:", data);
            toast.info(`💬 New orders by ${data.data}`);
            refetch();
            refetchOnline();
            refetchSale();
            refetchItem();
            refetchItemInStock();
        });

        echo.private(`check-online.user.${profileId}`).listen("OnlineEvent", (data) => {
            toast.info(`💬 Order tracking updated ${data.data}`);
            refetchSale();
            refetchOnline();
            refetchOrder();
        });

        echo.channel("my-public-channel").listen("PublicChannelEvent", (data) => {
            if (audioUnlocked) {
                const audio = new Audio("/sounds/auto.wav");
                audio.currentTime = 0;
                audio.play().catch((err) => console.log("🔇 Sound blocked:", err));
            }
            console.log("📡 Event received:", data);
            toast.info(`💬 New orders by ${data.message}`);
        });

        return () => {
            document.removeEventListener("click", unlockAudio);
            document.removeEventListener("keydown", unlockAudio);
        };
    }, [echo, profileId, audioUnlocked]);
}
