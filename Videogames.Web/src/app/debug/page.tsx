'use client';

import BlueprintGrid from '@/components/theme/BlueprintGrid';
import TitleBlock from '@/components/theme/TitleBlock';
import { IMAGE_BASE_URL, API_BASE_URL, CONFIG } from '@/constants/config';
import { resolveFrontendAssetSrc, resolveVideogameImageSrc } from '@/utils/videogameImages';

export default function DebugPage() {
  const testAssetPath = 'assets/categories/playstation.jpg';
  const testImagePath = 'test-image.jpg';

  const resolvedAsset = resolveFrontendAssetSrc(testAssetPath);
  const resolvedImage = resolveVideogameImageSrc(testImagePath);

  return (
    <BlueprintGrid className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto max-w-4xl px-4 pt-4">
        <TitleBlock code="VMKT-BP-DBG" rev="D" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-secondary">
          Debug: Environment Variables
        </h1>

        <div className="space-y-6">
          {/* Environment Variables */}
          <section className="border border-secondary/50 bg-surface-1/40 p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-secondary">Environment Variables</h2>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-muted">NEXT_PUBLIC_IMAGE_BASE_URL:</span>
                <span className={`text-lg font-bold ${IMAGE_BASE_URL ? 'text-success' : 'text-error'}`}>
                  {IMAGE_BASE_URL || '❌ NOT SET (empty string)'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-muted">NEXT_PUBLIC_API_URL:</span>
                <span className="text-lg font-bold text-secondary">{API_BASE_URL}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-muted">NODE_ENV:</span>
                <span className="text-lg font-bold text-secondary">{CONFIG.IS_DEVELOPMENT ? 'development' : 'production'}</span>
              </div>
            </div>
          </section>

          {/* URL Resolution Tests */}
          <section className="border border-warning/50 bg-surface-1/40 p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-warning">URL Resolution Tests</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-on-surface-muted">Test Asset Path: <span className="font-mono text-on-surface">{testAssetPath}</span></p>
                <p className="mb-1 text-on-surface-muted">Resolved Frontend Asset URL:</p>
                <p className="break-all text-lg font-bold text-success">{resolvedAsset}</p>
              </div>
              <hr className="border-outline" />
              <div>
                <p className="mb-2 text-on-surface-muted">Test Image Path: <span className="font-mono text-on-surface">{testImagePath}</span></p>
                <p className="mb-1 text-on-surface-muted">Resolved Videogame Image URL:</p>
                <p className="break-all text-lg font-bold text-secondary">{resolvedImage}</p>
              </div>
            </div>
          </section>

          {/* Diagnosis */}
          <section className="border border-error/50 bg-surface-1/40 p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-error">Diagnosis</h2>
            <div className="space-y-3">
              {IMAGE_BASE_URL ? (
                <div className="rounded border border-success/40 bg-success/10 p-4">
                  <p className="font-semibold text-success">✅ IMAGE_BASE_URL is set</p>
                  <p className="mt-2 text-sm text-success/80">
                    Frontend assets should resolve to: <span className="font-mono font-bold">{IMAGE_BASE_URL}/assets/...</span>
                  </p>
                </div>
              ) : (
                <div className="rounded border border-error/40 bg-error/10 p-4">
                  <p className="font-semibold text-error">❌ IMAGE_BASE_URL is NOT set</p>
                  <p className="mt-2 text-sm text-error/80">
                    Frontend assets will fall back to: <span className="font-mono font-bold">/assets/...</span>
                  </p>
                  <p className="mt-2 text-sm text-error/80">
                    Check Arcane/Portainer environment variables: <span className="font-mono">NEXT_PUBLIC_IMAGE_BASE_URL</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Instructions */}
          <section className="border border-outline bg-surface-1/40 p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-on-surface-muted">Troubleshooting</h2>
            <ol className="space-y-3 text-sm">
              <li>
                <span className="font-semibold text-on-surface">1. Check Arcane/Portainer Stack Variables:</span>
                <p className="mt-1 ml-4 text-on-surface-muted">Ensure <span className="border border-outline bg-surface-2/60 px-2 py-1 font-mono">NEXT_PUBLIC_IMAGE_BASE_URL</span> is set in the stack environment variables.</p>
              </li>
              <li>
                <span className="font-semibold text-on-surface">2. Check Browser DevTools Console:</span>
                <p className="mt-1 ml-4 text-on-surface-muted">Open DevTools (F12) → Console tab to see detailed logs from <span className="font-mono">resolveFrontendAssetSrc()</span></p>
              </li>
              <li>
                <span className="font-semibold text-on-surface">3. Force Rebuild & Redeploy:</span>
                <p className="mt-1 ml-4 text-on-surface-muted">Trigger a new release in GitHub Actions to ensure the variable is injected at build-time.</p>
              </li>
              <li>
                <span className="font-semibold text-on-surface">4. Clear Browser Cache:</span>
                <p className="mt-1 ml-4 text-on-surface-muted">Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5) to clear any cached old builds.</p>
              </li>
            </ol>
          </section>

          {/* Current Values Raw */}
          <section className="border border-outline bg-surface-1/40 p-6">
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-on-surface-muted">Raw Config Object</h2>
            <pre className="overflow-auto rounded border border-outline bg-surface-2/60 p-4 font-mono text-xs text-on-surface-muted">
              {JSON.stringify(CONFIG, null, 2)}
            </pre>
          </section>
        </div>

        <div className="mt-8 text-center text-on-surface-muted">
          <p className="text-sm">Remember to delete this page in production once you`&#39;`ve debugged the issue.</p>
        </div>
      </div>
    </BlueprintGrid>
  );
}
