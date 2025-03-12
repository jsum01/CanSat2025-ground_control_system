import { useState } from "react";
import { TelemetryData } from "types/mission";
import { CMD } from "constants/commands";
import { useSerialContext } from "context/SerialContext";

export const useTelemetry = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const { isConnected, ipcRenderer } = useSerialContext();

  const cmd = CMD;

  const handleStartTelemetry = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TEL.ON);
      } catch (error) {
        console.error("Failed to start telemetry:", error);
        alert("텔레메트리 시작 실패");
      }
    } else {
      alert("시리얼 포트에 연결되어 있지 않습니다.");
    }
  };

  const handleStopTelemetry = async () => {
    if (isConnected) {
      try {
        await ipcRenderer.invoke("send-data", cmd.TEL.OFF);

        const saveResult = await ipcRenderer.invoke(
          "save-telemetry",
          telemetryData
        );

        if (saveResult.success) {
          alert(
            `텔레메트리 데이터가 저장되었습니다.\n저장 위치: ${saveResult.filePath}`
          );
        } else {
          console.error("텔레메트리 데이터 저장 실패:", saveResult.error);
          alert("텔레메트리 데이터 저장 실패");
        }
      } catch (error) {
        console.error("텔레메트리 중지 실패:", error);
        alert("텔레메트리 중지 실패");
      }
    }
  };

  return {
    telemetryData,
    setTelemetryData,
    handleStartTelemetry,
    handleStopTelemetry,
  };
};
