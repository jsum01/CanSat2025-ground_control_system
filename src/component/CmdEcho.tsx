import React, { useState, useEffect, useRef } from "react";
import { useMessages } from "./MessageContext";
import { CMD } from "constants/commands";
import { useCommands } from "hooks/useCommand";

// 일렉트론 IPC 통신을 위한 renderer 프로세스 import
const { ipcRenderer } = window.require("electron");

export const CmdEcho: React.FC = () => {
  // 메시지 상태 관리를 위한 컨텍스트 훅
  const { messages, setMessages } = useMessages();
  // 입력 필드 상태 관리
  const [input, setInput] = useState("");
  // 자동 스크롤을 위한 ref
  const messageEndRef = useRef<HTMLDivElement>(null);

  // 메시지 목록의 맨 아래로 스크롤
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const cmd = CMD;
  const useSim = useCommands().useSim();
  const startCMD = "CMD,3167,";

  // 명령어 전송 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, `[${timestamp}] TX: ${input}`]);

      try {
        await ipcRenderer.invoke("send-data", input);

        switch (input) {
          case `${cmd.SIM.ENABLE}`: // ENABLE
            useSim.handleSimEnable();
            break;
          case `${cmd.SIM.ACTIVATE}`: // ACTIVE
            if (useSim.hasValidSimFile) {
              useSim.handleSimActivate();
            } else {
              setMessages((prev) => [
                ...prev,
                `[${timestamp}] Error: No valid simulation file found.\n[${timestamp}] 오류: 유효한 시뮬레이션 파일이 없습니다.`,
              ]);
            }
            break;
          case `${cmd.SIM.DISABLE}`: // DISABLE
            if (useSim.intervalRef.current) {
              useSim.handleSimDisable();
            } else {
              setMessages((prev) => [
                ...prev,
                `[${timestamp}] Error: Simulation is not active.\n[${timestamp}] 오류: 시뮬레이션이 활성화되지 않았습니다.`,
              ]);
            }
            break;
          default: // SIM ERROR
            setMessages((prev) => [
              ...prev,
              `[${timestamp}] Error: Unknown command.\n[${timestamp}] 오류: 알 수 없는 명령어입니다.`,
            ]);
        }
      } catch (error) {
        // CMD ERROR
        console.error("명령어 전송 실패:", error);
        setMessages((prev) => [
          ...prev,
          `[${timestamp}] Error: Failed to send command.\n[${timestamp}] 오류: 명령어 전송 실패.`,
        ]);
      }

      setInput("");
    }
  };

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    // 터미널 스타일 UI 구현
    <div className="w-full h-full p-4 bg-white text-black-400 font-mono overflow-auto border-2 border-blue-900 rounded-lg">
      {/* 메시지 표시 영역 */}
      <div className="w-full h-full p-4 bg-white text-black-400 font-mono overflow-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 whitespace-pre-wrap">
            {msg}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
      {/* 명령어 입력 폼 */}
      <form onSubmit={handleSubmit} className="p-4 bg-blue-900 rounded-lg">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full px-3 py-2 bg-white text-black-400 font-mono border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="Enter command..."
        />
      </form>
    </div>
  );
};
