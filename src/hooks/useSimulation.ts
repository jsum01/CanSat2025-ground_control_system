import { useRef, useState } from "react";
import { useSerial } from "./useSerial";
import { CMD } from "constants/commands";
import { electronService } from "services/electronService";
import { useSerialContext } from "context/SerialContext";

export const useSimulation = () => {

    const { isConnected, ipcRenderer } = useSerialContext();

    const [simStatus, setSimStatus] = useState<
      "DISABLED" | "ENABLED" | "ACTIVE"
    >("DISABLED");
    const [simFile, setSimFile] = useState<string[]>([]);
    const [hasValidSimFile, setHasValidSimFile] = useState(false);
    const [canReceiveSimData, setCanReceiveSimData] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const sim = CMD.SIM;

    // SIMP 명령 실행을 위한 인터벌 핸들러
    const startSimulation = async () => {
      let index = 0;

      intervalRef.current = setInterval(async () => {
        if (index >= simFile.length) {
          clearInterval(intervalRef.current!);
          handleSimDisable(); // 모든 데이터 전송 후 자동 비활성화
          return;
        }

        try {
          await ipcRenderer.invoke("send-data", simFile[index]);
          index++;
        } catch (error) {
          console.error("Failed to send simulation command:", error);
          clearInterval(intervalRef.current!);
        }
      }, 1000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const text = await file.text();

        // 파일 파싱 (#으로 시작하는 줄과 빈 줄 제외)
        const commands = text
          .split("\n")
          .filter((line) => line.trim() && !line.startsWith("#"))
          .map((line) => line.replace("$", "3167"));

        setSimFile(commands);
        setHasValidSimFile(commands.length > 0);
      }
    };

    const handleSimEnable = async () => {
      if (isConnected) {
        try {
          const response = await ipcRenderer.invoke("send-data", sim.ENABLE);
          console.log("Send data response:", response); // 응답 확인
          // 파일 선택 트리거
          fileInputRef.current?.click();
          setSimStatus("ENABLED");
        } catch (error) {
          console.error("Failed to enable simulation:", error);
          alert("시뮬레이션 모드 활성화 실패");
        }
      }
    };

    const handleSimActivate = async () => {
      if (isConnected && hasValidSimFile) {
        try {
          await ipcRenderer.invoke("send-data", sim.ACTIVATE);
          setSimStatus("ACTIVE");
          startSimulation();
        } catch (error) {
          console.error("Failed to activate simulation:", error);
          alert("시뮬레이션 실행 실패");
        }
      }
    };

    // 시뮬레이션 모드 해제
    const handleSimDisable = async () => {
      if (isConnected) {
        try {
          await ipcRenderer.invoke("send-data", sim.DISABLE);
          setSimStatus("DISABLED");
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } catch (error) {
          console.error("Failed to disable simulation:", error);
          alert("시뮬레이션 모드 비활성화 실패");
        }
      }
    };

    // 수동 시뮬레이션 데이터 전송 (startSimulation에서 진행하고 있어서 사용되지 않지만, 혹시 수동으로 전송해야 할 경우를 대비해 남겨놓는다.)
    const handleSendSimData = async (pressureValue: string) => {
      if (isConnected && canReceiveSimData) {
        try {
          await ipcRenderer.invoke(
            "send-data",
            `${sim.PRESSURE}${pressureValue}`
          );
        } catch (error) {
          console.error("Failed to send simulation data:", error);
          alert("시뮬레이션 데이터 전송 실패");
        }
      }
    };

    return {
      simStatus,
      setSimStatus,
      simFile,
      setSimFile,
      hasValidSimFile,
      setHasValidSimFile,
      canReceiveSimData,
      setCanReceiveSimData,
      fileInputRef,
      intervalRef,
      startSimulation,
      handleFileUpload,
      handleSimEnable,
      handleSimActivate,
      handleSimDisable,
      handleSendSimData,
    };
  };