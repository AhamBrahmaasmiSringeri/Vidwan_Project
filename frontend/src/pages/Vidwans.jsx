import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  MapPin, 
  Globe, 
  BookOpen, 
  Compass, 
  Trash2, 
  Edit3, 
  X,
  FileText
} from 'lucide-react';

const Vidwans = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [vidwans, setVidwans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVidwan, setEditingVidwan] = useState(null);
  const [form, setForm] = useState({
    name: '',
    languages: '',
    specialization: '',
    city: '',
    travelCapability: '',
    status: 'Active',
    notes: '',
    isOverseas: false,
  });

  const [travelFilter, setTravelFilter] = useState('All'); // 'All', 'Domestic', 'Overseas'

  const fetchVidwans = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vidwans');
      setVidwans(data);
    } catch (err) {
      console.error('Error fetching Vidwans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVidwans();
  }, []);

  const handleOpenAddModal = () => {
    setEditingVidwan(null);
    setForm({
      name: '',
      languages: '',
      specialization: '',
      city: '',
      travelCapability: '',
      status: 'Active',
      notes: '',
      isOverseas: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vidwan) => {
    setEditingVidwan(vidwan);
    setForm({
      name: vidwan.name,
      languages: vidwan.languages.join(', '),
      specialization: vidwan.specialization,
      city: vidwan.city,
      travelCapability: vidwan.travelCapability,
      status: vidwan.status,
      notes: vidwan.notes || '',
      isOverseas: vidwan.isOverseas || false,
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedLanguages = form.languages
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      languages: formattedLanguages,
    };

    try {
      if (editingVidwan) {
        await api.put(`/vidwans/${editingVidwan._id}`, payload);
      } else {
        await api.post('/vidwans', payload);
      }
      setIsModalOpen(false);
      fetchVidwans();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving Vidwan details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this scholar from the registry?')) return;

    try {
      await api.delete(`/vidwans/${id}`);
      fetchVidwans();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete Vidwan.');
    }
  };

  // Filter Vidwans
  const filteredVidwans = vidwans.filter((v) => {
    const term = searchTerm.toLowerCase();
    const searchMatch = (
      v.name.toLowerCase().includes(term) ||
      v.specialization.toLowerCase().includes(term) ||
      v.city.toLowerCase().includes(term) ||
      v.languages.some((l) => l.toLowerCase().includes(term))
    );

    const travelMatch = travelFilter === 'All' || 
      (travelFilter === 'Overseas' && v.isOverseas) || 
      (travelFilter === 'Domestic' && !v.isOverseas);

    return searchMatch && travelMatch;
  });

  return (
    <div className="flex-1 p-6 lg:p-8 bg-cream overflow-y-auto h-screen">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-teak">Vidwan Registry</h2>
          <p className="text-sm text-teak-light">Registry profiles of authorized traditional scholars.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-saffron hover:bg-saffron-dark text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Vidwan</span>
        </button>
      </div>

      {/* Search and filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-cream-border flex-1 flex items-center gap-3 shadow-sm">
          <Search className="w-5 h-5 text-teak-muted" />
          <input
            type="text"
            placeholder="Search by name, specialization, language, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-teak focus:outline-none placeholder:text-teak-muted"
          />
        </div>
        <div className="bg-white p-4 rounded-xl border border-cream-border flex items-center gap-3 shadow-sm min-w-[200px]">
          <Globe className="w-5 h-5 text-teak-muted" />
          <select
            value={travelFilter}
            onChange={(e) => setTravelFilter(e.target.value)}
            className="w-full bg-transparent text-sm text-teak focus:outline-none font-medium appearance-none cursor-pointer"
          >
            <option value="All">All Regions</option>
            <option value="Domestic">Domestic Only</option>
            <option value="Overseas">Overseas Travel</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-teak-muted">Loading scholars...</p>
        </div>
      ) : filteredVidwans.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cream-border text-center">
          <p className="text-sm text-teak-muted">No scholars found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVidwans.map((vidwan) => (
            <div 
              key={vidwan._id} 
              className="bg-white rounded-2xl border border-cream-border p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Status Band */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-cream-border"></div>
              
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold font-serif text-teak pr-4 leading-snug">
                    {vidwan.name}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      vidwan.status === 'Active' 
                        ? 'bg-forest-soft text-forest-dark border border-forest/15'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {vidwan.status}
                    </span>
                    {vidwan.isOverseas && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-saffron/10 text-saffron border border-saffron/20 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        OVERSEAS
                      </span>
                    )}
                  </div>
                </div>

                {/* Specialization */}
                <p className="text-xs text-saffron font-medium flex items-start gap-1.5 mb-4">
                  <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-saffron/80" />
                  <span className="leading-relaxed">{vidwan.specialization}</span>
                </p>

                <div className="space-y-2.5 text-xs border-t border-cream-border pt-4 text-teak-light">
                  {/* Languages */}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teak-muted flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {vidwan.languages.map((lang) => (
                        <span key={lang} className="bg-cream border border-cream-border px-1.5 py-0.5 rounded text-[10px] text-teak font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* City */}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teak-muted flex-shrink-0" />
                    <span>Based in: <strong>{vidwan.city}</strong></span>
                  </div>

                  {/* Travel Boundary */}
                  <div className="flex items-start gap-2">
                    <Compass className="w-4 h-4 text-teak-muted flex-shrink-0 mt-0.5" />
                    <span>Travels: <strong className="text-teak">{vidwan.travelCapability}</strong></span>
                  </div>

                  {/* Notes snippet */}
                  {vidwan.notes && (
                    <div className="flex items-start gap-2 bg-cream/30 p-2.5 rounded-lg border border-cream-border/40 mt-3">
                      <FileText className="w-3.5 h-3.5 text-teak-muted flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed italic text-teak-muted truncate max-w-[280px]">
                        "{vidwan.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-cream-border pt-4 mt-6">
                <button
                  onClick={() => navigate(`/availability?vidwanId=${vidwan._id}`)}
                  className="flex-1 bg-cream hover:bg-cream-dark border border-cream-border text-teak px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Check Availability</span>
                </button>
                
                <button
                  onClick={() => handleOpenEditModal(vidwan)}
                  className="p-2 hover:bg-cream-dark border border-cream-border text-teak rounded-lg transition-colors cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {user?.role === 'Super Admin' && (
                  <button
                    onClick={() => handleDelete(vidwan._id)}
                    className="p-2 hover:bg-red-50 border border-red-100 text-red-500 rounded-lg transition-colors cursor-pointer"
                    title="Remove Scholar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scholar Editor Drawer / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-cream-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-cream-border bg-cream/40 flex justify-between items-center">
              <h3 className="text-lg font-bold font-serif text-teak">
                {editingVidwan ? 'Modify Scholar Profile' : 'Register New Vidwan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teak-muted hover:text-teak transition-colors p-1.5 rounded-full hover:bg-cream-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-teak-light">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Sri Ramakrishna Shastri"
                  className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Base City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Sringeri"
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-teak-light">Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Advaita Vedanta & Prasthanatraya"
                  className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-teak-light">Languages (comma-separated)</label>
                <input
                  type="text"
                  name="languages"
                  value={form.languages}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Sanskrit, Kannada, Hindi"
                  className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-teak-light">Travel Capability</label>
                <input
                  type="text"
                  name="travelCapability"
                  value={form.travelCapability}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. South India, All India (by train/car)"
                  className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-cream/30 rounded-xl border border-cream-border/50">
                <input
                  type="checkbox"
                  id="isOverseas"
                  name="isOverseas"
                  checked={form.isOverseas}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded text-saffron focus:ring-saffron cursor-pointer"
                />
                <label htmlFor="isOverseas" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="w-4 h-4 text-saffron" />
                  <div>
                    <p className="text-xs font-bold text-teak">Overseas Travel Capability</p>
                    <p className="text-[10px] text-teak-light">Enable this if the scholar is available for international programs.</p>
                  </div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-teak-light">Administrative Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  value={form.notes}
                  onChange={handleInputChange}
                  placeholder="Preferences, contact scheduling restrictions, health considerations, etc."
                  className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-cream-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-cream-border text-xs rounded-lg text-teak hover:bg-cream-dark transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {editingVidwan ? 'Save Profile' : 'Register Scholar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vidwans;
