import { DocumentMapModel, SemanticExtractionTask } from './types.js';

export class NoteExtractionPlanner {
  /**
   * Evaluate DocumentMap and generate targeted semantic extraction tasks for material notes.
   */
  public static planMaterialNoteTasks(
    intakeId: string,
    documentId: string,
    documentMap: DocumentMapModel
  ): SemanticExtractionTask[] {
    const tasks: SemanticExtractionTask[] = [];
    const nowStr = new Date().toISOString();

    const importantNotes = documentMap.importantNotes || [];

    importantNotes.forEach((note, idx) => {
      const cat = (note.category || note.title || "").toLowerCase();
      // Target key categories: Revenue, Segment Reporting, Debt, Tax, Leases
      if (cat.includes("revenue") || cat.includes("segment") || cat.includes("debt") || cat.includes("tax") || cat.includes("lease")) {
        tasks.push({
          taskId: `TASK-${intakeId}-NOTE-${idx + 1}`,
          intakeId,
          documentId,
          taskType: 'EXTRACT_NOTE',
          status: 'QUEUED',
          attempts: 0,
          provider: 'google',
          model: process.env.PRIMARY_EXTRACTION_MODEL || 'gemini-3.6-flash',
          createdAt: nowStr,
          resultData: {
            noteNumber: note.noteNumber,
            noteTitle: note.title,
            noteCategory: note.category,
            physicalPages: note.physicalPages
          }
        });
      }
    });

    return tasks;
  }
}
