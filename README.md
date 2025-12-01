# AwanKu - Aplikasi Cuaca Real-time

AwanKu adalah aplikasi web modern untuk melihat perkiraan cuaca saat ini, per jam, dan 10 hari mendatang. Aplikasi ini dirancang dengan antarmuka yang bersih, responsif, dan dilengkapi dengan fitur tema gelap/terang serta fungsi pencarian lokasi yang cepat.

## Fitur Utama

Fitur-fitur utama aplikasi ini meliputi:

<img width="2541" height="1189" alt="1" src="https://github.com/user-attachments/assets/7885108c-e647-45ec-979b-8082405cbb38" />
<img width="2531" height="1188" alt="2" src="https://github.com/user-attachments/assets/dd359466-ca30-4aeb-83e5-7721255a167b" />

* **Data Cuaca Lengkap**
    * **Cuaca Saat Ini**: Menampilkan suhu besar, suhu min/maks, deskripsi cuaca (misalnya, Hujan Badai), dan suhu yang "terasa seperti".
    * **Perkiraan Per Jam**: Menampilkan data cuaca (waktu, ikon, suhu, kelembaban) untuk 12 jam berikutnya.
    * **Perkiraan 10 Hari**: Menampilkan perkiraan cuaca harian (hari, ikon, suhu maks/min) untuk 10 hari mendatang.
    * **Sorotan Hari Ini**: Detail cuaca seperti Kecepatan Angin, Kelembaban, Indeks UV, Matahari Terbenam, AQI (Air Quality Index), dan Curah Hujan.
* **Pengaturan Pengguna & Interaksi**
    * **Pencarian Lokasi**: Mencari lokasi secara real-time dengan saran otomatis (menggunakan Nominatim OpenStreetMap).
    * **Sistem Favorit**: Menyimpan dan memuat lokasi favorit ke `localStorage` browser.
    * **Lokasi Lain**: Menampilkan cuaca singkat untuk beberapa kota besar lainnya yang dapat dimuat dengan cepat.
    * **Tombol Peta**: Membuka lokasi cuaca saat ini pada OpenStreetMap.
    * **Toggle Tema**: Mengubah tema antarmuka antara **Gelap** (default) dan **Terang**.
    * **Toggle Satuan Suhu**: Mengubah satuan suhu antara **Celsius (°C)** dan **Fahrenheit (°F)**.
    * **Geolokasi**: Mampu mendeteksi dan menampilkan cuaca lokasi pengguna saat ini (jika diizinkan).

* **Frontend:**
    * HTML5
    * JavaScript (Vanilla JS)
    * Tailwind CSS
    * Font Awesome (untuk ikon)
* **Backend / API:**
    * **Data Cuaca:** [Open-Meteo](https://open-meteo.com) (`api.open-meteo.com`)
    * **Geocoding/Pencarian Lokasi:** [Nominatim OpenStreetMap](https://nominatim.openstreetmap.org) (`nominatim.openstreetmap.org`)
    * **Proxy (Opsional):** File `api.php` disediakan sebagai proxy sederhana untuk mengamankan panggilan API, meskipun `script.js` saat ini melakukan panggilan API secara langsung.

## Instalasi dan Penggunaan

Untuk menjalankan aplikasi ini secara lokal, ikuti langkah-langkah berikut:

1.  **Kloning Repositori:**
    ```bash
    git clone [(https://github.com/DIMFAQ/TA-PPW6.git)]
    cd AwanKu
    ```
2.  **Jalankan Aplikasi:**
    * Karena aplikasi ini hanya terdiri dari file statis (HTML, CSS, JS), Anda cukup membuka file `index.html` langsung di browser Anda.
    * **Catatan:** Jika Anda ingin menggunakan file `api.php` sebagai proxy, Anda harus menjalankannya melalui server web lokal (seperti XAMPP, Laragon, atau sejenisnya) yang mendukung PHP.

3.  **Mulai Mencari:**
    * Setelah aplikasi dimuat, cuaca untuk lokasi terakhir atau lokasi default (Jakarta) akan ditampilkan.
    * Gunakan kolom pencarian di kanan atas untuk mencari lokasi baru.
