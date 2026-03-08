#!/bin/bash
# Script untuk install semua package ke Piston
# Jalankan sekali setelah `docker-compose up -d`

PISTON_URL="http://localhost:2000"

echo "Menunggu Piston API siap..."
until curl -sf "$PISTON_URL/api/v2/runtimes" > /dev/null; do
  sleep 2
done
echo "Piston API siap."

install_package() {
  local lang=$1
  local version=$2
  echo "Installing $lang $version..."
  curl -s -X POST "$PISTON_URL/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{\"language\": \"$lang\", \"version\": \"$version\"}" | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print('OK:', d.get('language',''), d.get('version','')) if 'language' in d else print('Error:', d)"
}

install_package "python" "3.12.0"
install_package "node"   "20.11.1"
install_package "java"   "15.0.2"
install_package "go"     "1.16.2"
install_package "rust"   "1.68.2"
install_package "php"    "8.2.3"

echo ""
echo "Selesai! Cek package yang terinstall:"
curl -s "$PISTON_URL/api/v2/runtimes" | python3 -c "
import sys, json
runtimes = json.load(sys.stdin)
for r in runtimes:
    print(f\"  - {r['language']} {r['version']}\")
"
