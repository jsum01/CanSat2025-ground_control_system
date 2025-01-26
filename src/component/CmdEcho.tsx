import React, { useState, useEffect, useRef } from "react";
import { useMessages } from "./MessageContext";
const { ipcRenderer } = window.require("electron");

export const CmdEcho: React.FC = () => {
  const { messages, setMessages } = useMessages();
  const [input, setInput] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const timestamp = new Date().toLocaleTimeString();
      setMessages(prev => [...prev, `[${timestamp}] TX: ${input}`]);
      ipcRenderer.send("serial-send", input);
      setInput("");
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
      <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 whitespace-pre-wrap">
            {msg}
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>
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
