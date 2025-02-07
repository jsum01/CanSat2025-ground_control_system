import { useState } from "react";
import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";

export const useTimeControl = () => {
  const [isToggleTime, setIsToggleTime] = useState(false);
  const [UTCTime, setUTCTime] = useState("");
  const { isConnected, ipcRenderer } = useSerialContext();
  const cmd = CMD;

  const handleSetGPSTime = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TIME.GPS);
        setIsToggleTime(false);
      } catch (error) {
        console.error("Failed to set GPS time:", error);
        alert(
          `GPS 시간 설정 실패
       
       Failed to set GPS time`
        );
      }
    }
  };

  const handleSetUTCTime = async (e: React.FormEvent) => {
    if (isConnected) {
      try {
        e.preventDefault();
        if (UTCTime.trim()) {
          await ipcRenderer.invoke("send-data", cmd.TIME.UTC + UTCTime);
          setUTCTime("");
          setIsToggleTime(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  const handleToggleTime = () => {
    if (isConnected) {
      setIsToggleTime(true);
    }
  };

  return {
    isToggleTime,
    setIsToggleTime,
    UTCTime,
    setUTCTime,
    handleSetGPSTime,
    handleSetUTCTime,
    handleToggleTime,
  };
};
