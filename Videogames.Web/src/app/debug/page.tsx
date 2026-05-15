'use client';

import { IMAGE_BASE_URL, API_BASE_URL, CONFIG } from '@/constants/config';
import { resolveFrontendAssetSrc, resolveVideogameImageSrc } from '@/utils/videogameImages';

export default function DebugPage() {
  const testAssetPath = 'assets/categories/playstation.jpg';
  const testImagePath = 'test-image.jpg';

  const resolvedAsset = resolveFrontendAssetSrc(testAssetPath);
  const resolvedImage = resolveVideogameImageSrc(testImagePath);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Debug: Environment Variables</h1>

        <div className="space-y-6">
          {/* Environment Variables */}
          <section className="bg-slate-800 rounded-lg p-6 border border-cyan-500">
            <h2 className="text-2xl font-semibold mb-4 text-cyan-400">Environment Variables</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">NEXT_PUBLIC_IMAGE_BASE_URL:</span>
                <span className={`text-lg font-bold ${IMAGE_BASE_URL ? 'text-green-400' : 'text-red-400'}`}>
                  {IMAGE_BASE_URL || '❌ NOT SET (empty string)'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">NEXT_PUBLIC_API_URL:</span>
                <span className="text-lg font-bold text-blue-400">{API_BASE_URL}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-400">NODE_ENV:</span>
                <span className="text-lg font-bold text-blue-400">{CONFIG.IS_DEVELOPMENT ? 'development' : 'production'}</span>
              </div>
            </div>
          </section>

          {/* URL Resolution Tests */}
          <section className="bg-slate-800 rounded-lg p-6 border border-yellow-500">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">URL Resolution Tests</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 mb-2">Test Asset Path: <span className="text-white font-mono">{testAssetPath}</span></p>
                <p className="text-gray-400 mb-1">Resolved Frontend Asset URL:</p>
                <p className="text-lg font-bold text-green-400 break-all">{resolvedAsset}</p>
              </div>
              <hr className="border-slate-600" />
              <div>
                <p className="text-gray-400 mb-2">Test Image Path: <span className="text-white font-mono">{testImagePath}</span></p>
                <p className="text-gray-400 mb-1">Resolved Videogame Image URL:</p>
                <p className="text-lg font-bold text-blue-400 break-all">{resolvedImage}</p>
              </div>
            </div>
          </section>

          {/* Diagnosis */}
          <section className="bg-slate-800 rounded-lg p-6 border border-red-500">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Diagnosis</h2>
            <div className="space-y-3">
              {IMAGE_BASE_URL ? (
                <div className="bg-green-900 border border-green-400 rounded p-4">
                  <p className="text-green-400 font-semibold">✅ IMAGE_BASE_URL is set</p>
                  <p className="text-green-200 text-sm mt-2">
                    Frontend assets should resolve to: <span className="font-mono font-bold">{IMAGE_BASE_URL}/assets/...</span>
                  </p>
                </div>
              ) : (
                <div className="bg-red-900 border border-red-400 rounded p-4">
                  <p className="text-red-400 font-semibold">❌ IMAGE_BASE_URL is NOT set</p>
                  <p className="text-red-200 text-sm mt-2">
                    Frontend assets will fall back to: <span className="font-mono font-bold">/assets/...</span>
                  </p>
                  <p className="text-red-300 text-sm mt-2">
                    Check Arcane/Portainer environment variables: <span className="font-mono">NEXT_PUBLIC_IMAGE_BASE_URL</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Instructions */}
          <section className="bg-slate-800 rounded-lg p-6 border border-purple-500">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Troubleshooting</h2>
            <ol className="space-y-3 text-sm">
              <li>
                <span className="font-semibold text-purple-300">1. Check Arcane/Portainer Stack Variables:</span>
                <p className="text-gray-300 mt-1 ml-4">Ensure <span className="font-mono bg-slate-900 px-2 py-1">NEXT_PUBLIC_IMAGE_BASE_URL</span> is set in the stack environment variables.</p>
              </li>
              <li>
                <span className="font-semibold text-purple-300">2. Check Browser DevTools Console:</span>
                <p className="text-gray-300 mt-1 ml-4">Open DevTools (F12) → Console tab to see detailed logs from <span className="font-mono bg-slate-900 px-2 py-1">resolveFrontendAssetSrc()</span></p>
              </li>
              <li>
                <span className="font-semibold text-purple-300">3. Force Rebuild & Redeploy:</span>
                <p className="text-gray-300 mt-1 ml-4">Trigger a new release in GitHub Actions to ensure the variable is injected at build-time.</p>
              </li>
              <li>
                <span className="font-semibold text-purple-300">4. Clear Browser Cache:</span>
                <p className="text-gray-300 mt-1 ml-4">Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5) to clear any cached old builds.</p>
              </li>
            </ol>
          </section>

          {/* Current Values Raw */}
          <section className="bg-slate-800 rounded-lg p-6 border border-gray-500">
            <h2 className="text-2xl font-semibold mb-4 text-gray-400">Raw Config Object</h2>
            <pre className="bg-slate-900 p-4 rounded text-xs overflow-auto text-gray-300">
              {JSON.stringify(CONFIG, null, 2)}
            </pre>
          </section>
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p className="text-sm">Remember to delete this page in production once you`&#39;`ve debugged the issue.</p>
        </div>
      </div>
    </div>
  );
}
