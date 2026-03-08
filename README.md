# Daffa Online Compiler

A self-hosted online code compiler powered by [Piston](https://github.com/engineer-man/piston).

## Requirements

- Docker
- Docker Compose

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/febriandfa/daffa-online-compiler.git
cd daffa-online-compiler
```

### 2. Start Containers

```bash
docker compose up -d
```

### 3. Install Language Runtimes

Setelah container berjalan, install runtime bahasa yang dibutuhkan:

#### JavaScript (Node.js)

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"node","version":"20.11.1"}'
```

#### Python

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"python","version":"3.12.0"}'
```

#### Java

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"java","version":"15.0.2"}'
```

#### Go

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"go","version":"1.16.2"}'
```

#### Rust

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"rust","version":"1.68.2"}'
```

#### PHP

```bash
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language":"php","version":"8.2.3"}'
```

### 4. Install Semua Sekaligus

Jalankan script berikut untuk install semua bahasa sekaligus:

```bash
for pkg in \
  '{"language":"javascript","version":"20.11.1"}' \
  '{"language":"python","version":"3.12.0"}' \
  '{"language":"java","version":"15.0.2"}' \
  '{"language":"go","version":"1.16.2"}' \
  '{"language":"rust","version":"1.68.2"}' \
  '{"language":"php","version":"8.2.3"}'; do
  curl -X POST http://localhost:2000/api/v2/packages \
    -H "Content-Type: application/json" \
    -d "$pkg"
  echo ""
done
```

### 5. Cek Package yang Tersedia

```bash
curl http://localhost:2000/api/v2/packages
```

### 6. Cek Runtime yang Terinstall

```bash
curl http://localhost:2000/api/v2/runtimes
```

### 6. Akses Aplikasi

Buka browser dan akses:

```
http://localhost:8081
```

## Supported Languages

| Language   | Version |
| ---------- | ------- |
| JavaScript | 20.11.1 |
| Python     | 3.12.0  |
| Java       | 15.0.2  |
| Go         | 1.16.2  |
| Rust       | 1.68.2  |
| PHP        | 8.2.3   |

## Notes

- Proses install runtime memakan waktu beberapa menit per bahasa
- Runtime yang diinstall tersimpan di folder `./piston` secara persisten
- Container akan otomatis restart jika server reboot
