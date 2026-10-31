import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Lightbulb,
  ShieldCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { RecommendationItem, ApprovalStatus } from '../types';
import apiService from '../services/api';
import { Badge } from '../components/Badge';

export const ApprovalsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [id: string]: string }>({});

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getApprovals();
      setRecommendations(res);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, status: ApprovalStatus) => {
    setProcessingId(id);
    try {
      const comment = commentInput[id] || (status === 'approved' ? 'Approved by Delivery Lead' : 'Rejected after review');
      const updated = await apiService.updateApproval(id, status, comment);
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === id ? updated : rec))
      );
    } catch (err) {
      console.error('Failed to update approval status:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = recommendations.filter((r) => r.approval_status === 'pending').length;
  const approvedCount = recommendations.filter((r) => r.approval_status === 'approved').length;
  const rejectedCount = recommendations.filter((r) => r.approval_status === 'rejected').length;

  const filtered = recommendations.filter((r) => {
    if (filter === 'all') return true;
    return r.approval_status === filter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Mitigation Approvals</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Review, authorize, or reject AI-recommended actions. Approval state updates in memory without external project mutation.
          </p>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-semibold">
            Pending: {pendingCount}
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-semibold">
            Approved: {approvedCount}
          </div>
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg px-3 py-1.5 text-xs text-rose-300 font-semibold">
            Rejected: {rejectedCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'all', label: `All Proposals (${recommendations.length})` },
          { key: 'pending', label: `Pending Review (${pendingCount})` },
          { key: 'approved', label: `Approved (${approvedCount})` },
          { key: 'rejected', label: `Rejected (${rejectedCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Board */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Fetching mitigation proposals...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((item) => {
            const isProcessing = processingId === item.id;
            const isApproved = item.approval_status === 'approved';
            const isRejected = item.approval_status === 'rejected';
            const isPending = item.approval_status === 'pending';

            return (
              <div
                key={item.id}
                className={`bg-slate-900/80 border rounded-xl p-6 transition-all ${
                  isApproved
                    ? 'border-emerald-500/40'
                    : isRejected
                    ? 'border-rose-500/30 opacity-75'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        {item.id}
                      </span>
                      <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
                      <Badge variant="urgency" value={item.urgency}>
                        {item.urgency.toUpperCase()}
                      </Badge>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 capitalize">
                        {item.action_type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                        Pending Review
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Why It Matters & Projected Benefit */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Why It Matters:
                    </span>
                    <p className="text-xs text-slate-300">{item.why_it_matters}</p>
                  </div>

                  <div className="bg-emerald-950/10 border border-emerald-800/30 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Projected Delivery Benefit:
                    </span>
                    <p className="text-xs text-emerald-200">{item.projected_benefit}</p>
                  </div>
                </div>

                {/* Reviewer Note if already reviewed */}
                {item.reviewed_at && (
                  <div className="mt-3 p-2.5 rounded bg-slate-950 border border-slate-800/60 text-xs flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                      Review Note: <strong className="text-slate-300">{item.reviewer_comment}</strong>
                    </span>
                    <span className="text-[11px] text-slate-500">{item.reviewed_at}</span>
                  </div>
                )}

                {/* Action Buttons for Pending or Re-evaluating */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="w-full sm:w-auto flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Optional reviewer note/rationale..."
                      value={commentInput[item.id] || ''}
                      onChange={(e) =>
                        setCommentInput({ ...commentInput, [item.id]: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleAction(item.id, 'rejected')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(item.id, 'approved')}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve Action
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
              <CheckSquare className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No proposals in this status</h3>
              <p className="text-xs text-slate-500 mt-1">Try switching tabs to view all recommendations.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

