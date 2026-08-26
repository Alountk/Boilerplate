#!/usr/bin/env bash
# tools/seed-demo.sh — Seeds the database with a demo user and 10 videogame listings.
#
# DANGER: this script TRUNCATEs the Videogames table. It is meant for local
# development and demo environments only. Never point it at a production DB.
#
# Usage:
#   PG_PASS=<password> bash tools/seed-demo.sh
#   PG_PASS=<password> API_URL=http://localhost:5017 bash tools/seed-demo.sh
#
# Environment variables (all optional except PG_PASS):
#   API_URL  - API base URL            (default: http://localhost:5017)
#   PG_HOST  - PostgreSQL host         (default: localhost)
#   PG_PORT  - PostgreSQL port         (default: 5432)
#   PG_DB    - PostgreSQL database     (default: videogamesdb)
#   PG_USER  - PostgreSQL user         (default: videogames)
#   PG_PASS  - PostgreSQL password     (REQUIRED, no default)
#   DEMO_EMAIL    - demo user email    (default: demo@vmarket.app)
#   DEMO_PASSWORD - demo user password (default: Demo1234!)
#
# Prerequisites: curl, jq, psql

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
API_URL="${API_URL:-http://localhost:5017}"

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_DB="${PG_DB:-videogamesdb}"
PG_USER="${PG_USER:-videogames}"
export PGPASSWORD="${PG_PASS:-}"

DEMO_EMAIL="${DEMO_EMAIL:-demo@vmarket.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-Demo1234!}"

if [[ -z "$PGPASSWORD" ]]; then
  echo "ERROR: PG_PASS es obligatorio. Ejemplo:" >&2
  echo "  PG_PASS=tu_password bash tools/seed-demo.sh" >&2
  exit 1
fi

# ── Dependency check ─────────────────────────────────────────────────────────
for cmd in curl jq psql; do
  command -v "$cmd" &>/dev/null || {
    echo "ERROR: '$cmd' es necesario pero no está instalado." >&2
    exit 1
  }
done

# ── Helpers ──────────────────────────────────────────────────────────────────
pg() {
  psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -q "$@"
}

create_game() {
  local title="$1"
  local json="$2"
  local resp code body

  resp=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/Videogames" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$json")
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | head -n -1)

  if [[ "$code" == "201" || "$code" == "200" ]]; then
    echo "  ✓ $title"
  else
    echo "  ✗ $title (HTTP $code): $body" >&2
  fi
}

# ── 1. API health check ───────────────────────────────────────────────────────
echo ""
echo "=== 1. Verificando que la API está activa en $API_URL ==="
if ! curl -sf "${API_URL}/api/Health" &>/dev/null; then
  echo ""
  echo "ERROR: La API no responde en $API_URL." >&2
  echo "Asegúrate de que esté corriendo antes de ejecutar este script (make run-api)." >&2
  exit 1
fi
echo "✓ API activa"

# ── 2. Limpiar videojuegos existentes ────────────────────────────────────────
echo ""
echo "=== 2. Limpiando videojuegos existentes ==="
pg -c 'TRUNCATE "Videogames" CASCADE;'
echo "✓ Videojuegos eliminados"

# ── 3. Registrar usuario demo ─────────────────────────────────────────────────
echo ""
echo "=== 3. Registrando usuario demo ($DEMO_EMAIL) ==="
REG_BODY=$(jq -n \
  --arg fn "Demo" --arg ln "User" \
  --arg email "$DEMO_EMAIL" --arg pwd "$DEMO_PASSWORD" \
  '{firstName:$fn,lastName:$ln,email:$email,password:$pwd,address:"Calle Demo 1",city:"Barcelona",country:"Spain",phone:"+34600000000"}')

REG_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/api/Users" \
  -H "Content-Type: application/json" -d "$REG_BODY")

if [[ "$REG_HTTP" == "201" ]]; then
  echo "✓ Usuario demo creado"
elif [[ "$REG_HTTP" == "400" ]]; then
  echo "~ El usuario ya existía, continuando..."
else
  echo "ERROR: No se pudo registrar el usuario (HTTP $REG_HTTP)" >&2
  exit 1
fi

# ── 4. Verificar email en BD ──────────────────────────────────────────────────
echo ""
echo "=== 4. Activando verificación de email en BD ==="
pg -c "UPDATE \"Users\" SET \"EmailVerified\" = true WHERE \"Email\" = '$DEMO_EMAIL';"
echo "✓ Email verificado"

# ── 5. Login → JWT ────────────────────────────────────────────────────────────
echo ""
echo "=== 5. Obteniendo JWT ==="
LOGIN_BODY=$(jq -n --arg e "$DEMO_EMAIL" --arg p "$DEMO_PASSWORD" '{email:$e,password:$p}')
LOGIN_RESP=$(curl -sf -X POST "${API_URL}/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_BODY")

TOKEN=$(echo "$LOGIN_RESP" | jq -r '.token')

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "ERROR: No se obtuvo token JWT. Respuesta: $LOGIN_RESP" >&2
  exit 1
fi
echo "✓ JWT obtenido"

