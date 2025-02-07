import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";
import { useState } from "react";

export const useMechanical = () => {
  const { isConnected, ipcRenderer } = useSerialContext();
  const cmd = CMD;
  const [isMec, setIsMec] = useState(false);

  const handleToggleMEC = async () => {
    if (isConnected) {
      try {
        if (isMec) {
          await ipcRenderer.invoke("send-data", cmd.MEC.ON);
          setIsMec(true);
        } else {
          await ipcRenderer.invoke("send-data", cmd.MEC.OFF);
          setIsMec(false);
        }
      } catch (error) {
        console.error("Failed to stop telemetry:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  return { handleToggleMEC, isMec, setIsMec };
};
