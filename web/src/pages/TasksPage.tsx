import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Task, Project, Pagination } from '../types';
import { TaskModal } from '../components/TaskModal';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects', { params: { limit: 100 } });
      setProjects(res.data.data);
    } catch (e) {}
  };

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTasks(1);
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks(1);
  };

  const handleCreateOrUpdate = async (taskData: any) => {
    if (editingTask) {
      await api.put(`/tasks/${editingTask.id}`, taskData);
    } else {
      await api.post('/tasks', taskData);
    }
    fetchTasks(pagination.page);
  };

  const handleMarkCompleted = async (task: Task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/tasks/${task.id}`, { status: newStatus });
      fetchTasks(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${name}"?`)) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div className="page-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Tasks</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Track and execute tasks across all active projects
          </p>
        </div>

        <button
          id="create-global-task-btn"
          onClick={() => {
            if (projects.length === 0) {
              alert('Please create a project first before adding tasks.');
              return;
            }
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <input
              id="global-task-search-input"
              type="text"
              className="form-input"
              placeholder="Search tasks by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              id="global-task-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              id="global-task-priority-filter"
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <button id="global-task-search-btn" type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '14px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ width: '36px', height: '36px' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckSquare size={48} style={{ color: '#64748b', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Tasks Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '6px', maxWidth: '400px', margin: '6px auto 20px' }}>
            {projects.length === 0
              ? 'You need to create a project before adding tasks.'
              : 'Add your first task to start tracking work.'}
          </p>
          {projects.length > 0 ? (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="btn btn-primary"
            >
              <Plus size={16} />
              <span>Create Task</span>
            </button>
          ) : (
            <Link to="/projects" className="btn btn-primary">
              <span>Go to Projects</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((t) => {
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

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                        {t.project && (
                          <Link to={`/projects/${t.project.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#818cf8' }}>
                            <FolderKanban size={12} />
                            <span>{t.project.name}</span>
                          </Link>
                        )}
                        {t.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>Created: {new Date(t.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

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
                          setIsModalOpen(true);
                        }}
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                        title="Edit Task"
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id, t.name)}
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

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchTasks(pagination.page - 1)}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
              </span>

              <button
                className="btn btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTasks(pagination.page + 1)}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        taskToEdit={editingTask}
        projects={projects}
      />
    </div>
  );
};
