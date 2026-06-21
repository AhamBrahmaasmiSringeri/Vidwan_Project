import React, { useState, useEffect, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ConflictWarning from '../components/ConflictWarning';
import { 
  Filter, 
  MapPin, 
  User, 
  Calendar, 
  BookOpen, 
  X, 
  Edit2, 
  AlertTriangle,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [programs, setPrograms] = useState([]);
  const [vidwans, setVidwans] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vidwanSearchTerm, setVidwanSearchTerm] = useState('');

  // Filters state
  const [filterVidwan, setFilterVidwan] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTravel, setFilterTravel] = useState(''); // '', 'Domestic', 'Overseas'

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    programName: '',
    city: '',
    venue: '',
    startDate: '',
    endDate: '',
    language: '',
    vidwans: [],
    status: '',
    notes: '',
  });
  const [conflicts, setConflicts] = useState([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [programsRes, vidwansRes] = await Promise.all([
        api.get('/programs'),
        api.get('/vidwans'),
      ]);
      setPrograms(programsRes.data.map(p => p.program || p));
      setVidwans(vidwansRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter application
  useEffect(() => {
    let result = [...programs];

    if (filterVidwan) {
      result = result.filter(
        (p) => p.vidwans?.some(v => v._id === filterVidwan)
      );
    }

    if (filterCity) {
      result = result.filter((p) =>
        p.city.toLowerCase().includes(filterCity.toLowerCase())
      );
    }

    if (filterLanguage) {
      result = result.filter((p) => p.language === filterLanguage);
    }

    if (filterStatus) {
      result = result.filter((p) => p.status === filterStatus);
    }

    if (filterTravel) {
      result = result.filter((p) => {
        const primaryVidwan = p.vidwans?.[0];
        if (!primaryVidwan) return false;
        return filterTravel === 'Overseas' ? primaryVidwan.isOverseas : !primaryVidwan.isOverseas;
      });
    }

    setFilteredPrograms(result);
  }, [programs, filterVidwan, filterCity, filterLanguage, filterStatus]);

  // Handle live conflict checks in Edit form
  useEffect(() => {
    const performConflictCheck = async () => {
      if (!isEditMode || !editForm.startDate || !editForm.endDate || editForm.vidwans.length === 0) {
        setConflicts([]);
        return;
      }

      try {
        setCheckingConflicts(true);
        const { data } = await api.post('/programs/check-conflict', {
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          vidwans: editForm.vidwans,
          excludeProgramId: selectedEvent?._id,
        });
        setConflicts(data.conflicts || []);
      } catch (err) {
        console.error('Conflict validation error', err);
      } finally {
        setCheckingConflicts(false);
      }
    };

    const delayCheck = setTimeout(() => {
      performConflictCheck();
    }, 400);

    return () => clearTimeout(delayCheck);
  }, [editForm.startDate, editForm.endDate, editForm.vidwans, isEditMode, selectedEvent]);

  // Convert programs to FullCalendar format
  const calendarEvents = filteredPrograms.map((program) => {
    const start = new Date(program.startDate);
    const end = new Date(program.endDate);
    
    // Set display end date time to 23:59:59 to visual block the last day correctly
    const displayEnd = new Date(end);
    displayEnd.setHours(23, 59, 59, 999);

    return {
      id: program._id,
      title: `${program.programName} - ${program.vidwans?.length > 0 ? program.vidwans[0].name : 'NO VIDWAN'}`,
      start: start,
      end: displayEnd,
      className: `event-${program.status.toLowerCase()}`,
      extendedProps: { program },
    };
  });

  // Handle Event Click
  const handleEventClick = (info) => {
    const program = info.event.extendedProps.program;
    setSelectedEvent(program);
    setIsEditMode(false);
    setEditForm({
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
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsEditMode(false);
    setVidwanSearchTerm('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editForm
      };
      const { data } = await api.put(`/programs/${selectedEvent._id}`, payload);
      setSelectedEvent(data.program);
      setIsEditMode(false);
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating program');
    }
  };

  // Unique languages & cities from programs for filter lists
  const availableLanguages = [...new Set(programs.map((p) => p.language))].filter(Boolean);
  const activeVidwans = vidwans.filter(v => v.status === 'Active');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 p-6 lg:p-8 bg-cream overflow-y-auto h-screen">
      {/* Dashboard Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold font-serif text-teak">Calendar Dashboard</h2>
          <p className="text-sm text-teak-light">Centralized view of all spiritual camps and scholar schedules.</p>
        </div>
      </div>

      {/* Quick Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-cream-border flex items-center gap-3">
          <div className="p-2.5 bg-saffron-soft rounded-lg text-saffron">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-teak-muted block">Total Camps</span>
            <span className="text-xl font-bold text-teak">{programs.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-cream-border flex items-center gap-3">
          <div className="p-2.5 bg-forest-soft rounded-lg text-forest">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-teak-muted block">Active Vidwans</span>
            <span className="text-xl font-bold text-teak">{activeVidwans.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-cream-border flex items-center gap-3 col-span-2">
          <div className="p-2.5 bg-cream-dark rounded-lg text-teak-muted">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-teak-muted block">Confirmed</span>
              <span className="text-sm font-semibold text-forest">
                {programs.filter(p => p.status === 'Confirmed').length}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-teak-muted block">Tentative</span>
              <span className="text-sm font-semibold text-amber-600">
                {programs.filter(p => p.status === 'Tentative').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-4 rounded-xl border border-cream-border mb-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-cream-border pb-3 mb-4">
          <Filter className="w-4 h-4 text-saffron" />
          <h3 className="font-semibold text-sm text-teak font-sans uppercase tracking-wider">Filter Schedule</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Vidwan Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-teak-light">Filter by Vidwan</label>
            <select
              value={filterVidwan}
              onChange={(e) => setFilterVidwan(e.target.value)}
              className="w-full px-3 py-2 bg-cream/30 border border-cream-border rounded-lg text-xs text-teak focus:outline-none focus:border-saffron"
            >
              <option value="">All Scholars</option>
              {vidwans.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-teak-light">Filter by City</label>
            <input
              type="text"
              placeholder="e.g. Sringeri"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-3 py-2 bg-cream/30 border border-cream-border rounded-lg text-xs text-teak focus:outline-none focus:border-saffron"
            />
          </div>

          {/* Language Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-teak-light">Filter by Language</label>
            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-cream/30 border border-cream-border rounded-lg text-xs text-teak focus:outline-none focus:border-saffron"
            >
              <option value="">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-teak-light">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-cream/30 border border-cream-border rounded-lg text-xs text-teak focus:outline-none focus:border-saffron"
            >
              <option value="">All Statuses</option>
              <option value="Tentative">Tentative</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Travel Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-teak-light">Filter by Region</label>
            <select
              value={filterTravel}
              onChange={(e) => setFilterTravel(e.target.value)}
              className="w-full px-3 py-2 bg-cream/30 border border-cream-border rounded-lg text-xs text-teak focus:outline-none focus:border-saffron font-medium"
            >
              <option value="">All Regions</option>
              <option value="Domestic">Domestic Vidwans</option>
              <option value="Overseas">Overseas Vidwans</option>
            </select>
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(filterVidwan || filterCity || filterLanguage || filterStatus) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setFilterVidwan('');
                setFilterCity('');
                setFilterLanguage('');
                setFilterStatus('');
                setFilterTravel('');
              }}
              className="text-[11px] font-semibold text-saffron hover:text-saffron-dark transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Calendar Card */}
      <div className="bg-white p-6 rounded-2xl border border-cream-border shadow-sm">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-saffron border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-teak-muted">Loading schedule and bookings...</p>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            editable={false}
            selectable={false}
            dayMaxEvents={true}
          />
        )}
      </div>

      {/* Event Details/Edit Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-cream-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-cream-border bg-cream/40 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold font-serif text-teak">
                  {isEditMode ? 'Modify Program' : 'Program Details'}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 mt-1 rounded font-medium inline-block ${
                  selectedEvent.status === 'Confirmed'
                    ? 'bg-forest-soft text-forest'
                    : selectedEvent.status === 'Tentative'
                    ? 'bg-amber-100 text-amber-800'
                    : selectedEvent.status === 'Completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800 line-through'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-teak-muted hover:text-teak transition-colors p-1.5 rounded-full hover:bg-cream-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {!isEditMode ? (
                /* View Details Mode */
                <div className="space-y-6">
                  {/* Name and Venue */}
                  <div>
                    <h2 className="text-2xl font-bold font-serif text-teak leading-tight">
                      {selectedEvent.programName}
                    </h2>
                    <div className="flex items-center gap-1.5 text-teak-light text-sm mt-2">
                      <MapPin className="w-4 h-4 text-saffron flex-shrink-0" />
                      <span>{selectedEvent.venue}, {selectedEvent.city}</span>
                    </div>
                  </div>

                  {/* Date & Language */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-cream-border">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-teak-muted block">Duration</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-teak">
                        <Calendar className="w-4 h-4 text-teak-muted" />
                        <div>
                          <p>{formatDate(selectedEvent.startDate)}</p>
                          <p className="text-[10px] text-teak-muted">to</p>
                          <p>{formatDate(selectedEvent.endDate)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-teak-muted block">Discourse Language</span>
                      <span className="text-xs font-semibold text-teak bg-cream border border-cream-border px-2.5 py-1 rounded inline-block">
                        {selectedEvent.language}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Vidwans */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold text-teak-muted block">Assigned Vidwans</span>
                      {selectedEvent.vidwans && selectedEvent.vidwans.length > 0 ? (
                        <div className="space-y-2">
                          {selectedEvent.vidwans.map((vidwan, idx) => (
                            <div key={vidwan._id} className={`flex items-center gap-2 p-3 ${idx === 0 ? 'bg-cream/40 border border-cream-border/60' : 'bg-cream/20 border border-cream-border/40'} rounded-xl`}>
                              <User className={`w-4 h-4 ${idx === 0 ? 'text-saffron' : 'text-teak-muted'}`} />
                              <div>
                                <p className="text-sm font-semibold text-teak">
                                  {vidwan.name} {idx === 0 && <span className="text-[10px] text-saffron font-bold ml-2">(Primary)</span>}
                                </p>
                                <p className="text-[10px] text-teak-light">
                                  {vidwan.specialization} ({vidwan.city})
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 animate-pulse">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <p className="text-sm font-bold tracking-wide uppercase">NO VIDWANS ASSIGNED TO THIS CAMP</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedEvent.notes && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-semibold text-teak-muted block">Administrative Notes</span>
                      <p className="text-xs text-teak-light bg-cream/30 p-3 rounded-xl border border-cream-border/40 italic leading-relaxed">
                        "{selectedEvent.notes}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode Form */
                <form onSubmit={handleUpdateProgram} className="space-y-4">
                  {/* Real-time Conflict validation warnings */}
                  <ConflictWarning conflicts={conflicts} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Program Name */}
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Program Name</label>
                      <input
                        type="text"
                        name="programName"
                        value={editForm.programName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">City</label>
                      <input
                        type="text"
                        name="city"
                        value={editForm.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      />
                    </div>

                    {/* Venue */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Venue</label>
                      <input
                        type="text"
                        name="venue"
                        value={editForm.venue}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      />
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={editForm.startDate}
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
                        value={editForm.endDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      />
                    </div>

                    {/* Vidwan Multi-Selection Selector */}
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
                          .filter(v => v.name.toLowerCase().includes(vidwanSearchTerm.toLowerCase()) || editForm.vidwans.includes(v._id))
                          .sort((a, b) => {
                            const aSel = editForm.vidwans.includes(a._id);
                            const bSel = editForm.vidwans.includes(b._id);
                            if (aSel && !bSel) return -1;
                            if (!aSel && bSel) return 1;
                            return 0;
                          })
                          .map((v) => (
                          <label key={v._id} className={`flex items-center gap-2 cursor-pointer hover:bg-cream-dark/40 p-1 rounded transition-colors ${editForm.vidwans.includes(v._id) ? 'bg-saffron/5' : ''}`}>
                            <input
                              type="checkbox"
                              checked={editForm.vidwans.includes(v._id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEditForm(prev => ({
                                  ...prev,
                                  vidwans: checked 
                                    ? [...prev.vidwans, v._id]
                                    : prev.vidwans.filter(id => id !== v._id)
                                }));
                              }}
                              className="w-3.5 h-3.5 accent-saffron"
                            />
                            <span className={`text-[11px] ${editForm.vidwans.includes(v._id) ? 'text-teak font-bold' : 'text-teak'}`}>
                              {v.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Language</label>
                      <input
                        type="text"
                        name="language"
                        placeholder="e.g. Sanskrit"
                        value={editForm.language}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      />
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Status</label>
                      <select
                        name="status"
                        value={editForm.status}
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
                      <label className="text-xs font-semibold text-teak-light">Notes</label>
                      <textarea
                        name="notes"
                        rows="3"
                        value={editForm.notes}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      ></textarea>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-cream-border">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 border border-cream-border text-xs rounded-lg text-teak hover:bg-cream-dark transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={checkingConflicts}
                      className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {checkingConflicts ? 'Validating...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer (Read mode buttons) */}
            {!isEditMode && (
              <div className="p-4 border-t border-cream-border bg-cream/20 flex justify-between">
                <div className="text-[10px] text-teak-muted flex items-center">
                  Last updated: {new Date(selectedEvent.updatedAt).toLocaleDateString()}
                </div>
                {/* Edit allowed for both Roles as they are authenticated directors/admins */}
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modify Program</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
