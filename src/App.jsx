import React, { useState, useEffect } from 'react';
import './App.css';

// Ganti dengan URL Worker kamu
const API_URL = 'https://waste-collection-worker.jhont3371.workers.dev';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
  
  const locations = [
    { id: 'loc1', name: 'RT 01' }, { id: 'loc2', name: 'RT 02' }, { id: 'loc3', name: 'Area Taman' }
  ];
  const wasteTypes = [
    { id: 'wt1', name: 'Organik' }, { id: 'wt2', name: 'Plastik' }, { id: 'wt3', name: 'Kertas' }
  ];
  const collectors = [
    { id: 'u2', name: 'Budi' }, { id: 'u3', name: 'Siti' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/collections`);
      const data = await res.json();
      
      // Perbaikan: Cek format data dari Worker
      if (data.results) {
        setCollections(data.results);
      } else if (Array.isArray(data)) {
        setCollections(data);
      } else {
        setCollections([]);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError("Gagal terhubung ke server API. Pastikan Worker sudah di-deploy dan URL sudah benar.");
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
      const res = await fetch(`${API_URL}/api/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        alert('Data berhasil disimpan!');
        setForm({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
        fetchData();
      } else {
        alert('Gagal menyimpan data');
      }
    } catch (err) {
      alert('Error koneksi ke server');
    }
  };

  const totalKg = collections.reduce((acc, c) => acc + (c.unit === 'kg' ? Number(c.quantity) : 0), 0);
  const totalEntries = collections.length;

  return (
    <div className="app">
       <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo KT" style={{ height: '50px', width: 'auto' }} />
          <div>
            <h1>Dashboard Pengelolaan Sampah</h1>
            <p>Karang Taruna Unit 05 Subang Jaya</p>
          </div>
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
          
          {error && <div className="card" style={{ color: 'red' }}>{error}</div>}

          <div className="card">
            <h2>Distribusi Sampah</h2>
            {loading ? <div className="loading">Memuat data...</div> : (
              collections.length === 0 ? <p>Belum ada data</p> : (
                <ul>
                  {collections.map((c) => (
                    <li key={c.id}>{c.location_name || c.location_id} - {c.waste_type_name || c.waste_type_id} ({c.quantity} {c.unit})</li>
                  ))}
                </ul>
              )
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
                      <td>{c.collection_date}</td>
                      <td>{c.location_name || c.location_id}</td>
                      <td>{c.waste_type_name || c.waste_type_id}</td>
                      <td>{c.quantity} {c.unit}</td>
                      <td>{c.collector_name || c.collected_by_id}</td>
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
              <label>Nama Petugas</label>
              <input 
                type="text" 
                name="collected_by_id" 
                value={form.collected_by_id} 
                onChange={handleInputChange} 
                required 
                placeholder="Tulis nama petugas..." 
              />
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