# ── 6. Crear 10 videojuegos ───────────────────────────────────────────────────
echo ""
echo "=== 6. Creando 10 videojuegos demo ==="

# 1 — The Legend of Zelda: Breath of the Wild (Nintendo Switch)
create_game "The Legend of Zelda: Breath of the Wild — Nintendo Switch" \
  "$(jq -n '{
    englishName:"The Legend of Zelda: Breath of the Wild",
    names:[
      {name:"The Legend of Zelda: Breath of the Wild",language:"en"},
      {name:"Zelda: Aliento de la Naturaleza",language:"es"}
    ],
    qr:"",codebar:"045496590420",console:"Nintendo Switch",
    assets:[],images:[],state:1,
    releaseDate:"2017-03-03T00:00:00Z",versionGame:"1.6.0",
    description:"Una aventura de mundo abierto en la vasta tierra de Hyrule. Explora libremente, resuelve puzles y descubre secretos en esta obra maestra de Nintendo. Incluye todos los DLC.",
    urlImg:"https://media.rawg.io/media/games/cc3/cc3f1da19de2499e981c88a7f099a1b4.jpg",
    generalState:9.0,averagePrice:55.00,ownPrice:49.99,
    acceptOffersRange:10.0,score:9.8,category:2,contents:[]
  }')"

# 2 — God of War (PlayStation 4)
create_game "God of War — PlayStation 4" \
  "$(jq -n '{
    englishName:"God of War",
    names:[
      {name:"God of War",language:"en"},
      {name:"God of War",language:"es"}
    ],
    qr:"",codebar:"711719517498",console:"PlayStation 4",
    assets:[],images:[],state:1,
    releaseDate:"2018-04-20T00:00:00Z",versionGame:"1.0",
    description:"Kratos y su hijo Atreus emprenden un viaje por la mitología nórdica. Una obra maestra de narrativa y combate que redefine el género de acción-aventura.",
    urlImg:"https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be73.jpg",
    generalState:9.5,averagePrice:30.00,ownPrice:27.99,
    acceptOffersRange:5.0,score:9.7,category:0,contents:[]
  }')"

# 3 — Super Mario Odyssey (Nintendo Switch)
create_game "Super Mario Odyssey — Nintendo Switch" \
  "$(jq -n '{
    englishName:"Super Mario Odyssey",
    names:[
      {name:"Super Mario Odyssey",language:"en"},
      {name:"Super Mario Odyssey",language:"es"}
    ],
    qr:"",codebar:"045496590741",console:"Nintendo Switch",
    assets:[],images:[],state:1,
    releaseDate:"2017-10-27T00:00:00Z",versionGame:"1.3.0",
    description:"Acompaña a Mario en una aventura mundial para rescatar a la princesa Peach. Captura enemigos con la gorra Cappy para usar sus habilidades. Un 3D-platformer sin igual.",
    urlImg:"https://media.rawg.io/media/games/267/267bd0dbc496f52692487d07d014c362.jpg",
    generalState:9.0,averagePrice:50.00,ownPrice:44.99,
    acceptOffersRange:7.0,score:9.5,category:2,contents:[]
  }')"

# 4 — The Last of Us Remastered (PlayStation 4)
create_game "The Last of Us Remastered — PlayStation 4" \
  "$(jq -n '{
    englishName:"The Last of Us Remastered",
    names:[
      {name:"The Last of Us Remastered",language:"en"},
      {name:"The Last of Us Remasterizado",language:"es"}
    ],
    qr:"",codebar:"711719063629",console:"PlayStation 4",
    assets:[],images:[],state:1,
    releaseDate:"2014-07-29T00:00:00Z",versionGame:"1.11",
    description:"Una aventura post-apocalíptica en impresionante 1080p. Un viaje de supervivencia y humanidad a través de un mundo devastado. Considerado uno de los mejores juegos de la historia.",
    urlImg:"https://media.rawg.io/media/games/a5a/a5abaa1b5cc1567b026b7240f606f7e8.jpg",
    generalState:9.5,averagePrice:25.00,ownPrice:22.00,
    acceptOffersRange:5.0,score:9.6,category:0,contents:[]
  }')"

# 5 — Red Dead Redemption 2 (PlayStation 4)
create_game "Red Dead Redemption 2 — PlayStation 4" \
  "$(jq -n '{
    englishName:"Red Dead Redemption 2",
    names:[
      {name:"Red Dead Redemption 2",language:"en"},
      {name:"Red Dead Redemption 2",language:"es"}
    ],
    qr:"",codebar:"710425474521",console:"PlayStation 4",
    assets:[],images:[],state:1,
    releaseDate:"2018-10-26T00:00:00Z",versionGame:"1.14",
    description:"Una épica historia de forajidos en el corazón de la América sin ley. Lealtad, honor y un mundo en constante cambio que no espera a nadie. La experiencia de mundo abierto definitiva.",
    urlImg:"https://media.rawg.io/media/games/511/5118aff5091a1d002b1b97d77636a3bc.jpg",
    generalState:8.5,averagePrice:35.00,ownPrice:29.99,
    acceptOffersRange:10.0,score:9.4,category:0,contents:[]
  }')"

