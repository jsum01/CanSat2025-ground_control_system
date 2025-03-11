import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";

export const useMechanical = () => {
  const { isConnected, ipcRenderer } = useSerialContext();
  
  const sendMecCommand = async (isOn: boolean) => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", isOn ? CMD.MEC.ON : CMD.MEC.OFF);
        return true;
      } catch (error) {
        console.error("Failed to send MEC command:", error);
        return false;
      }
    }
    return false;
  };

  return { sendMecCommand };
};
