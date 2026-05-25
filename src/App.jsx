import React, { useState, useEffect } from 'react';
import './App.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Ganti dengan URL Worker kamu
const API_URL = 'https://waste-collection-worker.jhont3371.workers.dev';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
  
  // State untuk Filter & Toast
  const [filterLocation, setFilterLocation] = useState('');
  const [filterWasteType, setFilterWasteType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [toast, setToast] = useState(''); // State untuk pesan pop-up

  const locations = [
    { id: 'loc1', name: 'RT 01' }, { id: 'loc2', name: 'RT 02' }, { id: 'loc3', name: 'RT 03' }, { id: 'loc4', name: 'RT 04' }, { id: 'loc5', name: 'RT 05' },
    { id: 'loc6', name: 'RT 06' }, { id: 'loc7', name: 'RT 07' }, { id: 'loc8', name: 'RT 08' }, { id: 'loc9', name: 'RT 09' }
  ];
  const wasteTypes = [
    { id: 'wt1', name: 'Organik' }, { id: 'wt2', name: 'Plastik' }, { id: 'wt3', name: 'Kertas' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk memunculkan Toast
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000); // Hilang setelah 3 detik
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/collections`);
      const data = await res.json();
      if (data.results) {
        setCollections(data.results);
      } else if (Array.isArray(data)) {
        setCollections(data);
      } else {
        setCollections([]);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError("Gagal terhubung ke server API.");
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
        showToast('✅ Data berhasil disimpan!'); // Ganti alert dengan Toast
        setForm({ location_id: '', waste_type_id: '', quantity: '', unit: 'kg', collected_by_id: '', collection_date: '', collection_time: '', notes: '' });
        fetchData();
      } else {
        showToast('❌ Gagal menyimpan data');
      }
    } catch (err) {
      showToast('❌ Error koneksi ke server');
    }
  };

  // ================= FUNGSI EXPORT EXCEL (CSV) =================
  const handleExportCSV = () => {
    if (filteredCollections.length === 0) {
      showToast('❌ Tidak ada data untuk di-export');
      return;
    }

    // Header kolom
    const headers = ['Tanggal', 'Lokasi', 'Tipe Sampah', 'Jumlah', 'Satuan', 'Petugas', 'Catatan'];
    
    // Ubah data jadi baris CSV
    const csvRows = filteredCollections.map(c => {
      return [
        c.collection_date,
        c.location_name || c.location_id,
        c.waste_type_name || c.waste_type_id,
        c.quantity,
        c.unit,
        c.collector_name || c.collected_by_id,
        c.notes || ''
      ].join(';'); // Pakai titik koma agar Excel Indonesia bisa baca kolomnya
    });

    // Gabungkan header dan baris
    const csvContent = [headers.join(';'), ...csvRows].join('\n');

    // Buat file dan download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Sampah_KT05_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('📥 File Excel berhasil diunduh!');
  };

  // ================= MENGHITUNG DATA UNTUK GRAFIK =================
  const wasteTypeData = wasteTypes.map(type => {
    const totalKg = collections
      .filter(c => (c.waste_type_name || c.waste_type_id) === type.name && c.unit === 'kg')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    return { name: type.name, value: totalKg };
  }).filter(d => d.value > 0);

  const locationData = locations.map(loc => {
    const totalKg = collections
      .filter(c => (c.location_name || c.location_id) === loc.name && c.unit === 'kg')
      .reduce((sum, c) => sum + Number(c.quantity), 0);
    return { name: loc.name, kg: totalKg };
  }).filter(d => d.kg > 0);

  // ================= LOGIKA FILTER DATA TABEL =================
  const filteredCollections = collections.filter(c => {
    const matchLocation = filterLocation ? (c.location_name || c.location_id) === filterLocation : true;
    const matchWasteType = filterWasteType ? (c.waste_type_name || c.waste_type_id) === filterWasteType : true;
    const matchDate = filterDate ? c.collection_date === filterDate : true;
    return matchLocation && matchWasteType && matchDate;
  });

  const totalKg = collections.reduce((acc, c) => acc + (c.unit === 'kg' ? Number(c.quantity) : 0), 0);
  const totalEntries = collections.length;

  return (
    <div className="app">
      {/* KOMPONEN TOAST */}
      {toast && <div className="toast">{toast}</div>}

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

          <div className="charts-grid">
            <div className="card">
              <h2>Distribusi Jenis Sampah</h2>
              {loading ? <div className="loading">Memuat...</div> : wasteTypeData.length === 0 ? <p>Belum ada data</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={wasteTypeData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {wasteTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <h2>Jumlah Sampah per Lokasi (Kg)</h2>
              {loading ? <div className="loading">Memuat...</div> : locationData.length === 0 ? <p>Belum ada data</p> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={locationData}>
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Bar dataKey="kg" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* ENTRIES TAB (DENGAN FILTER & EXPORT) */}
      {activeTab === 'entries' && (
        <div className="card">
          <div className="entries-header">
            <h2>Riwayat Pengumpulan</h2>
            <button className="btn btn-primary" onClick={handleExportCSV}>📥 Export Excel</button>
          </div>
          
          {/* UI FILTER */}
          <div className="filter-grid">
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">Semua Lokasi</option>
              {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
            
            <select value={filterWasteType} onChange={(e) => setFilterWasteType(e.target.value)}>
              <option value="">Semua Tipe</option>
              {wasteTypes.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
            </select>
            
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            
            <button className="btn btn-danger" onClick={() => { setFilterLocation(''); setFilterWasteType(''); setFilterDate(''); }}>Reset</button>
          </div>

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
                  {filteredCollections.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign: 'center'}}>Tidak ada data ditemukan</td></tr>
                  ) : (
                    filteredCollections.map((c) => (
                      <tr key={c.id}>
                        <td>{c.collection_date}</td>
                        <td>{c.location_name || c.location_id}</td>
                        <td>{c.waste_type_name || c.waste_type_id}</td>
                        <td>{c.quantity} {c.unit}</td>
                        <td>{c.collector_name || c.collected_by_id}</td>
                      </tr>
                    ))
                  )}
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
              <input type="text" name="collected_by_id" value={form.collected_by_id} onChange={handleInputChange} required placeholder="Tulis nama petugas..." />
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
