"""Convierte el GeoJSON de CCAA en paths SVG simplificados para el juego de elecciones.

Uso:
    curl -sSLo ccaa.json https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-communities.geojson
    python3 dev/tools/build_map.py ccaa.json elecciones/data/mapa.js

Proyección equirectangular con corrección cos(40º), Canarias en un recuadro abajo a la derecha,
simplificación Douglas-Peucker (0,9 px) y descarte de islotes de menos de 6 px².
"""
import json, math, sys

src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src))

IDS = {
    '01': 'and', '02': 'ara', '03': 'ast', '04': 'bal', '05': 'can', '06': 'cnt',
    '07': 'cyl', '08': 'clm', '09': 'cat', '10': 'val', '11': 'ext', '12': 'gal',
    '13': 'mad', '14': 'mur', '15': 'nav', '16': 'pvs', '17': 'rio', '18': 'ceu', '19': 'mel',
}

K = math.cos(math.radians(40))
LON0, LAT1 = -9.4, 43.85          # esquina superior izquierda (península)
S = 1000 / ((4.4 - LON0) * K)     # px por unidad proyectada

def proj(lon, lat):
    return ((lon - LON0) * K * S, (LAT1 - lat) * S)

# Canarias en recuadro abajo a la izquierda
C_LON0, C_LAT1, CS = -18.25, 29.5, 0.95
CX0, CY0 = 585, 680
def proj_can(lon, lat):
    k = math.cos(math.radians(28.5))
    return (CX0 + (lon - C_LON0) * k * S * CS, CY0 + (C_LAT1 - lat) * S * CS)

def dp(pts, tol):
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / n
        if d > dmax:
            imax, dmax = i, d
    if dmax > tol:
        return dp(pts[:imax + 1], tol)[:-1] + dp(pts[imax:], tol)
    return [a, b]

def area(pts):
    s = 0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return s / 2

def centroid(pts):
    a = area(pts) or 1e-9
    cx = cy = 0
    for i in range(len(pts)):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % len(pts)]
        f = x1 * y2 - x2 * y1
        cx += (x1 + x2) * f; cy += (y1 + y2) * f
    return cx / (6 * a), cy / (6 * a)

res = {}
for f in data['features']:
    cid = IDS[f['properties']['cod_ccaa']]
    g = f['geometry']
    polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    pr = proj_can if cid == 'can' else proj
    rings = []
    for poly in polys:
        ring = [pr(x, y) for x, y in poly[0]]
        a = abs(area(ring))
        tiny = cid in ('ceu', 'mel')
        if not tiny and a < 6:
            continue
        tol = 0.03 if tiny else 0.9
        far = max(range(len(ring)), key=lambda i: math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1]))
        simp = dp(ring[:far + 1], tol)[:-1] + dp(ring[far:], tol)
        if len(simp) >= 4:
            rings.append((a, simp))
    rings.sort(key=lambda r: -r[0])
    d = ''
    for _, r in rings:
        d += 'M' + 'L'.join('%.1f,%.1f' % p for p in r[:-1]) + 'Z'
    cx, cy = centroid(rings[0][1])
    res[cid] = {'d': d, 'cx': round(cx, 1), 'cy': round(cy, 1)}

allpts = [float(v) for r in res.values() for seg in r['d'].replace('M', ' ').replace('L', ' ').replace('Z', ' ').split() for v in seg.split(',')]
xs, ys = allpts[0::2], allpts[1::2]
print('bbox', min(xs), min(ys), max(xs), max(ys), file=sys.stderr)

with open(out, 'w') as fh:
    fh.write('// Generado por dev/tools/build_map.py a partir de click_that_hood (spain-communities.geojson).\n')
    fh.write('// No editar a mano.\n')
    fh.write('window.MAPA_PATHS = ' + json.dumps(res, separators=(',', ':')) + ';\n')
print('bytes', sum(len(r['d']) for r in res.values()), file=sys.stderr)
