#!/usr/bin/env bash
# Monta el sitio de GitHub Pages en el directorio indicado: origin/main en la raíz y cada rama
# origin/test/* y origin/claude/* en test/<rama-con-guiones>/. Lo usa .github/workflows/pages.yml.
#
# Probar en local:  git fetch origin && bash .github/scripts/montar-sitio.sh /tmp/sitio
set -euo pipefail

destino=${1:?Uso: montar-sitio.sh <directorio>}
rm -rf "$destino"
mkdir -p "$destino/test"

git archive origin/main | tar -x -C "$destino"

lista=""
while read -r ref; do
  rama=${ref#origin/}
  case "$rama" in
    test/*|claude/*) ;;
    *) continue ;;
  esac
  carpeta=${rama//\//-}
  mkdir -p "$destino/test/$carpeta"
  git archive "$ref" | tar -x -C "$destino/test/$carpeta"
  fecha=$(git log -1 --format=%cs "$ref")
  lista+="<li><a href=\"$carpeta/\">$rama</a> <small>($fecha)</small></li>"
  echo "Rama de pruebas: $rama → test/$carpeta/"
done < <(git for-each-ref --format='%(refname:short)' refs/remotes/origin)

if [ -z "$lista" ]; then
  lista="<li>No hay ramas de pruebas.</li>"
fi

cat > "$destino/test/index.html" <<HTML
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>Ramas de pruebas · Mini Juegos</title>
  <link rel="stylesheet" href="../shared/base.css">
  <style>main { padding: 32px 16px; } li { margin: 10px 0; line-height: 1.5; }</style>
</head>
<body>
  <main class="container">
    <h1>Ramas de pruebas</h1>
    <p>Cada rama <code>test/*</code> o <code>claude/*</code> se publica aquí al hacer push.</p>
    <ul>$lista</ul>
    <p><a href="../">&larr; Sitio principal</a></p>
  </main>
</body>
</html>
HTML
