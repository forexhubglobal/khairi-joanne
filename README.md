# 💍 Kad RSVP Online · KJ & Joanne

Kad jemputan digital Walimatul Urus, 29 Disember 2026, Jawhara Crystal Pavilion, Kuching.

## Fail
| Fail | Fungsi |
|---|---|
| `index.html` | Kad jemputan utama |
| `config.js` | **Tetapan**: kunci Supabase, masa, muzik |
| `style.css` / `app.js` | Reka bentuk & logik |
| `links.html` | Jana link peribadi tetamu + butang WhatsApp |
| `supabase.sql` | Skrip pangkalan data |

## Cuba secara lokal
Buka terminal dalam folder ini:
```
npx serve .
```
Kemudian buka `http://localhost:3000/?to=Encik%20Ali`

Tanpa Supabase, kad berjalan dalam **MOD DEMO** (data disimpan dalam browser sahaja).

## Setup Supabase (±10 minit)
1. Daftar di https://supabase.com, kemudian **New Project** (region: Singapore).
2. Pergi ke **SQL Editor**, tampal kandungan `supabase.sql` dan tekan **Run**.
3. Pergi ke **Project Settings → API**, salin **Project URL** dan **anon public key**.
4. Tampal kedua-duanya dalam `config.js`.
5. Siap! Tengok tetamu di **Table Editor → rsvp**, dan ucapan di **wishes**.

> Kunci `anon` memang selamat diletak di frontend. RLS memastikan tetamu hanya boleh *hantar* RSVP, dan tidak boleh *baca* no. telefon orang lain.

## Deploy (percuma)
- **Netlify Drop**: seret folder ini ke https://app.netlify.com/drop
- atau **Vercel** / **GitHub Pages**

## Benda yang perlu ditukar (cari `PLACEHOLDER`)
- Masa resepsi (`config.js`)
- Nama ibu bapa (`index.html`)
- Kisah cinta (timeline) & gambar galeri (`data-src="assets/1.jpg"`)
- Lagu (`musicUrl` dalam `config.js`)
