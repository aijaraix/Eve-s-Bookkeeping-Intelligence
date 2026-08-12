import React, { useState } from 'react';
import { CheckSquare, Calendar, User, Clock, AlertTriangle, Plus, Filter, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Workspace } from '../types';

interface WorkflowCenterViewProps {
  workspaces: Workspace[];
  onNavigate: (view: string) => void;
}

export const WorkflowCenterView: React.FC<WorkflowCenterViewProps> = ({ workspaces, onNavigate }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [taskList, setTaskList] = useState<Array<{
    id: string;
    title: string;
    project: string;
    owner: string;
    dueDate: string;
    priority: string;
    status: string;
  }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      project: workspaces[0]?.name || 'General Engagement',
      owner: 'Admin User',
      dueDate: new Date().toLocaleDateString(),
      priority: newTaskPriority,
      status: 'In Progress'
    };
    setTaskList([newTask, ...taskList]);
    setNewTaskTitle('');
    setShowAddModal(false);
  };

  const filteredTasks = taskList.filter(t => filterStatus === 'all' || t.status === filterStatus);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">Workflow & Engagement Task Center</h1>
          <p className="text-xs text-neutral-500 mt-1">Audit milestone schedules, partner sign-off queues, and task delegations.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0b1739] text-white hover:bg-[#12224d] text-xs font-bold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Task</span>
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-extrabold text-sm text-neutral-900">Create Engagement Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Task Description / Milestone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review Revenue Cut-off Procedures"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Priority Level</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
          <div className="flex items-center space-x-2 text-xs font-bold">
            {['all', 'In Progress', 'Pending Review', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterStatus === status ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {status === 'all' ? `All Tasks (${taskList.length})` : status}
              </button>
            ))}
          </div>
        </div>

        {taskList.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-neutral-900">No Workflow Tasks Active</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                No engagement milestones or tasks have been assigned. Click "Assign New Task" above to add your first task.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task Now</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 text-xs">
            {filteredTasks.map(task => (
              <div key={task.id} className="py-3.5 flex items-center justify-between hover:bg-neutral-50 px-2 rounded-xl transition">
                <div className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                  <div>
                    <h4 className="font-bold text-neutral-900 text-sm">{task.title}</h4>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      {task.project} • Owner: <span className="text-neutral-800 font-semibold">{task.owner}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-mono text-neutral-500 font-semibold">{task.dueDate}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {task.priority} Priority
                  </span>
                  <span className="bg-neutral-100 text-neutral-800 font-bold px-2.5 py-0.5 rounded-full">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

