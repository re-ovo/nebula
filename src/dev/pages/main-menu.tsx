import { test } from "@/ecs/example";

export default function MainMenu() {
  const runTest = () => {
    console.time("test");
    test();
    console.timeEnd("test");
  };
  return (
    <div>
      <button
        onClick={runTest}
        className="bg-blue-500 text-white p-2 rounded cursor-pointer hover:bg-blue-600 active:bg-blue-700"
      >
        Run Test
      </button>
    </div>
  );
}
