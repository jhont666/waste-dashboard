import React, { useState, useEffect } from 'react';
import './App.css';

// Ganti ini dengan URL Worker kamu yang sudah di-deploy ke Cloudflare
const API_URL = import.meta.env.PROD 
  ? 'https://waste-collection-worker.jhont3371.workers.dev/' 

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
  
  // Data referensi (dalam produksi, ini di-fetch dari API /api/locations, /api/waste-types, dll)
  const locations = [
    { id: 'loc1', name: 'RT 01' }, { id: 'loc2', name: 'RT 02' }, { id: 'loc3', name: 'RT 03' },
    { id: 'loc4', name: 'Area Taman' }, { id: 'loc5', name: 'Jalan Utama' }
  ];
  const wasteTypes = [
    { id: 'wt1', name: 'Organik' }, { id: 'wt2', name: 'Plastik' }, { id: 'wt3', name: 'Kertas' },
    { id: 'wt4', name: 'Logam' }, { id: 'wt5', name: 'Campuran' }
  ];
  const collectors = [
    { id: 'u2', name: 'Budi' }, { id: 'u3', name: 'Siti' }, { id: 'u4', name: 'Eko' }
  ];

  // Fetch data dari Worker
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/collections`);
      const data = await res.json();
      setCollections(data.results || data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      // Jika API belum nyala, gunakan data dummy untuk preview UI
      setCollections([
        { id: 1, location: 'RT 01', waste_type: 'Organik', quantity: 5, unit: 'kg', collector: 'Budi', date: '2023-10-25' },
        { id: 2, location: 'Area Taman', waste_type: 'Plastik', quantity: 3, unit: 'kg', collector: 'Siti', date: '2023-10-25' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert('Data berhasil disimpan!');
        setForm({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
        fetchData(); // Refresh data
      } else {
        alert('Gagal menyimpan data');
      }
    } catch (err) {
      console.error(err);
      alert('Error koneksi ke server');
    }
  };

  // Hitung Statistik Dasar
  const totalKg = collections.reduce((acc, c) => acc + (c.unit === 'kg' ? Number(c.quantity) : 0), 0);
  const totalEntries = collections.length;

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>♻️ Dashboard Sampah</h1>
          <p>Karang Taruna Sukabumi</p>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Admin: Fadhil</div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button className={`tab ${activeTab === 'entries' ? 'active' : ''}`} onClick={() => setActiveTab('entries')}>Data</button>
        <button className={`tab ${activeTab === 'input' ? 'active' : ''}`} onClick={() => setActiveTab('input')}>Input</button>
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Koleksi (Kg)</h3>
              <div className="value">{totalKg.toFixed(1)}</div>
            </div>
            <div className="stat-card">
              <h3>Jumlah Entri</h3>
              <div className="value">{totalEntries}</div>
            </div>
            <div className="stat-card">
              <h3>Lokasi Aktif</h3>
              <div className="value">{locations.length}</div>
            </div>
          </div>
          
          <div className="card">
            <h2>Distribusi Sampah Hari Ini</h2>
            {loading ? <div className="loading">Memuat data...</div> : (
              <div style={{ padding: '1rem', color: '#666' }}>
                {/* Nanti di sini kita integrasikan Chart.js / Recharts */}
                Grafik distribusi akan ditampilkan di sini (Organik, Plastik, dll)
              </div>
            )}
          </div>
        </>
      )}

      {/* ENTRIES TAB */}
      {activeTab === 'entries' && (
        <div className="card">
          <h2>Riwayat Pengumpulan</h2>
          {loading ? <div className="loading">Memuat data...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Lokasi</th>
                    <th>Tipe Sampah</th>
                    <th>Jumlah</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((c) => (
                    <tr key={c.id}>
                      <td>{c.date || c.collection_date}</td>
                      <td>{c.location || c.location_id}</td>
                      <td>{c.waste_type || c.waste_type_id}</td>
                      <td>{c.quantity} {c.unit}</td>
                      <td>{c.collector || c.collected_by_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* INPUT TAB */}
      {activeTab === 'input' && (
        <div className="card">
          <h2>Tambah Data Baru</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Lokasi</label>
              <select name="location_id" value={form.location_id} onChange={handleInputChange} required>
                <option value="">Pilih Lokasi</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            
            <div className="form-group">
              <label>Tipe Sampah</label>
              <select name="waste_type_id" value={form.waste_type_id} onChange={handleInputChange} required>
                <option value="">Pilih Tipe</option>
                {wasteTypes.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Jumlah</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleInputChange} required min="0" step="0.1" />
            </div>

            <div className="form-group">
              <label>Satuan</label>
              <select name="unit" value={form.unit} onChange={handleInputChange}>
                <option value="kg">Kg</option>
                <option value="bucket">Bucket</option>
                <option value="karung">Karung</option>
              </select>
            </div>

            <div className="form-group">
              <label>Petugas</label>
              <select name="collected_by_id" value={form.collected_by_id} onChange={handleInputChange} required>
                <option value="">Pilih Petugas</option>
                {collectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal</label>
              <input type="date" name="collection_date" value={form.collection_date} onChange={handleInputChange} required />
            </div>

            <div className="form-group full">
              <label>Catatan (Opsional)</label>
              <textarea name="notes" value={form.notes} onChange={handleInputChange} rows="2" placeholder="Contoh: Sampah menumpuk di selokan"></textarea>
            </div>

            <div className="form-group full" style={{ marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Simpan Data</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
