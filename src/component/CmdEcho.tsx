export const CmdEcho: React.FC = () => {
  return (
    <div className="w-full h-full p-4 bg-black text-green-400 font-mono overflow-auto">
      <div className="mb-2"> Starting telemetry...</div>
      <div className="mb-2"> Connection established</div>
      <div className="mb-2"> Receiving data packets...</div>
      <div className="mb-2"> System status: OK</div>
    </div>
  );
};