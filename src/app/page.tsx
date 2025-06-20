import { ThemeToggle } from '@/components/theme-toggle';
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl text-center font-bold mb-4 text-gray-800 dark:text-gray-100">Hello ToDo</h1>
      <div className="flex justify-center mb-4">
        <ThemeToggle />
      </div>
    </div>
  );

}
