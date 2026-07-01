import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Alert, Switch, Stack,
  FormControlLabel, CircularProgress, Divider, Chip, Grid, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, IconButton, Snackbar
} from '@mui/material';
import {
  PersonRounded, PaletteRounded, AssessmentRounded, SecurityRounded,
  DownloadRounded, Visibility, VisibilityOff, DarkModeRounded, LightModeRounded,
  SaveRounded, LockRounded, PictureAsPdfRounded, RefreshRounded, BusinessRounded,
  DeleteOutlineRounded, LocationOnRounded, PhoneRounded, EmailRounded,
  BadgeRounded, WorkRounded, PeopleRounded, LanguageRounded, ReceiptRounded,
  VerifiedRounded, StarRounded
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 4 }}>{children}</Box> : null;
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ currentUser }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Change password
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put('/settings/profile', { name, phone });
      setMsg('Profile updated successfully.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const handleChangePass = async () => {
    setPassMsg('');
    if (newPass.length < 6) { setPassMsg('New password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setPassMsg('Passwords do not match.'); return; }
    setPassLoading(true);
    try {
      await api.put('/settings/change-password', { currentPassword: current, newPassword: newPass });
      setPassMsg('✓ Password changed successfully.');
      setCurrent(''); setNewPass(''); setConfirm('');
    } catch (err) {
      setPassMsg(err.response?.data?.message || 'Failed to change password.');
    } finally { setPassLoading(false); }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center' }}>
              <PersonRounded sx={{ color: '#A855F7', fontSize: 18 }} />
            </Box>
            <Typography fontWeight={800} fontSize={16} color="text.primary">Personal Information</Typography>
          </Box>
          <Stack spacing={2}>
            <TextField label="Full Name" value={name} onChange={e => setName(e.target.value)} fullWidth size="small" sx={inputSx} />
            <TextField label="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} fullWidth size="small" sx={inputSx} placeholder="+91 98765 43210" />
            <TextField label="Email Address" value={currentUser?.email || ''} fullWidth size="small" sx={inputSx} disabled helperText="Email cannot be changed" />
            <TextField label="Role" value={currentUser?.role || ''} fullWidth size="small" sx={inputSx} disabled />
            <TextField label="Department" value={currentUser?.department || 'Not assigned'} fullWidth size="small" sx={inputSx} disabled helperText="Contact your admin to change department" />
          </Stack>
          {msg && <Alert severity={msg.includes('success') ? 'success' : 'error'} sx={{ mt: 2, borderRadius: '10px' }}>{msg}</Alert>}
          <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
            onClick={handleSave} disabled={saving}
            sx={{ mt: 3, fontWeight: 800, borderRadius: '12px', px: 3, py: 1.2, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: 'none' }}>
            Save Changes
          </Button>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center' }}>
              <LockRounded sx={{ color: '#A855F7', fontSize: 18 }} />
            </Box>
            <Typography fontWeight={800} fontSize={16} color="text.primary">Change Password</Typography>
          </Box>
          <Stack spacing={2}>
            <TextField
              label="Current Password" type={showCurr ? 'text' : 'password'} size="small"
              value={current} onChange={e => setCurrent(e.target.value)} fullWidth sx={inputSx}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowCurr(v => !v)}>{showCurr ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> } }}
            />
            <TextField
              label="New Password" type={showNew ? 'text' : 'password'} size="small"
              value={newPass} onChange={e => setNewPass(e.target.value)} fullWidth sx={inputSx}
              slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowNew(v => !v)}>{showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> } }}
            />
            <TextField
              label="Confirm New Password" type="password" size="small"
              value={confirm} onChange={e => setConfirm(e.target.value)} fullWidth sx={inputSx}
              error={confirm.length > 0 && newPass !== confirm}
              helperText={confirm.length > 0 && newPass !== confirm ? 'Passwords do not match' : ''}
            />
          </Stack>
          {passMsg && <Alert severity={passMsg.startsWith('✓') ? 'success' : 'error'} sx={{ mt: 2, borderRadius: '10px' }}>{passMsg}</Alert>}
          <Button variant="contained" startIcon={passLoading ? <CircularProgress size={16} color="inherit" /> : <LockRounded />}
            onClick={handleChangePass} disabled={passLoading || !current || !newPass || !confirm}
            sx={{ mt: 3, fontWeight: 800, borderRadius: '12px', px: 3, py: 1.2, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: 'none' }}>
            Change Password
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ─── Appearance Tab ────────────────────────────────────────────────────────────
function AppearanceTab() {
  const { mode, toggleMode, isDark } = useAppTheme();
  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={17} mb={1} color="text.primary">Theme</Typography>
          <Typography fontSize={14} color="text.secondary" mb={3}>
            Choose between light and dark mode for the application interface.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {['light', 'dark'].map(m => {
              const isActive = mode === m;
              return (
                <Box
                  key={m}
                  onClick={!isActive ? toggleMode : undefined}
                  sx={{
                    flex: 1, border: '2px solid', borderRadius: 3, p: 2.5,
                    cursor: !isActive ? 'pointer' : 'default',
                    borderColor: isActive ? '#7C3AED' : 'divider',
                    bgcolor: isActive
                      ? (isDark ? 'rgba(168,85,247,0.08)' : 'rgba(124,58,237,0.06)')
                      : 'transparent',
                    textAlign: 'center', transition: 'all 0.2s',
                    '&:hover': !isActive ? { borderColor: 'rgba(124,58,237,0.4)' } : {}
                  }}
                >
                  {m === 'light'
                    ? <LightModeRounded sx={{ fontSize: 32, color: isActive ? '#7C3AED' : 'text.disabled' }} />
                    : <DarkModeRounded sx={{ fontSize: 32, color: isActive ? '#A855F7' : 'text.disabled' }} />}
                  <Typography fontWeight={700} fontSize={14} sx={{ color: isActive ? (isDark ? '#A855F7' : '#7C3AED') : undefined, mt: 1 }}
                    color={!isActive ? 'text.secondary' : undefined}>
                    {m === 'light' ? 'Light Mode' : 'Dark Mode'}
                  </Typography>
                  {isActive && <Chip label="Active" size="small" sx={{ mt: 1, bgcolor: "rgba(124,58,237,0.12)", color: isDark ? '#A855F7' : '#7C3AED', fontWeight: 700, height: 20, fontSize: 11 }} />}
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

// ─── Company Settings Tab (admin only) ──────────────────────────────────────────
const INDUSTRIES = ['Technology', 'Manufacturing', 'Healthcare', 'Education', 'Finance', 'Retail', 'Construction', 'Logistics', 'Hospitality', 'Other'];

function CompanySettingsTab() {
  const [form, setForm] = useState({
    name: '', industry: '', employeeCount: '', phone: '', website: '', contactEmail: '',
    gstNumber: '', panNumber: '',
    addressLine: '', city: '', state: '', pin: '', country: 'India',
    logoUrl: '', primaryColor: '#141414', secondaryColor: '#A855F7',
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', smtpFromEmail: ''
  });
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api.get('/settings/tenant').then(({ data }) => {
      setTenant(data);
      setForm({
        name: data.name || '',
        industry: data.industry || '',
        employeeCount: data.employeeCount || '',
        phone: data.phone || '',
        website: data.website || '',
        contactEmail: data.contactEmail || '',
        gstNumber: data.gstNumber || '',
        panNumber: data.panNumber || '',
        addressLine: data.address?.line || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        pin: data.address?.pin || '',
        country: data.address?.country || 'India',
        logoUrl: data.branding?.logoUrl || '',
        primaryColor: data.branding?.primaryColor || '#141414',
        secondaryColor: data.branding?.secondaryColor || '#A855F7',
        smtpHost: data.smtp?.host || '',
        smtpPort: data.smtp?.port || '',
        smtpUser: data.smtp?.user || '',
        smtpPass: data.smtp?.pass || '',
        smtpFromEmail: data.smtp?.fromEmail || ''
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      await api.put('/settings/tenant', {
        name: form.name,
        industry: form.industry || null,
        employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
        phone: form.phone || null,
        website: form.website || null,
        contactEmail: form.contactEmail || null,
        gstNumber: form.gstNumber || null,
        panNumber: form.panNumber || null,
        address: { line: form.addressLine || null, city: form.city || null, state: form.state || null, pin: form.pin || null, country: form.country || 'India' },
        branding: { logoUrl: form.logoUrl || null, primaryColor: form.primaryColor, secondaryColor: form.secondaryColor },
        smtp: { host: form.smtpHost || null, port: form.smtpPort ? parseInt(form.smtpPort) : null, user: form.smtpUser || null, pass: form.smtpPass || null, fromEmail: form.smtpFromEmail || null }
      });
      setMsg('Organisation profile updated successfully.');
      window.dispatchEvent(new Event('tenant-branding-changed'));
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };
  const SectionHeader = ({ icon, title }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center' }}>
        {icon}
      </Box>
      <Typography fontWeight={800} fontSize={15} color="text.primary">{title}</Typography>
    </Box>
  );

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#A855F7' }} /></Box>;

  const planColor = tenant?.plan === 'Enterprise' ? '#F59E0B' : tenant?.plan === 'Pro' ? '#A855F7' : '#6B7280';

  return (
    <Stack spacing={3}>
      {/* Subscription Banner */}
      <Paper sx={{ p: 3, borderRadius: '20px', border: 1, borderColor: 'divider', background: 'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(168,85,247,0.03))' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center' }}>
              <StarRounded sx={{ color: '#A855F7', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={15} color="text.primary">Subscription</Typography>
              <Typography fontSize={13} color="text.secondary">
                {tenant?.limits?.maxUsers || 10} seats · {tenant?.planExpiry ? `expires ${new Date(tenant.planExpiry).toLocaleDateString('en-IN')}` : 'expires never'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip label={tenant?.plan || 'Basic'} size="small" sx={{ fontWeight: 800, fontSize: 12, bgcolor: planColor, color: '#fff', px: 0.5 }} />
            <Chip label="ACTIVE" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 12, borderColor: '#10B981', color: '#10B981' }} />
            <Button size="small" sx={{ fontWeight: 700, color: '#A855F7', textTransform: 'none', fontSize: 13 }}>Manage Plan</Button>
          </Box>
        </Box>
      </Paper>

      {/* Basic Information */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<BusinessRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="Basic Information" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Company Name *" value={form.name} onChange={set('name')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Industry</InputLabel>
              <Select value={form.industry} label="Industry" onChange={set('industry')}>
                {INDUSTRIES.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Company Slug (Tenant ID)" value={tenant?.slug || ''} fullWidth size="small" sx={inputSx} disabled
              helperText="Auto-generated · used in registration URLs" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Employee Count" type="number" value={form.employeeCount} onChange={set('employeeCount')} fullWidth size="small" sx={inputSx}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PeopleRounded sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Contact Information */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<PhoneRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="Contact Information" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Official Email" value={form.contactEmail} onChange={set('contactEmail')} fullWidth size="small" sx={inputSx} placeholder="reception@company.com"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailRounded sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="Phone / Contact Number" value={form.phone} onChange={set('phone')} fullWidth size="small" sx={inputSx}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneRounded sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Website" value={form.website} onChange={set('website')} fullWidth size="small" sx={inputSx} placeholder="https://yourcompany.com"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><LanguageRounded sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Legal & Compliance */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<ReceiptRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="Legal & Compliance" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="GST Number" value={form.gstNumber} onChange={set('gstNumber')} fullWidth size="small" sx={inputSx} placeholder="15-digit GSTIN" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="PAN Number" value={form.panNumber} onChange={set('panNumber')} fullWidth size="small" sx={inputSx} placeholder="10-char PAN" />
          </Grid>
        </Grid>
      </Paper>

      {/* Registered Address */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<LocationOnRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="Registered Address" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Address Line" value={form.addressLine} onChange={set('addressLine')} fullWidth size="small" sx={inputSx} placeholder="Flat / Office no., building name, street name, locality" />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="City" value={form.city} onChange={set('city')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="State / Province" value={form.state} onChange={set('state')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="PIN / ZIP Code" value={form.pin} onChange={set('pin')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Country" value={form.country} onChange={set('country')} fullWidth size="small" sx={inputSx} />
          </Grid>
        </Grid>
      </Paper>

      {/* Branding */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<PaletteRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="Branding" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField label="Logo URL" value={form.logoUrl} onChange={set('logoUrl')} fullWidth size="small" sx={inputSx} placeholder="https://example.com/logo.png" />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label="Primary Color" type="color" value={form.primaryColor} onChange={set('primaryColor')} fullWidth sx={inputSx} slotProps={{ input: { sx: { height: 40, p: 0.5 } } }} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <TextField label="Accent Color" type="color" value={form.secondaryColor} onChange={set('secondaryColor')} fullWidth sx={inputSx} slotProps={{ input: { sx: { height: 40, p: 0.5 } } }} />
          </Grid>
        </Grid>
      </Paper>

      {/* SMTP */}
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <SectionHeader icon={<SecurityRounded sx={{ color: '#A855F7', fontSize: 18 }} />} title="SMTP Gateway" />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField label="SMTP Host" value={form.smtpHost} onChange={set('smtpHost')} fullWidth size="small" sx={inputSx} placeholder="smtp.gmail.com" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField label="Port" value={form.smtpPort} onChange={set('smtpPort')} fullWidth size="small" sx={inputSx} placeholder="587" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="SMTP Username" value={form.smtpUser} onChange={set('smtpUser')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField label="SMTP Password" type="password" value={form.smtpPass} onChange={set('smtpPass')} fullWidth size="small" sx={inputSx} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField label="Sender (From) Email" value={form.smtpFromEmail} onChange={set('smtpFromEmail')} fullWidth size="small" sx={inputSx} placeholder="no-reply@company.com" />
          </Grid>
        </Grid>
      </Paper>

      {msg && <Alert severity={msg.includes('success') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>{msg}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
          onClick={handleSave} disabled={saving}
          sx={{ fontWeight: 800, borderRadius: '12px', px: 4, py: 1.3, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: 'none' }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Stack>
  );
}

// ─── Custom Fields Tab (admin only) ─────────────────────────────────────────────
function CustomFieldsTab() {
  const [category, setCategory] = useState('IT Asset');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Text');
  const [required, setRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchFields = async (cat) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/custom-fields?category=${encodeURIComponent(cat)}`);
      setFields(data.data || []);
    } catch {
      setToast('Failed to load custom fields.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields(category);
  }, [category]);

  const handleAddField = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const options = type === 'Select' 
        ? optionsStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      await api.post('/custom-fields', {
        category,
        name: name.trim(),
        type,
        isRequired: required,
        options
      });
      setToast('Custom field added successfully.');
      setName('');
      setRequired(false);
      setOptionsStr('');
      fetchFields(category);
    } catch (err) {
      setToast(err.response?.data?.message || 'Failed to add custom field.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom field? This does not delete values on existing assets, but it will no longer show in forms.')) return;
    try {
      await api.delete(`/custom-fields/${id}`);
      setToast('Custom field deleted.');
      fetchFields(category);
    } catch {
      setToast('Failed to delete custom field.');
    }
  };

  const inputStyles = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <PaletteRounded sx={{ color: '#A855F7', fontSize: 18 }} />
            </Box>
            <Typography fontWeight={800} fontSize={16} color="text.primary">Create Custom Field</Typography>
          </Box>
          <Typography fontSize={12} color="text.secondary" mb={3} sx={{ pl: '48px' }}>
            Define dynamic attributes for your CMDB assets.
          </Typography>

          <Box component="form" onSubmit={handleAddField}>
            <Stack spacing={2.5}>
              <TextField label="Category" fullWidth select size="small" sx={inputSx}
                value={category} onChange={e => setCategory(e.target.value)}>
                {['IT Asset', 'Electrical', 'Electronic', 'Furniture', 'Networking', 'Other'].map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>

              <TextField label="Field Name (e.g. CPU Model)" fullWidth required size="small" sx={inputSx}
                value={name} onChange={e => setName(e.target.value)} />

              <TextField label="Field Type" fullWidth select size="small" sx={inputSx}
                value={type} onChange={e => setType(e.target.value)}>
                {['Text', 'Number', 'Date', 'Select'].map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>

              {type === 'Select' && (
                <TextField label="Options (comma-separated)" fullWidth required size="small" sx={inputSx}
                  placeholder="Option 1, Option 2, Option 3"
                  value={optionsStr} onChange={e => setOptionsStr(e.target.value)}
                  helperText="Enter choices separated by commas." />
              )}
            </Stack>

            <FormControlLabel
              control={<Switch checked={required} onChange={e => setRequired(e.target.checked)} size="small" />}
              label={<Typography fontWeight={600} fontSize={13}>Mark as Required</Typography>}
              sx={{ mt: 2.5, mb: 0 }}
            />

            <Button type="submit" variant="contained" fullWidth disabled={saving || !name.trim()}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
              sx={{ mt: 3, fontWeight: 800, borderRadius: '12px', py: 1.2, background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: 'none' }}>
              {saving ? 'Adding…' : 'Add Custom Field'}
            </Button>
          </Box>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider', minHeight: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography fontWeight={800} fontSize={16} color="text.primary">Fields for {category}</Typography>
            <Box sx={{ px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: 'rgba(168,85,247,0.12)', color: '#A855F7', fontSize: 11, fontWeight: 800 }}>
              {fields.length} field{fields.length !== 1 ? 's' : ''}
            </Box>
          </Box>
          <Typography fontSize={12} color="text.secondary" mb={2.5}>
            Custom metadata fields rendered on provisioning forms for this category.
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} sx={{ color: '#A855F7' }} /></Box>
          ) : fields.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center', bgcolor: 'action.hover', borderRadius: '14px', border: '1px dashed', borderColor: 'divider' }}>
              <Typography color="text.secondary" fontWeight={700} fontSize={13}>No custom fields yet for this category.</Typography>
              <Typography color="text.disabled" fontSize={12} mt={0.5}>Use the form on the left to add one.</Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {fields.map(f => (
                <Box key={f._id} sx={{
                  p: 2, borderRadius: '12px', border: 1, borderColor: 'divider',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' }, transition: 'all 0.15s'
                }}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography fontWeight={700} fontSize={13}>{f.name}</Typography>
                      {f.isRequired && (
                        <Box sx={{ px: 0.8, py: 0.1, borderRadius: '6px', fontSize: 10, fontWeight: 800, bgcolor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>Required</Box>
                      )}
                    </Box>
                    <Typography fontSize={11} color="text.secondary" mt={0.3}>
                      Type: <strong>{f.type}</strong>{f.type === 'Select' ? ` · ${f.options.join(', ')}` : ''}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleDeleteField(f._id)}
                    sx={{ color: 'text.disabled', borderRadius: '8px', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)' } }}>
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Grid>
  );
}

// ─── Reports Tab (admin only) ──────────────────────────────────────────────────
function ReportsTab() {
  const [status, setStatus] = useState('All');
  const [priority, setPriority] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState({ excel: false, pdf: false });
  const [error, setError] = useState('');

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (status !== 'All') params.append('status', status);
    if (priority !== 'All') params.append('priority', priority);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await api.get(`/reports/lifecycle?${params}`);
    return data;
  };

  const downloadExcel = async () => {
    setLoading(l => ({ ...l, excel: true })); setError('');
    try {
      const { summary, tickets } = await fetchData();

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['AssetCare Pro — Ticket Lifecycle Report'],
        ['Generated on', new Date().toLocaleString('en-IN')],
        [],
        ['SUMMARY'],
        ['Total Tickets', summary.total],
        ['Resolved', summary.resolved],
        ['Pending', summary.pending],
        ['In Progress', summary.inProgress],
        ['Rejected', summary.rejected],
        ['Avg. Resolution Time (hrs)', summary.avgResolutionHours ?? 'N/A'],
        ['Total Estimated Cost (₹)', summary.totalCost],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Tickets sheet
      const headers = ['Ticket ID', 'Status', 'Priority', 'Issue', 'Asset', 'Serial No.', 'Dept', 'Raised By', 'Email', 'Approved By', 'Raised At', 'Last Updated', 'Resolution (hrs)', 'Est. Cost (₹)', 'Asset Vendor', 'Warranty End'];
      const rows = tickets.map(t => [
        t.ticketId, t.status, t.priority, t.issue, t.assetName, t.assetSerial,
        t.assetDepartment, t.raisedByName, t.raisedByEmail, t.approvedByName,
        t.raisedAt, t.lastUpdated, t.resolutionHours ?? 'N/A', t.estimatedCost,
        t.assetVendor, t.assetWarrantyEnd
      ]);
      const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws2['!cols'] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws2, 'Ticket Lifecycle');

      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `assetcare-ticket-report-${Date.now()}.xlsx`);
    } catch (e) {
      setError('Failed to generate Excel report.');
    } finally { setLoading(l => ({ ...l, excel: false })); }
  };

  const downloadPDF = async () => {
    setLoading(l => ({ ...l, pdf: true })); setError('');
    try {
      const { summary, tickets } = await fetchData();
      const doc = new jsPDF({ orientation: 'landscape' });

      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('AssetCare Pro - Ticket Lifecycle Report', 14, 16);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23);

      // Summary box
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 33);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const summaryLines = [
        `Total: ${summary.total}  |  Resolved: ${summary.resolved}  |  Pending: ${summary.pending}  |  In Progress: ${summary.inProgress}  |  Rejected: ${summary.rejected}`,
        `Avg. Resolution: ${summary.avgResolutionHours ?? 'N/A'} hrs  |  Total Cost: Rs. ${summary.totalCost.toLocaleString('en-IN')}`,
      ];
      summaryLines.forEach((l, i) => doc.text(l, 14, 40 + i * 6));

      autoTable(doc, {
        startY: 56,
        head: [['Ticket ID', 'Status', 'Priority', 'Issue', 'Asset', 'Dept', 'Raised By', 'Approved By', 'Raised At', 'Res.(hrs)', 'Cost(Rs.)']],
        body: tickets.map(t => [
          t.ticketId, t.status, t.priority, t.issue.substring(0, 40), t.assetName.substring(0, 20),
          t.assetDepartment, t.raisedByName, t.approvedByName,
          t.raisedAt, t.resolutionHours ?? '—', t.estimatedCost
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [17, 17, 17], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 246] },
      });

      doc.save(`assetcare-ticket-report-${Date.now()}.pdf`);
    } catch (e) {
      setError('Failed to generate PDF report.');
    } finally { setLoading(l => ({ ...l, pdf: false })); }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(124,58,237,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <AssessmentRounded sx={{ color: '#A855F7', fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize={16} color="text.primary">Ticket Lifecycle Report</Typography>
        </Box>
        <Typography fontSize={12} color="text.secondary" mb={3} sx={{ pl: '48px' }}>
          Every ticket from creation to resolution — asset details, cost, resolution time, and personnel.
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
              {['All', 'Pending Approval', 'Vendor Assigned', 'Under Repair', 'Resolved', 'Rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140, ...inputSx }}>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={e => setPriority(e.target.value)}>
              {['All', 'Low', 'Medium', 'High', 'Critical'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="From Date" value={from} onChange={e => setFrom(e.target.value)}
            sx={{ minWidth: 160, ...inputSx }} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField size="small" type="date" label="To Date" value={to} onChange={e => setTo(e.target.value)}
            sx={{ minWidth: 160, ...inputSx }} slotProps={{ inputLabel: { shrink: true } }} />
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px' }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
          <Button variant="contained"
            startIcon={loading.excel ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
            onClick={downloadExcel} disabled={loading.excel || loading.pdf}
            sx={{ fontWeight: 800, borderRadius: '12px', px: 2.5, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, boxShadow: 'none' }}>
            Download Excel
          </Button>
          <Button variant="contained"
            startIcon={loading.pdf ? <CircularProgress size={16} color="inherit" /> : <DownloadRounded />}
            onClick={downloadPDF} disabled={loading.excel || loading.pdf}
            sx={{ fontWeight: 800, borderRadius: '12px', px: 2.5, bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, boxShadow: 'none' }}>
            Download PDF
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3.5, borderRadius: '20px', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(34,197,94,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <DownloadRounded sx={{ color: '#22C55E', fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize={16} color="text.primary">Asset Registry Report</Typography>
        </Box>
        <Typography fontSize={12} color="text.secondary" mb={3} sx={{ pl: '48px' }}>
          Complete snapshot of all active assets with assignment, warranty, and AMC details.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadRounded />}
          onClick={async () => {
            try {
              const { data } = await api.get('/reports/assets');
              const rows = data.map(a => ({
                Name: a.name, Category: a.category, 'Serial No': a.serialNumber,
                Status: a.status, Department: a.department, Location: a.location || '',
                Vendor: a.vendor || '', Model: a.modelNumber || '',
                'Purchase Cost': a.purchaseCost || '',
                'Warranty End': a.warrantyEnd ? new Date(a.warrantyEnd).toLocaleDateString('en-IN') : '',
                'Assigned To': a.assignedTo?.name || a.assignedEmployeeName || 'Unassigned',
                'Assigned Email': a.assignedTo?.email || a.assignedEmployeeEmail || '',
                'AMC Vendor': a.amcVendor || '', 'AMC End': a.amcEnd ? new Date(a.amcEnd).toLocaleDateString('en-IN') : '',
              }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Assets');
              const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
              saveAs(new Blob([buf], { type: 'application/octet-stream' }), `assetcare-asset-registry-${Date.now()}.xlsx`);
            } catch { setError('Failed to download asset report.'); }
          }}
          sx={{ fontWeight: 800, borderRadius: '12px', borderColor: '#22C55E', color: '#22C55E', '&:hover': { bgcolor: 'rgba(34,197,94,0.08)', borderColor: '#22C55E' } }}
        >
          Download Asset Registry (Excel)
        </Button>
      </Paper>
    </Stack>
  );
}

// ─── Data & Privacy Tab ────────────────────────────────────────────────────────
function DataTab({ currentUser }) {
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/settings/export-data');
      const doc = new jsPDF();

      // Header
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(203, 250, 87);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('AssetCare Pro — My Data Export', 14, 14);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Exported: ${new Date().toLocaleString('en-IN')}`, 14, 23);
      doc.setTextColor(0, 0, 0);

      let y = 38;

      // Profile section
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 17, 17);
      doc.text('Profile Information', 14, y); y += 7;
      doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const profile = data.profile || {};
      [['Name', profile.name], ['Email', profile.email], ['Role', profile.role], ['Department', profile.department], ['Phone', profile.phone || 'Not set']].forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(k + ':', 14, y);
        doc.setFont('helvetica', 'normal'); doc.text(String(v || '—'), 50, y);
        y += 6;
      });

      y += 4;

      // Assigned Assets
      if (data.assignedAssets?.length) {
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 58, 138);
        doc.text('Assigned Assets', 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        const t1 = autoTable(doc, {
          startY: y,
          head: [['Asset Name', 'Serial No.', 'Category', 'Status', 'Department']],
          body: data.assignedAssets.map(a => [a.name, a.serialNumber, a.category, a.status, a.department]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [17, 17, 17] },
          margin: { left: 14, right: 14 },
        });
        y = (t1?.finalY ?? doc.lastAutoTable?.finalY ?? y + 20) + 6;
      }

      // Tickets
      if (data.tickets?.length) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 58, 138);
        doc.text('My Tickets', 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        const t2 = autoTable(doc, {
          startY: y,
          head: [['Ticket ID', 'Issue', 'Status', 'Priority', 'Asset', 'Raised At']],
          body: data.tickets.map(t => [t.ticketId, t.issue.substring(0, 35), t.status, t.priority, t.asset, new Date(t.raisedAt).toLocaleDateString('en-IN')]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [17, 17, 17] },
          margin: { left: 14, right: 14 },
        });
        y = (t2?.finalY ?? doc.lastAutoTable?.finalY ?? y + 20) + 6;
      }

      // Device Requests
      if (data.deviceRequests?.length) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 58, 138);
        doc.text('Device Requests', 14, y); y += 4;
        doc.setTextColor(0, 0, 0);
        autoTable(doc, {
          startY: y,
          head: [['Request ID', 'Item Requested', 'Type', 'Status', 'Urgency', 'Date']],
          body: data.deviceRequests.map(r => [r.requestId, r.itemRequested, r.requestType, r.status, r.urgency, new Date(r.raisedAt).toLocaleDateString('en-IN')]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [17, 17, 17] },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save(`assetcare-my-data-${Date.now()}.pdf`);
      setToast('Data exported as PDF successfully.');
    } catch (e) {
      setToast('Export failed. Please try again.');
    } finally { setExporting(false); }
  };

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={17} mb={1} color="text.primary">Export My Data</Typography>
          <Typography fontSize={14} color="text.secondary" mb={3}>
            Download a complete copy of all your data — profile, tickets, device requests, notifications, and assigned assets — as a JSON file.
          </Typography>
          <Button
            variant="outlined"
            startIcon={exporting ? <CircularProgress size={16} /> : <PictureAsPdfRounded />}
            onClick={handleExport}
            disabled={exporting}
            sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#dc2626', color: '#dc2626', '&:hover': { bgcolor: 'rgba(220,38,38,0.12)', borderColor: '#dc2626' } }}
          >
            {exporting ? 'Generating PDF...' : 'Export My Data (PDF)'}
          </Button>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={17} mb={1} color="text.primary">Data Retention Policy</Typography>
          <Typography fontSize={14} color="text.secondary" mb={2.5}>
            Your data is managed according to these retention rules:
          </Typography>
          {[
            ['Audit Logs', 'Auto-purged after 1 year (monthly job)'],
            ['Notifications', 'Retained indefinitely (manually deletable)'],
            ['Tickets', 'Retained indefinitely'],
            ['Assets', 'Soft-deleted (recoverable from trash)'],
          ].map(([label, desc]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography fontSize={13} fontWeight={600} color="text.secondary">{label}</Typography>
              <Typography fontSize={13} color="text.primary" sx={{ textAlign: "right", maxWidth: 220 }}>{desc}</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, border: 1, borderColor: 'divider' }}>
          <Typography fontWeight={800} fontSize={17} mb={2.5} color="text.primary">Account Information</Typography>
          {[
            ['Name', currentUser?.name],
            ['Email', currentUser?.email],
            ['Role', currentUser?.role],
            ['Department', currentUser?.department],
            ['Account Status', currentUser?.isActive ? 'Active' : 'Inactive'],
          ].map(([label, val]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography fontSize={13} fontWeight={600} color="text.secondary">{label}</Typography>
              <Typography fontSize={13} fontWeight={700}>{val || '—'}</Typography>
            </Box>
          ))}
        </Paper>
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Grid>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────────────────────
export default function Settings() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: 'Profile', icon: <PersonRounded fontSize="small" /> },
    { label: 'Appearance', icon: <PaletteRounded fontSize="small" /> },
    ...(isAdmin ? [
      { label: 'Organisation Profile', icon: <BusinessRounded fontSize="small" /> },
      { label: 'Custom Fields', icon: <PaletteRounded fontSize="small" /> },
      { label: 'Reports', icon: <AssessmentRounded fontSize="small" /> }
    ] : []),
    { label: 'Data & Privacy', icon: <SecurityRounded fontSize="small" /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: "rgba(124,58,237,0.12)", flexShrink: 0 }}>
          <PersonRounded sx={{ color: '#A855F7', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing="-0.5px" sx={{ color: 'text.primary', lineHeight: 1.2 }}>Settings</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>Manage your profile, preferences, and data</Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default', '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minHeight: 56, fontSize: 14 } }}
        >
          {tabs.map((t, i) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" value={i} />
          ))}
        </Tabs>

        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <TabPanel value={tab} index={0}><ProfileTab currentUser={currentUser} /></TabPanel>
          <TabPanel value={tab} index={1}><AppearanceTab /></TabPanel>
          {isAdmin && <TabPanel value={tab} index={2}><CompanySettingsTab /></TabPanel>}
          {isAdmin && <TabPanel value={tab} index={3}><CustomFieldsTab /></TabPanel>}
          {isAdmin && <TabPanel value={tab} index={4}><ReportsTab /></TabPanel>}
          <TabPanel value={tab} index={isAdmin ? 5 : 2}><DataTab currentUser={currentUser} /></TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

