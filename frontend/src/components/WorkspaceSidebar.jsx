import React, { useState } from 'react';
import './WorkspaceSidebar.css';

const WorkspaceSidebar = ({
  workspaces,
  currentWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
  });

  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Dark Orange
  ];

  const handleCreate = () => {
    if (formData.name.trim()) {
      onCreateWorkspace(formData);
      setFormData({ name: '', color: '#3B82F6' });
      setIsCreating(false);
    }
  };

  const handleUpdate = (workspaceId) => {
    if (formData.name.trim()) {
      onUpdateWorkspace(workspaceId, formData);
      setEditingId(null);
      setFormData({ name: '', color: '#3B82F6' });
    }
  };

  const startEdit = (workspace) => {
    setEditingId(workspace.id);
    setFormData({
      name: workspace.name,
      color: workspace.color,
    });
  };

  return (
    <div className="workspace-sidebar">
      {/* Header */}
      <div className="workspace-header">
        <h3>Workspaces</h3>
        <div className="header-buttons">
          <button
            className="icon-button"
            onClick={() => setIsCreating(true)}
            title="New Workspace"
            aria-label="Créer un workspace"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="workspace-form">
          <div className="form-header">
            <h4>Nouveau Workspace</h4>
            <button
              className="icon-button-small"
              onClick={() => {
                setIsCreating(false);
                setFormData({ name: '', color: '#3B82F6' });
              }}
            >
              ✕
            </button>
          </div>

          <input
            type="text"
            placeholder="Nom du workspace"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="workspace-name-input"
            autoFocus
          />

          {/* Color picker */}
          <div className="picker-section">
            <label>Couleur</label>
            <div className="color-picker">
              {colorOptions.map(color => (
                <button
                  key={color}
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <button
            className="create-button"
            onClick={handleCreate}
            disabled={!formData.name.trim()}
          >
            Créer
          </button>
        </div>
      )}

      {/* Workspaces list */}
      <div className="workspaces-list">
        {workspaces.map(workspace => (
          <div key={workspace.id}>
            {editingId === workspace.id ? (
              /* Edit form */
              <div className="workspace-form editing">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="workspace-name-input"
                />

                <div className="picker-section">
                  <label>Couleur</label>
                  <div className="color-picker">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="save-button"
                    onClick={() => handleUpdate(workspace.id)}
                  >
                    Enregistrer
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', color: '#3B82F6' });
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* Workspace item */
              <div
                className={`workspace-item ${workspace.id === currentWorkspaceId ? 'active' : ''}`}
                onClick={() => onSelectWorkspace(workspace.id)}
                style={{ borderLeft: `4px solid ${workspace.color}` }}
              >
                <div
                  className="workspace-color-dot"
                  style={{ background: workspace.color }}
                />
                <span className="workspace-name">{workspace.name}</span>

                <div className="workspace-actions">
                  <button
                    className="icon-button-tiny"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(workspace);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    className="icon-button-tiny delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer "${workspace.name}" ?`)) {
                        onDeleteWorkspace(workspace.id);
                      }
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
