import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar, MapPin, CheckCircle2, Clock, Award, XCircle } from 'lucide-react';
import { JobApplicationTrackerItem } from '../types';
import { StorageService } from '../services/storageService';

interface TrackerViewProps {
  applications: JobApplicationTrackerItem[];
  onApplicationsUpdated: (apps: JobApplicationTrackerItem[]) => void;
}

const STATUS_CONFIG: Record<
  JobApplicationTrackerItem['status'],
  { label: string; bg: string; text: string; icon: any }
> = {
  drafting: { label: 'Drafting', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  applied: { label: 'Applied', bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle2 },
  interviewing: { label: 'Interviewing', bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
  offer: { label: 'Offer Received', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: Award },
  rejected: { label: 'Not Moving Forward', bg: 'bg-rose-50', text: 'text-rose-700', icon: XCircle },
  archived: { label: 'Archived', bg: 'bg-slate-50', text: 'text-slate-500', icon: Clock }
};

export const TrackerView: React.FC<TrackerViewProps> = ({
  applications,
  onApplicationsUpdated
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newStatus, setNewStatus] = useState<JobApplicationTrackerItem['status']>('applied');
  const [newNotes, setNewNotes] = useState('');

  const filteredApps = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const handleStatusChange = (id: string, newStat: JobApplicationTrackerItem['status']) => {
    const updated = applications.map(a => (a.id === id ? { ...a, status: newStat } : a));
    StorageService.saveApplications(updated);
    onApplicationsUpdated(updated);
  };

  const handleDelete = (id: string) => {
    const updated = applications.filter(a => a.id !== id);
    StorageService.saveApplications(updated);
    onApplicationsUpdated(updated);
  };

  const handleCreateApplication = () => {
    if (!newCompany.trim() || !newRole.trim()) return;

    const item: JobApplicationTrackerItem = {
      id: 'app-' + Date.now(),
      company: newCompany,
      role: newRole,
      location: newLocation,
      dateApplied: new Date().toISOString().split('T')[0],
      status: newStatus,
      notes: newNotes,
      savedAnswersCount: 0
    };

    const updated = [item, ...applications];
    StorageService.saveApplications(updated);
    onApplicationsUpdated(updated);

    // Reset
    setNewCompany('');
    setNewRole('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
              <Briefcase className="w-5 h-5 text-emerald-600 mr-2" />
              Job Application Tracker
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Track your tailored applications, interview pipelines, and status history stored entirely on your device.
            </p>
          </div>

          <button
            id="btn-add-application"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center self-start shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Application
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Applications ({applications.length})
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = applications.filter(a => a.status === key).length;
            if (count === 0 && filterStatus !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === key
                    ? 'bg-slate-900 text-white'
                    : `${config.bg} ${config.text} hover:opacity-80`
                }`}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Applications */}
      <div className="space-y-3">
        {filteredApps.length > 0 ? (
          filteredApps.map(app => {
            const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {app.company}
                    </h3>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm font-semibold text-slate-700">
                      {app.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Applied: {app.dateApplied}
                    </span>
                    {app.location && (
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {app.location}
                      </span>
                    )}
                    {app.savedAnswersCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {app.savedAnswersCount} auto-fill answers saved
                      </span>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-md">
                      {app.notes}
                    </p>
                  )}
                </div>

                {/* Status Switcher & Delete */}
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-1.5">
                    <StatusIcon className="w-4 h-4 text-slate-400" />
                    <select
                      value={app.status}
                      onChange={e => handleStatusChange(app.id, e.target.value as any)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                    >
                      <option value="drafting">Drafting</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Not Moving Forward</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDelete(app.id)}
                    title="Delete application"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              No applications matching &ldquo;{filterStatus}&rdquo;
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Auto-generate answers in the AutoFill tab or click &ldquo;Add Application&rdquo; above to track a target role.
            </p>
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Add New Job Application
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={e => setNewCompany(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic, Stripe"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. Remote or San Francisco, CA"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="drafting">Drafting</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Notes on recruiters, salary discussed, or tailored focus..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApplication}
                disabled={!newCompany.trim() || !newRole.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                Save Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