# 6 — Halo: The Master Chief Collection (Xbox One)
create_game "Halo: The Master Chief Collection — Xbox One" \
  "$(jq -n '{
    englishName:"Halo: The Master Chief Collection",
    names:[
      {name:"Halo: The Master Chief Collection",language:"en"}
    ],
    qr:"",codebar:"885370861174",console:"Xbox One",
    assets:[],images:[],state:1,
    releaseDate:"2014-11-11T00:00:00Z",versionGame:"1.2314.0",
    description:"Seis juegos, seis aventuras. La experiencia definitiva del Master Chief con Halo 1, 2, 3, 4 y Halo 3 ODST. Multijugador remasterizado incluido.",
    urlImg:"https://media.rawg.io/media/games/4e6/4e6e8e7f50c237d76f38f3c885dae3d2.jpg",
    generalState:8.5,averagePrice:40.00,ownPrice:35.00,
    acceptOffersRange:8.0,score:9.2,category:1,contents:[]
  }')"

# 7 — Hollow Knight (Nintendo Switch)
create_game "Hollow Knight — Nintendo Switch" \
  "$(jq -n '{
    englishName:"Hollow Knight",
    names:[
      {name:"Hollow Knight",language:"en"}
    ],
    qr:"",codebar:"",console:"Nintendo Switch",
    assets:[],images:[],state:1,
    releaseDate:"2018-06-12T00:00:00Z",versionGame:"1.5.78",
    description:"Una desafiante y hermosa aventura de acción a través de un vasto reino en ruinas habitado por insectos. Explora cavernas retorcidas, descubre historia antigua y domina el combate.",
    urlImg:"https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg",
    generalState:9.5,averagePrice:20.00,ownPrice:17.99,
    acceptOffersRange:5.0,score:9.1,category:2,contents:[]
  }')"

# 8 — Forza Horizon 5 (Xbox Series X)
create_game "Forza Horizon 5 — Xbox Series X" \
  "$(jq -n '{
    englishName:"Forza Horizon 5",
    names:[
      {name:"Forza Horizon 5",language:"en"}
    ],
    qr:"",codebar:"889842870800",console:"Xbox Series X",
    assets:[],images:[],state:1,
    releaseDate:"2021-11-09T00:00:00Z",versionGame:"3.614.967",
    description:"Tu aventura Horizon definitiva en un mundo abierto con los paisajes más variados de México. Carreras, colecciones y eventos sin fin en el festival de conducción más grande del mundo.",
    urlImg:"https://media.rawg.io/media/games/9cc/9cc11e2e81f8e38e97ab2192ef6d3e6e.jpg",
    generalState:9.5,averagePrice:70.00,ownPrice:64.99,
    acceptOffersRange:10.0,score:9.2,category:1,contents:[]
  }')"

# 9 — Pokemon Scarlet (Nintendo Switch)
create_game "Pokemon Scarlet — Nintendo Switch" \
  "$(jq -n '{
    englishName:"Pokemon Scarlet",
    names:[
      {name:"Pokemon Scarlet",language:"en"},
      {name:"Pokemon Escarlata",language:"es"}
    ],
    qr:"",codebar:"045496510442",console:"Nintendo Switch",
    assets:[],images:[],state:1,
    releaseDate:"2022-11-18T00:00:00Z",versionGame:"1.3.2",
    description:"Explora la región de Paldea en un RPG Pokemon de mundo abierto. Descubre nuevas criaturas en una historia de tres caminos únicos. La nueva generación del universo Pokemon.",
    urlImg:"https://media.rawg.io/media/games/73e/73eecb8909e0c39fb246f457b5d6cbbe.jpg",
    generalState:7.5,averagePrice:60.00,ownPrice:55.00,
    acceptOffersRange:8.0,score:7.8,category:2,contents:[]
  }')"

# 10 — Marvel's Spider-Man (PlayStation 4)
create_game "Marvels Spider-Man — PlayStation 4" \
  "$(jq -n '{
    englishName:"Marvels Spider-Man",
    names:[
      {name:"Marvels Spider-Man",language:"en"},
      {name:"Spider-Man de Marvel",language:"es"}
    ],
    qr:"",codebar:"711719336785",console:"PlayStation 4",
    assets:[],images:[],state:1,
    releaseDate:"2018-09-07T00:00:00Z",versionGame:"1.17",
    description:"Recorre Nueva York como un experimentado Peter Parker con movimientos acrobáticos únicos. Una aventura de superhéroes que redefine el género con una narrativa impresionante.",
    urlImg:"https://media.rawg.io/media/games/9aa/9aa42d16d425fa6f179fc9dc2f763647.jpg",
    generalState:9.0,averagePrice:30.00,ownPrice:26.99,
    acceptOffersRange:7.0,score:9.3,category:0,contents:[]
  }')"

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo "=== Seed completado ==="
echo ""
echo "Credenciales del usuario demo:"
echo "  Email:      $DEMO_EMAIL"
echo "  Contraseña: $DEMO_PASSWORD"
echo ""
