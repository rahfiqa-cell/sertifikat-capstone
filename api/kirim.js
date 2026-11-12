const nodemailer = require("nodemailer");

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak diizinkan." });

  const { nama, jurusan, email, kode, pdf } = req.body || {};

  if (process.env.KODE_AKSES && kode !== process.env.KODE_AKSES)
    return res.status(403).json({ error: "Kode akses salah." });

  if (!nama || !jurusan || !email || !pdf)
    return res.status(400).json({ error: "Data belum lengkap." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)
    return res.status(400).json({ error: "Format email tidak valid." });
  if (nama.length > 80 || jurusan.length > 80)
    return res.status(400).json({ error: "Nama atau jurusan terlalu panjang." });
  if (pdf.length > 3_000_000)
    return res.status(413).json({ error: "Ukuran file terlalu besar." });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    await transporter.sendMail({
      from: `"Prodi Bisnis Digital UIN Bukittinggi" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Sertifikat Capstone Project 2026/2027 - Prodi Bisnis Digital",
      html: `<p>Halo <b>${esc(nama)}</b>,</p>
             <p>Terima kasih telah berpartisipasi dalam Capstone Project 2026/2027 Program Studi ${esc(jurusan)}.
             Sertifikat Anda terlampir pada email ini.</p>
             <p>Salam,<br>Prodi Bisnis Digital UIN Sjech M. Djamil Djambek Bukittinggi</p>`,
      attachments: [{
        filename: `Sertifikat-${nama.replace(/[^\w\- ]/g, "").trim() || "Peserta"}.pdf`,
        content: Buffer.from(pdf, "base64"),
        contentType: "application/pdf"
      }]
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Email gagal dikirim. Periksa pengaturan server." });
  }
};
