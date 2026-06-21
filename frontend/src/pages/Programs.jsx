import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ConflictWarning from '../components/ConflictWarning';
import { 
  Plus, 
  Search, 
  MapPin, 
  User, 
  Calendar, 
  Languages, 
  Edit3, 
  Trash2, 
  X,
  AlertTriangle,
  FileText
} from 'lucide-react';

const Programs = () => {
  const { user } = useContext(AuthContext);
  const [programs, setPrograms] = useState([]);
  const [vidwans, setVidwans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vidwanSearchTerm, setVidwanSearchTerm] = useState('');

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [form, setForm] = useState({
    programName: '',
    city: '',
    venue: '',
    startDate: '',
    endDate: '',
    language: '',
    vidwans: [],
    status: 'Tentative',
    notes: '',
  });

  // Conflict state
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [programsRes, vidwansRes] = await Promise.all([
        api.get('/programs'),
        api.get('/vidwans'),
      ]);
      setPrograms(programsRes.data.map(p => p.program || p));
      setVidwans(vidwansRes.data);
    } catch (err) {
      console.error('Error fetching programs page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Live conflict validation inside the form
  useEffect(() => {
    const performLiveConflictCheck = async () => {
      // Only check if Dates and Vidwans are entered
      if (!isModalOpen || !form.startDate || !form.endDate || form.vidwans.length === 0) {
        setConflicts([]);
        return;
      }

      try {
        setCheckingConflicts(true);
        const { data } = await api.post('/programs/check-conflict', {
          startDate: form.startDate,
          endDate: form.endDate,
          vidwans: form.vidwans,
          excludeProgramId: editingProgram?._id || null,
        });
        setConflicts(data.conflicts || []);
      } catch (err) {
        console.error('Error validation conflicts', err);
      } finally {
        setCheckingConflicts(false);
      }
    };

    const delayCheck = setTimeout(() => {
      performLiveConflictCheck();
    }, 400); // debounce API check

    return () => clearTimeout(delayCheck);
  }, [form.startDate, form.endDate, form.vidwans, isModalOpen, editingProgram]);

  const handleOpenAddModal = () => {
    setEditingProgram(null);
    setForm({
      programName: '',
      city: '',
      venue: '',
      startDate: '',
      endDate: '',
      language: '',
      vidwans: [],
      status: 'Tentative',
      notes: '',
    });
    setConflicts([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (program) => {
    setEditingProgram(program);
    setForm({
      programName: program.programName,
      city: program.city,
      venue: program.venue,
      startDate: program.startDate.split('T')[0],
      endDate: program.endDate.split('T')[0],
      language: program.language,
      vidwans: program.vidwans?.map(v => v._id) || [],
      status: program.status,
      notes: program.notes || '',
    });
    setConflicts([]);
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure start date is before end date
    if (new Date(form.startDate) > new Date(form.endDate)) {
      alert('Start date must be before or equal to the end date.');
      return;
    }

    try {
      const payload = {
        ...form
      };

      if (editingProgram) {
        await api.put(`/programs/${editingProgram._id}`, payload);
      } else {
        await api.post('/programs', payload);
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving program.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program? This action is permanent.')) return;

    try {
      await api.delete(`/programs/${id}`);
      fetchInitialData();
    } catch (err) {
      alert(err.response?.data?.message || 'Cannot delete program.');
    }
  };

  // Filter programs based on Search query
  const filteredPrograms = programs.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.programName.toLowerCase().includes(term) ||
      p.city.toLowerCase().includes(term) ||
      p.venue.toLowerCase().includes(term) ||
      p.vidwans?.some(v => v.name.toLowerCase().includes(term)) ||
      p.language.toLowerCase().includes(term)
    );
  });

  const activeVidwans = vidwans.filter((v) => v.status === 'Active');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 p-6 lg:p-8 bg-cream overflow-y-auto h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-teak">Manage Programs</h2>
          <p className="text-sm text-teak-light">Schedule spiritual camps, assign scholars, and manage venues.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-saffron hover:bg-saffron-dark text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Program Camp</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-cream-border mb-6 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-teak-muted" />
        <input
          type="text"
          placeholder="Search by program name, city, venue, assigned scholar, or language..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-sm text-teak focus:outline-none placeholder:text-teak-muted"
        />
      </div>

      {/* Programs List Table */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-teak-muted">Loading scheduled camps...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-cream-border text-center">
          <p className="text-sm text-teak-muted">No spiritual programs found matching your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cream-dark/60 text-teak-light border-b border-cream-border text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Program Details</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Discourse Language</th>
                  <th className="p-4">Scholar Assignments</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border text-xs text-teak">
                {filteredPrograms.map((program) => (
                  <tr key={program._id} className="hover:bg-cream/20 transition-colors">
                    {/* Program Details */}
                    <td className="p-4">
                      <div className="font-bold font-serif text-sm text-teak">{program.programName}</div>
                      {program.notes && (
                        <div className="text-[10px] text-teak-muted max-w-[200px] truncate mt-1 italic flex items-center gap-1">
                          <FileText className="w-3 h-3 text-teak-muted/80 flex-shrink-0" />
                          <span>"{program.notes}"</span>
                        </div>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-1.5 text-teak-light">
                        <Calendar className="w-3.5 h-3.5 text-teak-muted" />
                        <span>{formatDate(program.startDate)} - {formatDate(program.endDate)}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      <div className="font-semibold">{program.city}</div>
                      <div className="text-teak-muted text-[11px] flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-teak-muted flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{program.venue}</span>
                      </div>
                    </td>

                    {/* Language */}
                    <td className="p-4">
                      <span className="bg-cream border border-cream-border px-2 py-0.5 rounded text-[10px] font-semibold text-teak-light flex items-center gap-1 w-max">
                        <Languages className="w-3 h-3 text-teak-muted" />
                        <span>{program.language}</span>
                      </span>
                    </td>

                    {/* Scholar Assignments */}
                    <td className="p-4 space-y-1">
                      {program.vidwans && program.vidwans.length > 0 ? (
                        program.vidwans.map((vidwan, idx) => (
                          <div key={vidwan._id} className="flex items-center gap-1 text-teak font-semibold">
                            <User className={`w-3.5 h-3.5 ${idx === 0 ? 'text-saffron' : 'text-teak-muted'}`} />
                            <span>{vidwan.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>NO VIDWANS ASSIGNED</span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        program.status === 'Confirmed'
                          ? 'bg-forest-soft text-forest border-forest/20'
                          : program.status === 'Tentative'
                          ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                          : program.status === 'Completed'
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : 'bg-red-50 text-red-700 border-red-200 line-through'
                      }`}>
                        {program.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(program)}
                          className="p-1.5 hover:bg-cream-dark border border-cream-border text-teak rounded-lg transition-colors cursor-pointer"
                          title="Modify Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        {user?.role === 'Super Admin' && (
                          <button
                            onClick={() => handleDelete(program._id)}
                            className="p-1.5 hover:bg-red-50 border border-red-100 text-red-500 rounded-lg transition-colors cursor-pointer"
                            title="Remove Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Program Scheduler Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-cream-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-cream-border bg-cream/40 flex justify-between items-center">
              <h3 className="text-lg font-bold font-serif text-teak">
                {editingProgram ? 'Modify Camp Allocation' : 'Schedule New Camp'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-teak-muted hover:text-teak transition-colors p-1.5 rounded-full hover:bg-cream-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              
              {/* Conflict warning banner inside the form */}
              <ConflictWarning conflicts={conflicts} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Program Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Program Name</label>
                  <input
                    type="text"
                    name="programName"
                    value={form.programName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Advaita Vedanta Sadhana Retreat"
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Rishikesh"
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* Venue */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={form.venue}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Sharada Kutir Ashrama"
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* Vidwan Selection */}
                <div className="col-span-2 space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-teak-light">Assign Vidwans</label>
                    <div className="relative">
                      <Search className="w-3 h-3 text-teak-muted absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search scholars..."
                        value={vidwanSearchTerm}
                        onChange={(e) => setVidwanSearchTerm(e.target.value)}
                        className="pl-7 pr-2 py-1 border border-cream-border rounded text-[10px] focus:outline-none focus:border-saffron bg-white/50 w-32"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border border-cream-border rounded-lg bg-cream/20">
                    {activeVidwans
                      .filter(v => v.name.toLowerCase().includes(vidwanSearchTerm.toLowerCase()) || form.vidwans.includes(v._id))
                      .sort((a, b) => {
                        const aSel = form.vidwans.includes(a._id);
                        const bSel = form.vidwans.includes(b._id);
                        if (aSel && !bSel) return -1;
                        if (!aSel && bSel) return 1;
                        return 0;
                      })
                      .map((v) => (
                      <label key={v._id} className={`flex items-center gap-2 cursor-pointer hover:bg-cream-dark/40 p-1 rounded transition-colors ${form.vidwans.includes(v._id) ? 'bg-saffron/5' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.vidwans.includes(v._id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm(prev => ({
                              ...prev,
                              vidwans: checked 
                                ? [...prev.vidwans, v._id]
                                : prev.vidwans.filter(id => id !== v._id)
                            }));
                          }}
                          className="w-3.5 h-3.5 accent-saffron"
                        />
                        <span className={`text-[11px] ${form.vidwans.includes(v._id) ? 'text-teak font-bold' : 'text-teak'}`}>
                          {v.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {form.vidwans.length === 0 && (
                    <p className="text-[10px] text-red-500 font-medium italic mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Warning: No Vidwans assigned to this program.
                    </p>
                  )}
                </div>

                {/* Language */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Language</label>
                  <input
                    type="text"
                    name="language"
                    value={form.language}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Hindi, Sanskrit"
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  >
                    <option value="Tentative">Tentative</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Notes */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-teak-light">Discourse/Travel Notes</label>
                  <textarea
                    name="notes"
                    rows="3"
                    value={form.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Discourse texts, special logistics required, dietary rules..."
                    className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                  ></textarea>
                </div>
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
                  disabled={checkingConflicts}
                  className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {checkingConflicts ? 'Checking conflicts...' : 'Schedule Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programs;
