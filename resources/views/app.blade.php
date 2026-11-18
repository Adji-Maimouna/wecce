<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <meta name="description" content="Wecce : l'échange d'électronique par points, entre étudiants de l'UGB, avec la boutique LBC." />
    <meta name="theme-color" content="#e1ac10" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title inertia>Wecce</title>
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @viteReactRefresh
        @vite(['src/app/main.tsx'])
    @endif
    @inertiaHead
  </head>
  <body>
    @inertia
  </body>
</html>
