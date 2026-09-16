import React from 'react';
import { actionAttributes } from '../../../academy/uiActionRegistry';
import { InvoiceApReviewPanel } from './InvoiceApReviewPanel';
const readable = (value: any): string => value === null || value === undefined ? 'Not recorded' : typeof value === 'string' ? value : typeof value === 'object' ? JSON.stringify(value) : String(value);
export const RecordedEngagementEvidenceView: React.FC<{detail: any; period: string; findingsOnly?: boolean}> = ({detail,period,findingsOnly}) => {
  if (!detail) return <p className="p-6">No current engagement evidence is available.</p>;
  const continuation = detail.continuation;
  return <div className="p-6 space-y-5">
    <h1 className="text-xl font-semibold">{findingsOnly ? 'Findings and review' : 'Saved source and specialist evidence'}</h1>
    <p>{readable(detail.clientName)} · Selected period: {period || 'Not recorded'}</p>
    {findingsOnly ? <>
      <p>These are recorded findings and limitations. No review or approval is created by viewing them.</p>
      {[...(detail.findings || []), ...(continuation?.structuredUncertainties || []).map((row: any) => ({...typeof row.finding === 'object' ? row.finding : {description:row.finding},agentId:row.agentId}))].map((finding: any,index:number) => <article key={finding.id || index} className="border rounded-xl p-4 space-y-2 whitespace-pre-wrap break-words">
        <h2 className="font-semibold">{readable(finding.topic || finding.title || finding.type || finding.category || finding.agentId)}</h2>
        <p>{readable(finding.description || finding.message || finding.details || finding)}</p>
        <p>Recorded state: {readable(finding.status)}; source references: {readable(finding.sourceReferences || finding.sourceRefs || finding.references || finding.factIds || finding.documentId)}</p>
      </article>)}
      {!(detail.findings?.length || continuation?.structuredUncertainties?.length) && <p>No findings returned. This is not a clearance or completeness opinion.</p>}
    </> : <>
      <InvoiceApReviewPanel invoices={Array.isArray(detail.apInvoices) ? detail.apInvoices : []} />
      <section className="border rounded-xl p-4 space-y-2"><h2 className="font-semibold">Original documents</h2>{(detail.documents || []).map((doc:any) => <div key={doc.id} className="space-y-1"><p>{readable(doc.originalName || doc.filename || doc.name)} · {readable(doc.id)}</p><p className="break-all">SHA-256: {readable(doc.sha256)}</p>{doc.id && detail.workspaceId && <a className="text-indigo-700 underline" {...actionAttributes('evidence.source.download', doc.id)} href={`/api/documents/${encodeURIComponent(doc.id)}/download?workspaceId=${encodeURIComponent(detail.workspaceId)}`}>Download original source</a>}</div>)}</section>
      <section className="border rounded-xl p-4 space-y-2"><h2 className="font-semibold">Recorded continuation</h2><p>{readable(continuation?.continuationId)} · Job: {readable(continuation?.jobId)} · Attempt: {readable(continuation?.jobAttempt)}</p><p>Review state: {readable(continuation?.status)}</p></section>
      <section className="space-y-3"><h2 className="font-semibold">Specialist records</h2>{(continuation?.specialistSummary?.jobs || []).map((job:any,index:number) => <article key={job.agentExecutionId || index} className="border rounded-xl p-4 space-y-2"><h3>{readable(job.agentId)} · {readable(job.agentExecutionId)}</h3><p>Recorded mechanism: {readable(job.executionMechanism)}; model state: {readable(job.modelCallStatus)}.</p><p>Recorded proof label: {readable(job.proofLevel)}. File integrity and current model availability require separate verification.</p><p className="break-all">Artifact: {readable(job.persistedArtifactPath)}</p></article>)}</section>
      <p>Use a financial value’s evidence drawer for its actual saved quote. Missing page or block proof remains missing.</p>
    </>}
  </div>;
};
