import React, { useState, useEffect, useRef } from "react";
const { ipcRenderer } = window.require("electron");

export const CmdEcho: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const handleSerialData = (_event: any, data: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, `[${timestamp}] ${data}`]);
    };

    ipcRenderer.on("serial-data", handleSerialData);
    return () => {
      ipcRenderer.removeListener("serial-data", handleSerialData);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
      {messages.map((msg, index) => (
        <div key={index} className="mb-2 whitespace-pre-wrap">
          {msg}
        </div>
      ))}
      <div ref={messageEndRef} />
    </div>
  );
};
