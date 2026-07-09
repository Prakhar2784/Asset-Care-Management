import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Chip, TextField, InputAdornment,
  Stack, Skeleton, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  PeopleRounded, SearchRounded, EmailRounded,
  PhoneRounded, FiberManualRecordRounded,
} from '@mui/icons-material';
import { getFileUrl } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import useFetch from '../../hooks/useFetch';

const ROLE_STYLE = {
  admin:      { label: 'Admin',      color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
  hod:        { label: 'HOD',        color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  manager:    { label: 'Manager',    color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  technician: { label: 'Technician', color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
  employee:   { label: 'Employee',   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
};

function StatCard({ label, value, color }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, flex: 1, minWidth: 130 }}>
      <Typography variant="h4" fontWeight={900} sx={{ color: color || 'text.primary', lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
        {label}
      </Typography>
    </Paper>
  );
}

export default function DepartmentTeam() {
  const { currentUser } = useAuth();
  const { data, loading } = useFetch('/users');
  const members = data || [];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const stats = useMemo(() => {
    const active = members.filter(m => m.isActive !== false).length;
    const byRole = members.reduce((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {});
    return { total: members.length, active, inactive: members.length - active, byRole };
  }, [members]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m => {
      const matchesSearch = !q
        || m.name?.toLowerCase().includes(q)
        || m.email?.toLowerCase().includes(q)
        || m.phone?.includes(q);
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, search, roleFilter]);

  const dept = currentUser?.department || 'Department';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: 'rgba(17,24,39,0.10)', flexShrink: 0 }}>
          <PeopleRounded sx={{ fontSize: 26, color: 'text.primary' }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing="-0.5px" sx={{ lineHeight: 1.2 }}>
            My Team
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {dept} department members
          </Typography>
        </Box>
      </Box>

      {/* Stat cards */}
      <Stack direction="row" gap={2} mb={3} sx={{ flexWrap: 'wrap' }}>
        <StatCard label="Total Members" value={loading ? '—' : stats.total} />
        <StatCard label="Active" value={loading ? '—' : stats.active} color="#22C55E" />
        <StatCard label="Inactive" value={loading ? '—' : stats.inactive} color="#EF4444" />
        {!loading && Object.entries(stats.byRole).map(([role, count]) => (
          <StatCard
            key={role}
            label={ROLE_STYLE[role]?.label || role}
            value={count}
            color={ROLE_STYLE[role]?.color}
          />
        ))}
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2.5}>
        <TextField
          size="small"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment> } }}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
            <MenuItem value="all">All Roles</MenuItem>
            {Object.entries(ROLE_STYLE).map(([r, s]) => (
              <MenuItem key={r} value={r}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Member</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton height={32} /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : filtered.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                      No members found
                    </TableCell>
                  </TableRow>
                )
                : filtered.map(member => {
                    const rs = ROLE_STYLE[member.role] || { label: member.role, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' };
                    const isActive = member.isActive !== false;
                    return (
                      <TableRow key={member._id} hover>
                        {/* Member */}
                        <TableCell>
                          <Stack direction="row" sx={{ alignItems: 'center' }} gap={1.5}>
                            <Avatar
                              src={member.avatar ? getFileUrl(member.avatar) : undefined}
                              sx={{ width: 36, height: 36, bgcolor: 'rgba(17,24,39,0.12)', fontSize: 14, fontWeight: 800 }}
                            >
                              {member.name?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                                {member.name}
                              </Typography>
                              <Stack direction="row" sx={{ alignItems: 'center' }} gap={0.5}>
                                <EmailRounded sx={{ fontSize: 11, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary">{member.email}</Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            label={rs.label}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: 12, color: rs.color, bgcolor: rs.bg, border: 'none' }}
                          />
                        </TableCell>

                        {/* Contact */}
                        <TableCell>
                          {member.phone
                            ? (
                              <Stack direction="row" sx={{ alignItems: 'center' }} gap={0.5}>
                                <PhoneRounded sx={{ fontSize: 13, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">{member.phone}</Typography>
                              </Stack>
                            )
                            : <Typography variant="body2" color="text.disabled">—</Typography>
                          }
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Stack direction="row" sx={{ alignItems: 'center' }} gap={0.5}>
                            <FiberManualRecordRounded sx={{ fontSize: 10, color: isActive ? '#22C55E' : '#EF4444' }} />
                            <Typography variant="body2" fontWeight={700} sx={{ color: isActive ? '#22C55E' : '#EF4444' }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </Typography>
                          </Stack>
                        </TableCell>

                        {/* Joined */}
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {member.createdAt
                              ? new Date(member.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })
              }
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
