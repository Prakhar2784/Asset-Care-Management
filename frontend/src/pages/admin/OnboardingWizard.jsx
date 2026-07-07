import { useState, useEffect } from "react";
import {
  Box, Paper, Stepper, Step, StepLabel, Typography, TextField,
  Button, Grid, MenuItem, CircularProgress, Alert, Chip,
  FormControl, InputLabel, Select, InputAdornment, IconButton
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  ApartmentRounded, BusinessRounded, PersonAddRounded, Inventory2Rounded,
  ArrowForwardRounded, CheckCircleRounded, AddRounded, Visibility, VisibilityOff,
  BadgeRounded
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const steps = ["Organization Profile", "Add Department", "Add User", "Add Asset"];
const ROLES = ["employee", "hod", "technician", "admin"];

const cardTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#FBBF24", contrastText: "#111827" },
    background: { default: "#FFFFFF", paper: "#FFFFFF" },
    text: { primary: "#111827", secondary: "#4B5563" },
    divider: "rgba(17,24,39,0.15)",
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 700 } } },
  },
});

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [org, setOrg] = useState({
    name: "", industry: "", employeeCount: "", phone: "", website: "", contactEmail: "",
    gstNumber: "", panNumber: "",
    addressLine: "", city: "", state: "", pin: "", country: "India"
  });

  const emptyDept = { name: "", code: "", hodName: "", hodEmail: "", hodPhone: "", location: "" };
  const [dept, setDept] = useState(emptyDept);
  const [savedDepts, setSavedDepts] = useState([]);
  const [existingDepts, setExistingDepts] = useState([]);

  const emptyUser = { name: "", email: "", password: "", role: "employee", department: "", phone: "", employeeId: "" };
  const [user, setUser] = useState(emptyUser);
  const [savedUsers, setSavedUsers] = useState([]);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    api.get("/departments").then(({ data }) => setExistingDepts(data || [])).catch(() => {});
  }, []);

  const departmentOptions = [
    ...existingDepts.map(d => d.name),
    ...savedDepts.filter(n => !existingDepts.some(d => d.name === n))
  ];

  const finish = async () => {
    await api.patch("/auth/complete-onboarding");
    await refreshUser();
    navigate("/admin/dashboard");
  };

  const handleOrgSave = async () => {
    setSaving(true); setError("");
    try {
      await api.put("/settings/tenant", {
        name: org.name || null,
        industry: org.industry || null,
        employeeCount: org.employeeCount ? parseInt(org.employeeCount) : null,
        phone: org.phone || null,
        website: org.website || null,
        contactEmail: org.contactEmail || null,
        gstNumber: org.gstNumber || null,
        panNumber: org.panNumber || null,
        address: { line: org.addressLine || null, city: org.city || null, state: org.state || null, pin: org.pin || null, country: org.country || "India" }
      });
      window.dispatchEvent(new Event("tenant-branding-changed"));
      setActive(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save organization profile.");
    } finally { setSaving(false); }
  };

  const deptFilled = dept.name || dept.code || dept.hodName || dept.hodEmail || dept.hodPhone || dept.location;

  const saveCurrentDept = async () => {
    if (!dept.name || !dept.code || !dept.hodName || !dept.hodEmail) {
      setError("Please fill department name, code, HOD name and HOD email.");
      return false;
    }
    await api.post("/departments", { ...dept, status: "Active" });
    setSavedDepts(list => [...list, dept.name]);
    setUser(u => ({ ...u, department: dept.name }));
    setDept(emptyDept);
    return true;
  };

  const handleAddAnotherDept = async () => {
    setSaving(true); setError("");
    try {
      await saveCurrentDept();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally { setSaving(false); }
  };

  const handleDeptContinue = async () => {
    setSaving(true); setError("");
    try {
      if (deptFilled) {
        const ok = await saveCurrentDept();
        if (!ok) return;
      } else if (savedDepts.length === 0 && existingDepts.length === 0) {
        setError("Add at least one department, or use Skip this step.");
        return;
      }
      setActive(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally { setSaving(false); }
  };

  const userFilled = user.name || user.email || user.password || user.phone || user.employeeId;

  const saveCurrentUser = async () => {
    if (!user.name || !user.email || !user.password) {
      setError("Please fill user name, email and password.");
      return false;
    }
    await api.post("/users", user);
    setSavedUsers(list => [...list, user.name]);
    setUser(emptyUser);
    return true;
  };

  const handleAddAnotherUser = async () => {
    setSaving(true); setError("");
    try {
      await saveCurrentUser();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally { setSaving(false); }
  };

  const handleUserContinue = async () => {
    setSaving(true); setError("");
    try {
      if (userFilled) {
        const ok = await saveCurrentUser();
        if (!ok) return;
      } else if (savedUsers.length === 0) {
        setError("Add at least one user, or use Skip this step.");
        return;
      }
      setActive(3);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally { setSaving(false); }
  };

  const skip = async () => {
    setError("");
    if (active === steps.length - 1) {
      await finish();
    } else {
      setActive(a => a + 1);
    }
  };

  const goAddAsset = () => {
    navigate("/admin/assets/add?onboarding=1");
  };

  const StepHeader = ({ icon, title, subtitle }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.5 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: "rgba(251,191,36,0.15)", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Typography fontWeight={800} fontSize={17} color="text.primary">{title}</Typography>
      </Box>
      {subtitle && <Typography fontSize={13} color="text.secondary" sx={{ ml: "46px" }}>{subtitle}</Typography>}
    </Box>
  );

  return (
    <>
    <Navbar />
    <Box sx={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3,
      pt: { xs: 14, sm: 16 }, pb: 8,
      position: "relative", overflow: "hidden",
      background: (theme) => theme.palette.mode === "dark"
        ? "radial-gradient(circle at 12% 8%, rgba(251,191,36,0.35) 0%, rgba(0,0,0,0) 40%), radial-gradient(circle at 88% 92%, rgba(251,191,36,0.22) 0%, rgba(0,0,0,0) 45%), #000000"
        : "radial-gradient(circle at 12% 8%, rgba(251,191,36,0.35) 0%, rgba(0,0,0,0) 40%), radial-gradient(circle at 88% 92%, rgba(251,191,36,0.2) 0%, rgba(0,0,0,0) 45%), #F7F8FA",
    }}>
      <ThemeProvider theme={cardTheme}>
      <Paper sx={{
        width: "100%", maxWidth: 900, borderRadius: "24px", p: { xs: 3, sm: 6 },
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid",
        borderColor: "rgba(17,24,39,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography fontWeight={900} fontSize={{ xs: 28, sm: 36 }} color="text.primary" letterSpacing="-1px" mb={1}>
            Welcome to AssetCare Pro
          </Typography>
          <Typography color="text.secondary" fontSize={15} sx={{ maxWidth: 480, mx: "auto" }}>
            Let's set up your workspace in a few quick steps. You can skip and finish any step later from Settings.
          </Typography>
        </Box>

        <Stepper activeStep={active} sx={{ mb: 5 }}>
          {steps.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{error}</Alert>}

        {active === 0 && (
          <Box>
            <StepHeader icon={<BusinessRounded sx={{ color: "#FBBF24" }} />} title="Tell us about your organization"
              subtitle="This information appears on invoices, reports and the tenant profile." />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Company Name" sx={inputSx} value={org.name}
                  onChange={e => setOrg({ ...org, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Industry" sx={inputSx} value={org.industry}
                  onChange={e => setOrg({ ...org, industry: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="number" label="Employee Count" sx={inputSx} value={org.employeeCount}
                  onChange={e => setOrg({ ...org, employeeCount: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Website" sx={inputSx} value={org.website}
                  onChange={e => setOrg({ ...org, website: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" sx={inputSx} value={org.phone}
                  onChange={e => setOrg({ ...org, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Contact Email" sx={inputSx} value={org.contactEmail}
                  onChange={e => setOrg({ ...org, contactEmail: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="GST Number" sx={inputSx} value={org.gstNumber}
                  onChange={e => setOrg({ ...org, gstNumber: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="PAN Number" sx={inputSx} value={org.panNumber}
                  onChange={e => setOrg({ ...org, panNumber: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Address Line" sx={inputSx} value={org.addressLine}
                  onChange={e => setOrg({ ...org, addressLine: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth label="City" sx={inputSx} value={org.city}
                  onChange={e => setOrg({ ...org, city: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth label="State" sx={inputSx} value={org.state}
                  onChange={e => setOrg({ ...org, state: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth label="PIN Code" sx={inputSx} value={org.pin}
                  onChange={e => setOrg({ ...org, pin: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth label="Country" sx={inputSx} value={org.country}
                  onChange={e => setOrg({ ...org, country: e.target.value })} />
              </Grid>
            </Grid>
          </Box>
        )}

        {active === 1 && (
          <Box>
            <StepHeader icon={<ApartmentRounded sx={{ color: "#FBBF24" }} />} title="Add your departments"
              subtitle="Create as many departments as your organization needs — each requires an HOD." />

            {savedDepts.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                {savedDepts.map((name, i) => (
                  <Chip key={i} icon={<CheckCircleRounded sx={{ fontSize: 16, color: "#111827 !important" }} />}
                    label={name} sx={{ bgcolor: "#FBBF24", color: "#111827", fontWeight: 700 }} />
                ))}
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="Department Name" sx={inputSx} value={dept.name}
                  onChange={e => setDept({ ...dept, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="Department Code" sx={inputSx} value={dept.code}
                  onChange={e => setDept({ ...dept, code: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="HOD Name" sx={inputSx} value={dept.hodName}
                  onChange={e => setDept({ ...dept, hodName: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="HOD Email" sx={inputSx} value={dept.hodEmail}
                  onChange={e => setDept({ ...dept, hodEmail: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="HOD Phone" sx={inputSx} value={dept.hodPhone}
                  onChange={e => setDept({ ...dept, hodPhone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Location / Floor" sx={inputSx} value={dept.location}
                  onChange={e => setDept({ ...dept, location: e.target.value })} />
              </Grid>
            </Grid>

            <Button startIcon={<AddRounded />} onClick={handleAddAnotherDept} disabled={saving}
              sx={{ mt: 2.5, fontWeight: 700, color: "text.primary", border: "1px solid", borderColor: "divider", borderRadius: "10px", px: 2 }}>
              Add Another Department
            </Button>
          </Box>
        )}

        {active === 2 && (
          <Box>
            <StepHeader icon={<PersonAddRounded sx={{ color: "#FBBF24" }} />} title="Add your users"
              subtitle="Onboard as many teammates as you like — each gets their own login and role." />

            {savedUsers.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
                {savedUsers.map((name, i) => (
                  <Chip key={i} icon={<CheckCircleRounded sx={{ fontSize: 16, color: "#111827 !important" }} />}
                    label={name} sx={{ bgcolor: "#FBBF24", color: "#111827", fontWeight: 700 }} />
                ))}
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="Full Name" sx={inputSx} value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="Email Address" type="email" sx={inputSx} value={user.email}
                  onChange={e => setUser({ ...user, email: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth required label="Temporary Password" type={showPass ? "text" : "password"} sx={inputSx} value={user.password}
                  onChange={e => setUser({ ...user, password: e.target.value })}
                  helperText="User can change this after first login"
                  slotProps={{ input: { endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(s => !s)}>
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ) } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Employee ID" sx={inputSx} value={user.employeeId}
                  onChange={e => setUser({ ...user, employeeId: e.target.value })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start"><BadgeRounded sx={{ fontSize: 18, color: "text.disabled" }} /></InputAdornment> } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Department</InputLabel>
                  <Select label="Department" value={user.department} onChange={e => setUser({ ...user, department: e.target.value })}>
                    <MenuItem value="">No Department</MenuItem>
                    {departmentOptions.map(name => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth sx={inputSx}>
                  <InputLabel>Role</InputLabel>
                  <Select label="Role" value={user.role} onChange={e => setUser({ ...user, role: e.target.value })}>
                    {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r.replace(/_/g, " ")}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" sx={inputSx} value={user.phone}
                  onChange={e => setUser({ ...user, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                  inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
              </Grid>
            </Grid>

            <Button startIcon={<AddRounded />} onClick={handleAddAnotherUser} disabled={saving}
              sx={{ mt: 2.5, fontWeight: 700, color: "text.primary", border: "1px solid", borderColor: "divider", borderRadius: "10px", px: 2 }}>
              Add Another User
            </Button>
          </Box>
        )}

        {active === 3 && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "18px", bgcolor: "rgba(251,191,36,0.15)", display: "grid", placeItems: "center", mx: "auto", mb: 2.5 }}>
              <Inventory2Rounded sx={{ fontSize: 32, color: "#FBBF24" }} />
            </Box>
            <Typography fontWeight={800} fontSize={18} color="text.primary" mb={1}>Register your first asset</Typography>
            <Typography color="text.secondary" mb={3}>
              Add a laptop, chair, or any equipment to start tracking it. You can always add more later.
            </Typography>
            <Button variant="contained" size="large" endIcon={<ArrowForwardRounded />} onClick={goAddAsset}
              sx={{ borderRadius: "12px", fontWeight: 800, px: 4, boxShadow: "none" }}>
              Add Asset Now
            </Button>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 5, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={skip} sx={{ fontWeight: 700, color: "text.secondary" }}>
            {active === steps.length - 1 ? "Skip & Finish Later" : "Skip this step"}
          </Button>
          {active < 3 && (
            <Button
              variant="contained"
              disabled={saving}
              onClick={active === 0 ? handleOrgSave : active === 1 ? handleDeptContinue : handleUserContinue}
              endIcon={saving ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardRounded />}
              sx={{ borderRadius: "12px", fontWeight: 800, px: 3.5, boxShadow: "none" }}
            >
              Save &amp; Continue
            </Button>
          )}
          {active === 3 && (
            <Button
              variant="text"
              onClick={finish}
              endIcon={<CheckCircleRounded />}
              sx={{ fontWeight: 800, color: "text.primary" }}
            >
              Finish Setup
            </Button>
          )}
        </Box>
      </Paper>
      </ThemeProvider>
    </Box>
    <Footer />
    </>
  );
};

export default OnboardingWizard;
