import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Project, Task } from '../types';
import { TaskModal } from '../components/TaskModal';
import { ProjectModal } from '../components/ProjectModal';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Search,
  Layers,
} from 'lucide-react';

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for tasks
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
      setTasks(res.data.data.tasks || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleTaskCreateOrUpdate = async (taskData: any) => {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, taskData);
    } else {
      await api.post('/tasks', { ...taskData, projectId: id });
    }
    fetchProjectDetails();
  };

  const handleMarkCompleted = async (task: Task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleTaskDelete = async (taskId: string, taskName: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskName}"?`)) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProjectDetails();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleProjectUpdate = async (projectData: any) => {
    await api.put(`/projects/${id}`, projectData);
    fetchProjectDetails();
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = search ? t.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesStatus = statusFilter ? t.status === statusFilter : true;
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="page-body" style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <div className="spinner" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-body">
        <div style={{ padding: '24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px' }}>
          <h3>Error</h3>
          <p>{error || 'Project not found'}</p>
          <Link to="/projects" className="btn btn-secondary" style={{ marginTop: '16px' }}>
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      {/* Back button */}
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {/* Project Header Card */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{project.name}</h1>
              <span className={`badge badge-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {project.status}
              </span>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '700px', lineHeight: '1.5' }}>
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsProjectModalOpen(true)} className="btn btn-secondary">
              <Edit size={16} />
              <span>Edit Project</span>
            </button>
            <button
              id="create-task-in-project-btn"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Project Meta Dates */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #334155', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>
            <span style={{ color: '#64748b' }}>Created: </span>
            {new Date(project.createdAt).toLocaleDateString()}
          </div>
          {project.startDate && (
            <div>
              <span style={{ color: '#64748b' }}>Start Date: </span>
              {new Date(project.startDate).toLocaleDateString()}
            </div>
          )}
          {project.endDate && (
            <div>
              <span style={{ color: '#64748b' }}>End Date: </span>
              {new Date(project.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section Header & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
          Tasks ({filteredTasks.length} / {tasks.length})
        </h2>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <input
              id="task-search-input"
              type="text"
              className="form-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', paddingBottom: '8px', paddingTop: '8px', fontSize: '0.85rem' }}
            />
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <select
            id="task-status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '140px', paddingBottom: '8px', paddingTop: '8px', fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            id="task-priority-filter"
            className="form-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '130px', paddingBottom: '8px', paddingTop: '8px', fontSize: '0.85rem' }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Layers size={36} style={{ color: '#64748b', margin: '0 auto 12px' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No tasks found matching current criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTasks.map((t) => {
            const isDone = t.status === 'Completed';
            return (
              <div
                key={t.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: isDone ? 'rgba(15, 23, 42, 0.4)' : undefined,
                  borderLeft: isDone ? '4px solid #10b981' : '4px solid #6366f1',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* Working Direct Action: Mark as completed button */}
                  <button
                    id={`complete-task-btn-${t.id}`}
                    onClick={() => handleMarkCompleted(t)}
                    style={{
                      background: 'none',
                      color: isDone ? '#10b981' : '#64748b',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
                  >
                    <CheckCircle2 size={24} />
                  </button>

                  <div>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      textDecoration: isDone ? 'line-through' : 'none',
                      color: isDone ? '#94a3b8' : '#fff'
                    }}>
                      {t.name}
                    </div>

                    {t.description && (
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                        {t.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                      {t.dueDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>
                    {t.priority}
                  </span>

                  <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {t.status}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setEditingTask(t);
                        setIsTaskModalOpen(true);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                      title="Edit Task"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleTaskDelete(t.id, t.name)}
                      className="btn btn-danger"
                      style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                      title="Delete Task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskCreateOrUpdate}
        taskToEdit={editingTask}
        projects={project ? [project] : []}
        defaultProjectId={project?.id}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectUpdate}
        projectToEdit={project}
      />
    </div>
  );
};
