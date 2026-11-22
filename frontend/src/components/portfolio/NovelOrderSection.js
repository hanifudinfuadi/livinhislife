import React, { useState } from 'react';
import './NovelOrderSection.css';

const API = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8001');

const emptyForm = { name: '', email: '', phone: '', quantity: '1', address: '', message: '' };

const NovelOrderSection = ({ novelTitle, orderUrl }) => {
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setNotice('');
    const message = [
      `Pemesanan novel: ${novelTitle || '-'}`,
      `Jumlah: ${form.quantity || '1'}`,
      form.address ? `Alamat pengiriman: ${form.address}` : '',
      `Catatan: ${form.message || '-'}`,
    ].filter(Boolean).join('\n');
    try {
      const response = await fetch(`${API}/api/portfolio/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'novel_order',
          subject: `Pemesanan Novel — ${novelTitle || ''}`,
          name: form.name,
          email: form.email,
          phone: form.phone,
          details: { novel: novelTitle || '', quantity: form.quantity || '1', address: form.address || '' },
          message,
        }),
      });
      if (!response.ok) throw new Error();
      setForm(emptyForm);
      setNotice('Pesanan terkirim. Terima kasih! Saya akan segera menghubungi Anda untuk konfirmasi.');
    } catch {
      setNotice('Pesanan belum dapat dikirim. Silakan coba lagi nanti.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="novel-order" id="pemesanan-novel">
      <div className="novel-order-inner">
        <h2 className="novel-order-title">Pemesanan Novel</h2>
        <p className="novel-order-desc">
          Tertarik untuk memiliki <strong>{novelTitle || 'novel ini'}</strong>? Isi detail pemesanan di bawah ini.
          Data pesanan Anda akan masuk ke saya dan saya akan menghubungi Anda untuk konfirmasi lebih lanjut.
        </p>

        {orderUrl && (
          <a
            className="novel-order-link"
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka tautan pemesanan resmi →
          </a>
        )}

        <form className="novel-order-form" onSubmit={submit}>
          <div className="novel-order-row">
            <label>Nama<input required value={form.name} onChange={update('name')} placeholder="Nama lengkap" /></label>
            <label>Email<input type="email" required value={form.email} onChange={update('email')} placeholder="nama@email.com" /></label>
          </div>
          <div className="novel-order-row">
            <label>Nomor WhatsApp<input required value={form.phone} onChange={update('phone')} placeholder="08xxxxxxxxxx" /></label>
            <label>Jumlah<input type="number" min="1" required value={form.quantity} onChange={update('quantity')} /></label>
          </div>
          <label>Alamat pengiriman<textarea rows="3" value={form.address} onChange={update('address')} placeholder="Alamat lengkap untuk pengiriman" /></label>
          <label>Catatan<textarea rows="3" value={form.message} onChange={update('message')} placeholder="Permintaan khusus, tanda tangan penulis, dll." /></label>
          <button type="submit" className="novel-order-btn" disabled={sending}>
            {sending ? 'Mengirim…' : 'Kirim pesanan →'}
          </button>
          {notice && <p role="status" className="novel-order-notice">{notice}</p>}
        </form>
      </div>
    </section>
  );
};

export default NovelOrderSection;