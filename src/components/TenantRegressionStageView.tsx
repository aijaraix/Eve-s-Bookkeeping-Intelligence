import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RefreshCw, 
  Key, 
  Layers, 
  Check, 
  Clock, 
  AlertTriangle, 
  Database,
  Building,
  Globe,
  DollarSign,
  Sparkles,
  FileCheck2
} from 'lucide-react';
import { TenantRolePermission, RegressionSuiteRun, RegressionTestCase } from '../types';

interface Props {
  workspaceId: string;
}

export const TenantRegressionStageView: React.FC<Props> = ({ workspaceId }) => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'AUDITOR' | 'REVIEWER' | 'READ_ONLY'>('ADMIN');
  const [permissions, setPermissions] = useState<TenantRolePermission | null>(null);
  const [authCheckResult, setAuthCheckResult] = useState<any>(null);
  
  // Regression suite state
  const [regressionRun, setRegressionRun] = useState<RegressionSuiteRun | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'security' | 'regression'>('regression');

  useEffect(() => {
    fetchRolePermissions(selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    // Auto execute initial regression run on mount
    runRegressionSuite();
  }, [workspaceId]);

  const fetchRolePermissions = async (role: string) => {
    try {
      const res = await fetch(`/api/tenant/permissions?role=${role}`);
      const data = await res.json();
      if (data.success) {
        setPermissions(data.permissions);
      }
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
    }
  };

  const testWorkspaceAuth = async (action?: string) => {
    try {
      const res = await fetch(`/api/tenant/authorize-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `user-${selectedRole.toLowerCase()}-1`,
          workspaceId,
          action
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuthCheckResult(data);
      }
    } catch (err) {
      console.error('Auth test failed:', err);
    }
  };

  const runRegressionSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch(`/api/test/regression-suite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
      const data = await res.json();
      if (data.success && data.runResult) {
        setRegressionRun(data.runResult);
      }
    } catch (err) {
      console.error('Regression suite execution failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Stage 5 Final Pipeline
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Isolation, Role Security & End-to-End Regression Validation</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Strict role-based workspace security enforcement combined with an automated multi-document, multi-language, multi-currency integration suite.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runRegressionSuite}
              disabled={isRunningTests}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-md transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Running Integration Suite...' : 'Run Full Regression Suite'}
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('regression')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'regression' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            5.2 Multi-Stage Regression Suite
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition ${
              activeTab === 'security' 
                ? 'bg-emerald-600 text-white shadow' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            5.1 Tenant Isolation & Role Security Matrix
          </button>
        </div>
      </div>

      {/* TAB 1: 5.2 End-to-End Regression Validation Suite */}
      {activeTab === 'regression' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium block">Total Tests Executed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {regressionRun?.totalTests || 0}
                </span>
                <span className="text-xs text-slate-400">test cases</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium block">Suite Pass Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {regressionRun?.passRatePercentage || 0}%
                </span>
                <span className="text-xs text-emerald-500 font-semibold">100% Target</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium block">Passed / Failed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-600">
                  {regressionRun?.passedCount || 0} Passed
                </span>
                <span className="text-xs text-slate-400">/ {regressionRun?.failedCount || 0} Failed</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
              <span className="text-slate-500 text-xs font-medium block">Total Execution Time</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {regressionRun?.durationMs || 0}
                </span>
                <span className="text-xs text-slate-400">ms</span>
              </div>
            </div>
          </div>

          {/* Test Case Detailed Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Integration Regression Test Cases
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifies page preservation, multi-currency FX conversion, candidate backfill, and accounting rules across active workspace datasets.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">Run ID: {regressionRun?.runId}</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {regressionRun?.testCases.map((tc: RegressionTestCase) => (
                <div key={tc.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tc.status === 'PASSED' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {tc.status === 'PASSED' ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {tc.status}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tc.name}</h4>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tc.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">Input Dataset</span>
                      <span className="text-slate-700 dark:text-slate-300">{tc.inputSummary}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-sans font-semibold block">Actual Execution Outcome</span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">{tc.actualOutcome}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic pt-0.5">{tc.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5.1 Tenant Isolation & Role Security */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                  Tenant Role Security & Authorization Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulate user authorization across workspace boundaries according to role permissions.
                </p>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Active Role:</span>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as any)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="AUDITOR">AUDITOR (Read & Verify)</option>
                  <option value="REVIEWER">REVIEWER (Review Only)</option>
                  <option value="READ_ONLY">READ_ONLY (View Only)</option>
                </select>
              </div>
            </div>

            {/* Permission Matrix Grid */}
            {permissions && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Read Extracted Facts</span>
                  {permissions.canReadFacts ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Edit / Correct Facts</span>
                  {permissions.canEditFacts ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Approve Candidates</span>
                  {permissions.canApproveCandidates ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Manage Entities</span>
                  {permissions.canManageEntities ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Manage FX Exchange Rates</span>
                  {permissions.canManageFxRates ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Run Regression Suite</span>
                  {permissions.canRunRegressionSuite ? (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">GRANTED</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-full">DENIED</span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <button
                onClick={() => testWorkspaceAuth('canManageEntities')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition"
              >
                Test Restricted Action (Manage Entities)
              </button>

              {authCheckResult && (
                <div className={`text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 ${
                  authCheckResult.authorized 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {authCheckResult.authorized ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {authCheckResult.authorized ? 'Action Authorized' : authCheckResult.reason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
