import { Engine } from "@/core";
import { useEffect, useRef } from "react";

export default function MainMenu() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine>(null);

  useEffect(() => {
    if (canvasRef.current) {
      (async () => {
        // 设置canvas大小
        canvasRef.current!.width = canvasRef.current!.clientWidth;
        canvasRef.current!.height = canvasRef.current!.clientHeight;

        // 创建引擎
        const engine = await Engine.create(canvasRef.current!);
        engineRef.current = engine;
        console.log(engine);
      })();
    }

    return () => {
      engineRef.current?.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <canvas ref={canvasRef} className="w-full h-full"></canvas>
    </div>
  );
}
