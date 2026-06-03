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
    assignedVidwan: '',
    backupVidwan: '',
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
        (p) =>
          p.assignedVidwan?._id === filterVidwan ||
          p.backupVidwan?._id === filterVidwan
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
        const vidwan = p.assignedVidwan;
        if (!vidwan) return false;
        return filterTravel === 'Overseas' ? vidwan.isOverseas : !vidwan.isOverseas;
      });
    }

    setFilteredPrograms(result);
  }, [programs, filterVidwan, filterCity, filterLanguage, filterStatus]);

  // Handle live conflict checks in Edit form
  useEffect(() => {
    const performConflictCheck = async () => {
      if (!isEditMode || !editForm.startDate || !editForm.endDate || !editForm.assignedVidwan) {
        setConflicts([]);
        return;
      }

      try {
        setCheckingConflicts(true);
        const { data } = await api.post('/programs/check-conflict', {
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          assignedVidwan: editForm.assignedVidwan,
          backupVidwan: editForm.backupVidwan || null,
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
  }, [editForm.startDate, editForm.endDate, editForm.assignedVidwan, editForm.backupVidwan, isEditMode, selectedEvent]);

  // Convert programs to FullCalendar format
  const calendarEvents = filteredPrograms.map((program) => {
    const start = new Date(program.startDate);
    const end = new Date(program.endDate);
    
    // Set display end date time to 23:59:59 to visual block the last day correctly
    const displayEnd = new Date(end);
    displayEnd.setHours(23, 59, 59, 999);

    return {
      id: program._id,
      title: `${program.programName} - ${program.assignedVidwan?.name || 'Unassigned'}`,
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
      assignedVidwan: program.assignedVidwan?._id || '',
      backupVidwan: program.backupVidwan?._id || '',
      status: program.status,
      notes: program.notes || '',
    });
    setConflicts([]);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsEditMode(false);
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
        ...editForm,
        backupVidwan: editForm.backupVidwan === "" ? null : editForm.backupVidwan
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
                      <span className="text-[10px] uppercase font-semibold text-teak-muted block">Primary Assigned Vidwan</span>
                      <div className="flex items-center gap-2 p-3 bg-cream/40 border border-cream-border/60 rounded-xl">
                        <User className="w-4 h-4 text-saffron" />
                        <div>
                          <p className="text-sm font-semibold text-teak">{selectedEvent.assignedVidwan?.name}</p>
                          <p className="text-[10px] text-teak-light">
                            {selectedEvent.assignedVidwan?.specialization} ({selectedEvent.assignedVidwan?.city})
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedEvent.backupVidwan && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-semibold text-teak-muted block">Backup Vidwan</span>
                        <div className="flex items-center gap-2 p-3 bg-cream/20 border border-cream-border/40 rounded-xl">
                          <User className="w-4 h-4 text-teak-muted" />
                          <div>
                            <p className="text-xs font-semibold text-teak">{selectedEvent.backupVidwan?.name}</p>
                            <p className="text-[10px] text-teak-light">
                              {selectedEvent.backupVidwan?.specialization}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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

                    {/* Primary Vidwan Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Assigned Vidwan</label>
                      <select
                        name="assignedVidwan"
                        value={editForm.assignedVidwan}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      >
                        <option value="">Select Vidwan</option>
                        {activeVidwans.map((v) => (
                          <option key={v._id} value={v._id}>{v.name} ({v.city})</option>
                        ))}
                      </select>
                    </div>

                    {/* Backup Vidwan Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-teak-light">Backup Vidwan (Optional)</label>
                      <select
                        name="backupVidwan"
                        value={editForm.backupVidwan}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg text-xs focus:outline-none focus:border-saffron"
                      >
                        <option value="">None</option>
                        {activeVidwans
                          .filter((v) => v._id !== editForm.assignedVidwan)
                          .map((v) => (
                            <option key={v._id} value={v._id}>{v.name} ({v.city})</option>
                          ))}
                      </select>
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
