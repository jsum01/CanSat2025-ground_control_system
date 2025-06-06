import React, { createContext, useState, useContext, useEffect } from "react";
import { electronService } from "services/electronService";

const MAX_MESSAGES = 500;

type MessageContextType = {
  messages: string[];
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
  clearMessages: () => void;
  getCurrentTimeString: () => string;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

const getUTCTimeString = () => {
  const now = new Date();
  return `${String(now.getUTCHours()).padStart(2, "0")}:${String(
    now.getUTCMinutes()
  ).padStart(2, "0")}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
};

export const MessageProvider: React.FC<{
  children: React.ReactNode;
  setTime?: string;
}> = ({ children, setTime }) => {
  const ipcRenderer = electronService.ipcRenderer;
  const [messages, setMessages] = useState<string[]>([]);

  const getCurrentTimeString = () => {
    if (setTime && setTime.trim()) {
      return setTime;
    } else {
      return getUTCTimeString();
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const addMessage = (newMessage: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage];
      if (updatedMessages.length > MAX_MESSAGES) {
        return updatedMessages.slice(updatedMessages.length - MAX_MESSAGES);
      }
      return updatedMessages;
    });
  };

  useEffect(() => {
    // 기존 시리얼 데이터 수신 이벤트 처리 (단순 메시지용)
    const handleSerialData = (_event: any, data: string) => {
      const timeString = getCurrentTimeString();
      console.log(`Received Data: ${data}`);
      addMessage(`[UTC ${timeString}] RX: ${data}`);
    };

    // 새로운 텔레메트리 메시지 이벤트 처리 (유효성 정보 포함)
    const handleTelemetryMessage = (event: CustomEvent) => {
      const { rawData, isValid, errorReason } = event.detail;
      const timeString = getCurrentTimeString();
      
      if (isValid) {
        addMessage(`[UTC ${timeString}] [V] RX: ${rawData}`);
      } else {
        addMessage(`[UTC ${timeString}] [NV] RX: ${rawData}${errorReason ? ` (${errorReason})` : ''}`);
      }
    };

    // 시리얼 데이터 송신 이벤트 처리
    const handleSentData = (_event: any, data: string) => {
      const timeString = getCurrentTimeString();
      console.log(`Sent Data: ${data}`);
      addMessage(`[UTC ${timeString}] TX: ${data}`);
    };

    if (ipcRenderer) {
      // 기존 이벤트는 주석 처리 (텔레메트리가 아닌 다른 데이터용으로 남겨둘 수 있음)
      // ipcRenderer.on("serial-data", handleSerialData);
      ipcRenderer.on("serial-sent", handleSentData);
      
      // 새로운 커스텀 이벤트 리스너 등록
      window.addEventListener('telemetry-message', handleTelemetryMessage as EventListener);

      return () => {
        // ipcRenderer.removeListener("serial-data", handleSerialData);
        ipcRenderer.removeListener("serial-sent", handleSentData);
        window.removeEventListener('telemetry-message', handleTelemetryMessage as EventListener);
      };
    }

    return undefined;
  }, [ipcRenderer, setTime]);

  return (
    <MessageContext.Provider
      value={{
        messages,
        setMessages,
        clearMessages,
        getCurrentTimeString,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context)
    throw new Error("useMessages must be used within MessageProvider");
  return context;
};