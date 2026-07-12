import React from 'react';
import { AlertTriangle, Calendar, MapPin, User } from 'lucide-react';

const ConflictWarning = ({ conflicts = [] }) => {
  if (!conflicts || conflicts.length === 0) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mb-4 shadow-sm animate-pulse-once">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-amber-800 font-sans">
            Scheduling Conflict Detected!
          </h3>
          <p className="text-xs text-amber-700 mt-1">
            The selected Vidwan (or backup) is already scheduled during this timeframe. Double-booking is allowed, but please coordinate carefully:
          </p>

          <div className="mt-3 space-y-2">
            {conflicts.map((conflict) => (
              <div 
                key={conflict._id} 
                className="bg-white/80 p-3 rounded border border-amber-200 text-xs text-teak"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-amber-900">{conflict.programName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    conflict.status === 'Confirmed' 
                      ? 'bg-forest-soft text-forest-dark border border-forest/10'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {conflict.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5 text-teak-light">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teak-muted" />
                    <span>Assigned: {conflict.vidwans?.map(v => v.name).join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teak-muted" />
                    <span>{formatDate(conflict.startDate)} - {formatDate(conflict.endDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-1">
                    <MapPin className="w-3.5 h-3.5 text-teak-muted" />
                    <span className="truncate">{conflict.venue}, {conflict.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictWarning;
