import { useState } from 'react';
import {
  Users, UserPlus, Trash2, Edit3, Shield, CheckCircle2, XCircle,
  Plus, Lock, Unlock, Key, Network, Settings, ChevronRight,
  AlertCircle, Check,
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useSystemStore } from '../../store/systemStore';
import type { UserProfile, Group, Permission } from '../../types';
import './UserManager.css';

/* ─── Helpers ─── */
const PERM_LABELS: Record<Permission, string> = {
  none: 'Sin acceso', read: 'Solo lectura', write: 'Lectura/Escritura', admin: 'Administrador',
};

const PERM_COLORS: Record<Permission, string> = {
  none: 'var(--text-muted)', read: '#3b82f6', write: '#10b981', admin: '#f59e0b',
};

function PermBadge({ perm }: { perm: Permission }) {
  return (
    <span className="um__perm-badge" style={{ color: PERM_COLORS[perm], background: PERM_COLORS[perm] + '18' }}>
      {PERM_LABELS[perm]}
    </span>
  );
}

function StatusBadge({ status }: { status: UserProfile['status'] }) {
  const cfg = { active: ['Activo', '#00b87c'], inactive: ['Inactivo', '#6b7280'], locked: ['Bloqueado', '#ef4444'] }[status];
  return <span className="um__status-badge" style={{ color: cfg[1], background: cfg[1] + '18' }}>{cfg[0]}</span>;
}

/* ─── User detail / edit panel ─── */
function UserDetail({
  user, groups, onClose, onSave,
}: {
  user: UserProfile | null;
  groups: Group[];
  onClose: () => void;
  onSave: (id: string, patch: Partial<UserProfile>) => { ok: boolean; error?: string };
}) {
  const [form, setForm] = useState<Partial<UserProfile>>(user ?? {
    username: '', displayName: '', email: '', isAdmin: false,
    status: 'active', quota: 0, description: '',
    canSMB: false, canFTP: false, canSFTP: false, canSSH: false, groups: [],
  });
  const [error, setError] = useState('');
  const { addUser } = useUserStore();
  const { addNotification } = useSystemStore();
  const isNew = !user;

  const save = () => {
    if (!form.username?.trim()) { setError('El nombre de usuario es requerido'); return; }
    if (!form.displayName?.trim()) { setError('El nombre para mostrar es requerido'); return; }
    setError('');

    if (isNew) {
      const res = addUser(form as Omit<UserProfile, 'id' | 'createdAt'>);
      if (!res.ok) { setError(res.error ?? 'Error'); return; }
      addNotification('Usuario creado', `"${form.username}" creado correctamente`, 'success');
    } else {
      const res = onSave(user.id, form);
      if (!res.ok) { setError(res.error ?? 'Error al actualizar'); return; }
      addNotification('Usuario actualizado', `"${form.username}" guardado`, 'success');
      onClose();
    }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="um__detail-row">
      <span className="um__detail-label">{label}</span>
      <div className="um__detail-val">{children}</div>
    </div>
  );

  const Input = ({ field, placeholder, type = 'text' }: { field: keyof UserProfile; placeholder?: string; type?: string }) => (
    <input
      className="um__input"
      type={type}
      placeholder={placeholder}
      value={(form[field] as string) ?? ''}
      onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
    />
  );

  const Toggle = ({ field, label }: { field: keyof UserProfile; label: string }) => (
    <label className="um__toggle-row">
      <span>{label}</span>
      <label className="um__switch">
        <input type="checkbox" checked={!!form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.checked }))} />
        <span className="um__switch-slider" />
      </label>
    </label>
  );

  return (
    <div className="um__detail">
      <div className="um__detail-header">
        <div className="um__detail-avatar">{(form.displayName?.[0] || form.username?.[0] || '?').toUpperCase()}</div>
        <div>
          <h3>{isNew ? 'Nuevo usuario' : form.displayName}</h3>
          {!isNew && <span className="um__detail-username">@{form.username}</span>}
        </div>
        <button className="um__close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="um__detail-body">
        {error && <div className="um__error"><AlertCircle size={13}/> {error}</div>}

        <div className="um__detail-section">Información básica</div>
        <Field label="Usuario"><Input field="username" placeholder="nombre_usuario"/></Field>
        <Field label="Nombre completo"><Input field="displayName" placeholder="Nombre Apellido"/></Field>
        <Field label="Email"><Input field="email" type="email" placeholder="usuario@dominio.local"/></Field>
        <Field label="Descripción"><Input field="description" placeholder="Descripción opcional"/></Field>

        <div className="um__detail-section">Cuenta</div>
        <Field label="Estado">
          <select className="um__input" value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value as UserProfile['status'] }))}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="locked">Bloqueado</option>
          </select>
        </Field>
        <Toggle field="isAdmin" label="Administrador del sistema"/>
        <Field label="Cuota (MB, 0=ilimitada)">
          <input className="um__input" type="number" min={0}
            value={form.quota ?? 0}
            onChange={e => setForm(p => ({ ...p, quota: parseInt(e.target.value) || 0 }))}/>
        </Field>

        <div className="um__detail-section">Protocolos de acceso</div>
        <Toggle field="canSMB"  label="SMB / CIFS (Windows/macOS)"/>
        <Toggle field="canFTP"  label="FTP"/>
        <Toggle field="canSFTP" label="SFTP / SSH File Transfer"/>
        <Toggle field="canSSH"  label="SSH (terminal)"/>
      </div>

      <div className="um__detail-footer">
        <button className="um__btn um__btn--primary" onClick={save}>
          <Check size={13}/> {isNew ? 'Crear usuario' : 'Guardar cambios'}
        </button>
        <button className="um__btn" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── Group detail / edit panel ─── */
