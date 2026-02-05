'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProjectsPage() {
  const router = useRouter();
  const [testId, setTestId] = useState('b5dd2523-ffa3-49cf-bae4-5e47bc60099a');

  const projects = [
    { id: 'b5dd2523-ffa3-49cf-bae4-5e47bc60099a', title: 'Тестовый проект 1' },
    { id: 'test-id-2', title: 'Тестовый проект 2' },
    { id: 'test-id-3', title: 'Тестовый проект 3' },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Тестовая страница проектов</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold text-blue-800 mb-2">Тест динамического роута</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Введите ID проекта"
          />
          <button
            onClick={() => router.push(`/projects/${testId}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Перейти к проекту
          </button>
          <button
            onClick={() => {
              const randomId = Math.random().toString(36).substring(2);
              setTestId(randomId);
              router.push(`/projects/${randomId}`);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Случайный ID
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Список проектов:</h2>
        <div className="grid gap-4">
          {projects.map((project) => (
            <div key={project.id} className="p-4 border rounded hover:bg-gray-50">
              <h3 className="font-semibold">{project.title}</h3>
              <p className="text-sm text-gray-600 mb-2">ID: {project.id}</p>
              <div className="flex gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Через Link
                </Link>
                <button
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Через router.push
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="font-bold text-yellow-800 mb-2">Диагностика:</h2>
        <p>Текущий путь: {typeof window !== 'undefined' ? window.location.pathname : 'server'}</p>
        <p>Base URL: {typeof window !== 'undefined' ? window.location.origin : ''}</p>
      </div>
    </div>
  );
}