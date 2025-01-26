import React, { useState, useEffect, useRef } from "react";
import { useMessages } from "./MessageContext";

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

 // 명령어 전송 처리
 const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();
   if (input.trim()) {
     const timestamp = new Date().toLocaleTimeString();
     setMessages(prev => [...prev, `[${timestamp}] TX: ${input}`]);
     // 시리얼 포트로 명령어 전송
     ipcRenderer.send("serial-send", input);
     setInput("");
   }
 };

 // 메시지가 추가될 때마다 스크롤
 useEffect(() => {
   scrollToBottom();
 }, [messages]);

 return (
   // 터미널 스타일 UI 구현
   <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
     {/* 메시지 표시 영역 */}
     <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
       {messages.map((msg, index) => (
         <div key={index} className="mb-2 whitespace-pre-wrap">
           {msg}
         </div>
       ))}
       <div ref={messageEndRef} />
     </div>
     {/* 명령어 입력 폼 */}
     <form onSubmit={handleSubmit} className="p-4 bg-gray-900">
       <input
         type="text"
         value={input}
         onChange={(e) => setInput(e.target.value)}
         className="w-full px-3 py-2 bg-black text-green-400 font-mono border border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
         placeholder="Enter command..."
       />
     </form>
   </div>
 );
};