function GroupDetail({
  group, allUsers, onClose,
}: { group: Group | null; allUsers: UserProfile[]; onClose: () => void }) {
  const [name, setName]     = useState(group?.name ?? '');
  const [desc, setDesc]     = useState(group?.description ?? '');
  const [error, setError]   = useState('');
  const { addGroup, updateGroup, addGroupMember, removeGroupMember } = useUserStore();
  const { addNotification } = useSystemStore();
  const isNew = !group;
  const members = allUsers.filter(u => group?.members.includes(u.id));
  const nonMembers = allUsers.filter(u => !group?.members.includes(u.id));

  const save = () => {
    if (!name.trim()) { setError('El nombre del grupo es requerido'); return; }
    setError('');
    if (isNew) {
      const res = addGroup({ name, description: desc, members: [], permissions: {}, builtIn: false });
      if (!res.ok) { setError(res.error ?? 'Error'); return; }
      addNotification('Grupo creado', name, 'success');
    } else {
      updateGroup(group.id, { name, description: desc });
      addNotification('Grupo actualizado', name, 'success');
    }
    if (isNew) onClose();
  };

  return (
    <div className="um__detail">
      <div className="um__detail-header">
        <div className="um__detail-avatar um__detail-avatar--group"><Shield size={18}/></div>
        <div>
          <h3>{isNew ? 'Nuevo grupo' : group?.name}</h3>
          {!isNew && <span className="um__detail-username">{members.length} miembros</span>}
        </div>
        <button className="um__close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="um__detail-body">
        {error && <div className="um__error"><AlertCircle size={13}/> {error}</div>}
        <div className="um__detail-section">Información</div>
        <div className="um__detail-row">
          <span className="um__detail-label">Nombre</span>
          <input className="um__input" value={name} onChange={e => setName(e.target.value)}
            disabled={group?.builtIn} placeholder="nombre-grupo"/>
        </div>
        <div className="um__detail-row">
          <span className="um__detail-label">Descripción</span>
          <input className="um__input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción"/>
        </div>

        {!isNew && (
          <>
            <div className="um__detail-section">Miembros del grupo</div>
            {members.map(u => (
              <div key={u.id} className="um__member-row">
                <div className="um__member-avatar">{u.displayName[0]}</div>
                <span className="um__member-name">{u.displayName}</span>
                <span className="um__member-user">@{u.username}</span>
                {!group.builtIn && (
                  <button className="um__icon-btn um__icon-btn--danger"
                    onClick={() => removeGroupMember(group.id, u.id)}>
                    <Trash2 size={12}/>
                  </button>
                )}
              </div>
            ))}
            {nonMembers.length > 0 && (
              <>
                <div className="um__detail-section" style={{ marginTop: 8 }}>Añadir miembro</div>
                {nonMembers.map(u => (
                  <div key={u.id} className="um__member-row um__member-row--add">
                    <div className="um__member-avatar">{u.displayName[0]}</div>
                    <span className="um__member-name">{u.displayName}</span>
                    <button className="um__icon-btn um__icon-btn--add"
                      onClick={() => addGroupMember(group.id, u.id)}>
                      <Plus size={12}/>
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
      <div className="um__detail-footer">
        {!group?.builtIn && (
          <button className="um__btn um__btn--primary" onClick={save}>
            <Check size={13}/> {isNew ? 'Crear grupo' : 'Guardar'}
          </button>
        )}
        <button className="um__btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

/* ─── Permissions matrix ─── */
function PermissionsMatrix() {
  const { groups, setGroupPermission } = useUserStore();
  const FOLDERS = [
    { id: 'sf-docs',   label: 'Documentos' },
    { id: 'sf-media',  label: 'Multimedia' },
    { id: 'sf-backup', label: 'Backup' },
    { id: 'sf-web',    label: 'Web' },
  ];
  const PERMS: Permission[] = ['none', 'read', 'write', 'admin'];

  return (
    <div className="um__matrix">
      <div className="um__matrix-title">Permisos por grupo en carpetas compartidas</div>
      <div className="um__matrix-table">
        <div className="um__matrix-header">
          <span>Grupo</span>
          {FOLDERS.map(f => <span key={f.id}>{f.label}</span>)}
        </div>
        {groups.map(g => (
          <div key={g.id} className="um__matrix-row">
            <div className="um__matrix-group">
              <Shield size={12} style={{ color: 'var(--color-primary)' }}/>
              <span>{g.name}</span>
              {g.builtIn && <span className="um__builtin">sistema</span>}
            </div>
            {FOLDERS.map(f => {
              const current: Permission = g.permissions[f.id] ?? 'none';
              return (
                <div key={f.id} className="um__matrix-cell">
                  <select
                    className="um__perm-select"
                    value={current}
                    style={{ color: PERM_COLORS[current] }}
                    onChange={e => setGroupPermission(g.id, f.id, e.target.value as Permission)}
                  >
                    {PERMS.map(p => <option key={p} value={p}>{PERM_LABELS[p]}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
type Tab = 'users' | 'groups' | 'permissions';

export function UserManager() {
  const { users, groups, deleteUser, deleteGroup, updateUser, setUserStatus } = useUserStore();
  const { addNotification } = useSystemStore();
  const [tab, setTab]               = useState<Tab>('users');
  const [selectedUser, setSelectedUser]   = useState<UserProfile | null | 'new'>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null | 'new'>(null);
  const [search, setSearch]         = useState('');

  const filteredUsers  = users.filter(u =>
    !search || u.username.includes(search) || u.displayName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter(g =>
    !search || g.name.includes(search) || g.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = (u: UserProfile) => {
    const res = deleteUser(u.id);
    if (!res.ok) addNotification('Error', res.error!, 'error');
    else addNotification('Usuario eliminado', u.displayName, 'warning');
  };

  const handleDeleteGroup = (g: Group) => {
    const res = deleteGroup(g.id);
    if (!res.ok) addNotification('Error', res.error!, 'error');
    else addNotification('Grupo eliminado', g.name, 'warning');
  };

  return (
    <div className="um">
      {/* Sidebar */}
      <div className="um__sidebar">
        <div className="um__sidebar-logo">
          <div className="um__sidebar-logo-icon"><Users size={18}/></div>
          <span>Usuarios y Grupos</span>
        </div>
        {([
          { id: 'users',       label: 'Usuarios',     icon: <Users size={14}/>,   count: users.length },
          { id: 'groups',      label: 'Grupos',       icon: <Shield size={14}/>,  count: groups.length },
          { id: 'permissions', label: 'Permisos',     icon: <Key size={14}/>,     count: null },
        ] as { id: Tab; label: string; icon: React.ReactNode; count: number | null }[]).map(t => (
          <button key={t.id} className={`um__nav-item ${tab === t.id ? 'um__nav-item--active' : ''}`}
            onClick={() => { setTab(t.id); setSearch(''); }}>
            {t.icon} {t.label}
            {t.count !== null && <span className="um__nav-count">{t.count}</span>}
          </button>
        ))}

        {/* Stats */}
        <div className="um__sidebar-stats">
          <div className="um__stat-row"><span>Activos</span><strong style={{ color: '#00b87c' }}>{users.filter(u => u.status === 'active').length}</strong></div>
          <div className="um__stat-row"><span>Inactivos</span><strong style={{ color: '#6b7280' }}>{users.filter(u => u.status === 'inactive').length}</strong></div>
          <div className="um__stat-row"><span>Bloqueados</span><strong style={{ color: '#ef4444' }}>{users.filter(u => u.status === 'locked').length}</strong></div>
        </div>
      </div>

      {/* Main content */}
      <div className="um__main">
        {/* Toolbar */}
        <div className="um__toolbar">
          <input
            className="um__search"
            placeholder={tab === 'users' ? 'Buscar usuarios…' : 'Buscar grupos…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {tab === 'users' && (
            <button className="um__btn um__btn--primary" onClick={() => setSelectedUser('new')}>
              <UserPlus size={13}/> Nuevo usuario
            </button>
          )}
          {tab === 'groups' && (
            <button className="um__btn um__btn--primary" onClick={() => setSelectedGroup('new')}>
              <Plus size={13}/> Nuevo grupo
            </button>
          )}
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="um__table-wrap">
            <div className="um__thead">
              <span>Usuario</span><span>Estado</span><span>Grupos</span>
              <span>SMB</span><span>FTP</span><span>SFTP</span><span>SSH</span>
              <span>Cuota</span><span></span>
            </div>
            {filteredUsers.map(u => {
              const userGroups = groups.filter(g => u.groups.includes(g.id));
              return (
                <div key={u.id} className="um__tbody-row" onClick={() => setSelectedUser(u)}>
                  <div className="um__user-cell">
                    <div className="um__user-avatar">{u.displayName[0]}</div>
                    <div>
                      <span className="um__user-name">{u.displayName}</span>
                      <span className="um__user-login">@{u.username}</span>
                    </div>
                    {u.isAdmin && <span className="um__admin-badge">Admin</span>}
                  </div>
                  <StatusBadge status={u.status}/>
                  <div className="um__group-tags">
                    {userGroups.slice(0, 2).map(g => (
                      <span key={g.id} className="um__group-tag">{g.name}</span>
                    ))}
                    {userGroups.length > 2 && <span className="um__group-tag">+{userGroups.length - 2}</span>}
                  </div>
                  {(['canSMB','canFTP','canSFTP','canSSH'] as (keyof UserProfile)[]).map(field => (
                    <div key={field} className="um__proto-cell">
                      {u[field]
                        ? <CheckCircle2 size={14} style={{ color: '#00b87c' }}/>
                        : <XCircle size={14} style={{ color: 'var(--border-color-strong)' }}/>
                      }
                    </div>
                  ))}
                  <div className="um__quota-cell">
                    {u.quota === 0 ? <span style={{ color: 'var(--text-muted)' }}>Ilimitada</span> : `${Math.round((u.quota ?? 0) / 1024)} GB`}
                  </div>
                  <div className="um__actions-cell" onClick={e => e.stopPropagation()}>
                    <button className="um__icon-btn" title="Editar" onClick={() => setSelectedUser(u)}><Edit3 size={13}/></button>
                    {u.status === 'active'
                      ? <button className="um__icon-btn" title="Bloquear" onClick={() => setUserStatus(u.id, 'locked')}><Lock size={13}/></button>
                      : <button className="um__icon-btn" title="Activar" onClick={() => setUserStatus(u.id, 'active')}><Unlock size={13}/></button>
                    }
                    <button className="um__icon-btn um__icon-btn--danger" title="Eliminar"
                      onClick={() => handleDeleteUser(u)}><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Groups tab */}
        {tab === 'groups' && (
          <div className="um__table-wrap">
            <div className="um__thead um__thead--groups">
              <span>Grupo</span><span>Miembros</span><span>Descripción</span><span></span>
            </div>
            {filteredGroups.map(g => {
              const memberUsers = users.filter(u => g.members.includes(u.id));
              return (
                <div key={g.id} className="um__tbody-row" onClick={() => setSelectedGroup(g)}>
                  <div className="um__group-cell">
                    <Shield size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }}/>
                    <span className="um__group-name">{g.name}</span>
                    {g.builtIn && <span className="um__builtin">sistema</span>}
                  </div>
                  <div className="um__members-preview">
                    {memberUsers.slice(0, 4).map(u => (
                      <div key={u.id} className="um__mini-avatar" title={u.displayName}>{u.displayName[0]}</div>
                    ))}
                    {memberUsers.length > 4 && <span className="um__mini-more">+{memberUsers.length - 4}</span>}
                    {memberUsers.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Sin miembros</span>}
                  </div>
                  <span className="um__group-desc">{g.description}</span>
                  <div className="um__actions-cell" onClick={e => e.stopPropagation()}>
                    <button className="um__icon-btn" onClick={() => setSelectedGroup(g)}><Edit3 size={13}/></button>
                    {!g.builtIn && (
                      <button className="um__icon-btn um__icon-btn--danger" onClick={() => handleDeleteGroup(g)}><Trash2 size={13}/></button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Permissions matrix */}
        {tab === 'permissions' && <PermissionsMatrix/>}
      </div>

      {/* Side panel */}
      {selectedUser !== null && (
        <UserDetail
          user={selectedUser === 'new' ? null : selectedUser}
          groups={groups}
          onClose={() => setSelectedUser(null)}
          onSave={(id, patch) => updateUser(id, patch)}
        />
      )}
      {selectedGroup !== null && (
        <GroupDetail
          group={selectedGroup === 'new' ? null : selectedGroup}
          allUsers={users}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
