import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { deleteClient, deleteUser, disableUser, getAllUsers, getClients, getProfileImage, updateUserRole, saveClient } from '../utils/propertyStorage';

const clientBlank = { name: '', phone: '', email: '', propertyInterested: '', meetingDate: '', notes: '', status: 'New' };
export function Clients() { return <Collection type="client" title="Clients" blank={clientBlank} fields={[['name','Client Name'],['phone','Phone'],['email','Email','email'],['propertyInterested','Property Interested In'],['meetingDate','Meeting Date','date'],['status','Status'],['notes','Notes']]} />; }
function Collection({ title, blank, fields }) { const { user } = useAuth(); const [items,setItems]=useState([]),[form,setForm]=useState(null),[query,setQuery]=useState(''); const load=()=>setItems(getClients(user?.uid)); useEffect(()=>{if(user?.uid)load()},[user?.uid]); const save=e=>{e.preventDefault();if(!form.name)return toast.error('Name is required.');saveClient(user.uid,form);load();setForm(null);toast.success(`${title.slice(0,-1)} saved.`)}; const remove=id=>{if(window.confirm(`Delete this ${title.slice(0,-1).toLowerCase()}?`)){deleteClient(user.uid,id);load();toast.success('Deleted.')}}; const shown=items.filter(x=>Object.values(x).join(' ').toLowerCase().includes(query.toLowerCase())); return <ProtectedLayout title={title} subtitle={`Create, edit, search, and track ${title.toLowerCase()}.`}><div className="glass-card panel-card"><div className="card-head"><div><p className="eyebrow">Management</p><h4>{title}</h4></div><button className="btn btn-primary" onClick={()=>setForm(blank)}>Add {title.slice(0,-1)}</button></div><label><span>Search</span><input value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="table-shell"><table><thead><tr>{fields.slice(0,4).map(f=><th key={f[0]}>{f[1]}</th>)}<th>Actions</th></tr></thead><tbody>{shown.map(x=><tr key={x.id}>{fields.slice(0,4).map(f=><td key={f[0]}>{x[f[0]]}</td>)}<td><button className="table-action" onClick={()=>setForm(x)}>Edit</button><button className="table-action" onClick={()=>remove(x.id)}>Delete</button></td></tr>)}{!shown.length&&<tr><td colSpan="5">No {title.toLowerCase()} yet.</td></tr>}</tbody></table></div></div>{form&&<div className="modal-backdrop"><form className="modal-card" onSubmit={save}><h3>{form.id?'Edit':'Add'} {title.slice(0,-1)}</h3><div className="field-grid">{fields.map(([name,label,inputType])=><label key={name}><span>{label}</span>{name==='status'?<select name={name} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}>{['New','Contacted','Viewing Scheduled','Offer Made','Closed'].map(x=><option key={x}>{x}</option>)}</select>:name==='notes'?<textarea name={name} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}/>:<input type={inputType||'text'} name={name} value={form[name]} onChange={e=>setForm({...form,[name]:e.target.value})}/>}</label>)}</div><div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={()=>setForm(null)}>Cancel</button><button className="btn btn-primary">Save</button></div></form></div>}</ProtectedLayout> }

export function Users() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const load = () => setUsers(getAllUsers());
  useEffect(load, []);

  const setRole = (u, nextRole) => {
    updateUserRole(u.id, nextRole);
    load();
    toast.success('Role updated.');
  };

  const toggleDisable = (u) => {
    disableUser(u.id, !u.disabled);
    load();
    toast.success(u.disabled ? 'User enabled.' : 'User disabled.');
  };

  const remove = (u) => {
    if (window.confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) {
      deleteUser(u.id);
      load();
      toast.success('User deleted.');
    }
  };

  const shown = useMemo(() => {
    let list = users.filter((u) => {
      const matchesQuery = `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? !u.disabled : u.disabled);
      return matchesQuery && matchesRole && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      const av = a[sortBy] || '';
      const bv = b[sortBy] || '';
      return String(av).localeCompare(String(bv));
    });

    return list;
  }, [users, query, roleFilter, statusFilter, sortBy]);

  return (
    <ProtectedLayout title="Users" subtitle="Manage registered user access and status.">
      <div className="glass-card panel-card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Administration</p>
            <h4>All registered users</h4>
          </div>
        </div>

        <div className="filter-grid">
          <label>
            <span>Search</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or email" />
          </label>
          <label>
            <span>Role</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option>All</option>
              {['Investor', 'Property Agent'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Disabled</option>
            </select>
          </label>
          <label>
            <span>Sort By</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
              <option value="createdAt">Date Joined</option>
            </select>
          </label>
        </div>

        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Date Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>{getProfileImage(u.id) ? <img className="mini-avatar" src={getProfileImage(u.id)} alt="" /> : '—'}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => setRole(u, e.target.value)}>
                      {['Investor', 'Property Agent'].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td>{u.disabled ? 'Disabled' : 'Active'}</td>
                  <td>{new Date(u.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td>
                    <button className="table-action" onClick={() => setViewUser(u)}>View</button>
                    <button className="table-action" onClick={() => setEditUser(u)}>Edit Role</button>
                    <button className="table-action" onClick={() => toggleDisable(u)}>{u.disabled ? 'Enable' : 'Disable'}</button>
                    <button className="table-action" onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan="7">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {viewUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{viewUser.name}</h3>
            <p><strong>Email:</strong> {viewUser.email}</p>
            <p><strong>Role:</strong> {viewUser.role}</p>
            <p><strong>Status:</strong> {viewUser.disabled ? 'Disabled' : 'Active'}</p>
            <p><strong>Date Joined:</strong> {new Date(viewUser.createdAt || Date.now()).toLocaleDateString()}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setViewUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Edit Role — {editUser.name}</h3>
            <label>
              <span>Role</span>
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                {['Investor', 'Property Agent'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setRole(editUser, editUser.role);
                  setEditUser(null);
                }}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}