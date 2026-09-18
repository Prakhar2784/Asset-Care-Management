import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import LocationCityRoundedIcon from "@mui/icons-material/LocationCityRounded";
import PinDropRoundedIcon from "@mui/icons-material/PinDropRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";

const steps = [
  { label: "Organization Profile", short: "Org Profile" },
  { label: "Add Department", short: "Department" },
  { label: "Add User", short: "Users" },
  { label: "Add Asset", short: "Assets" }
];

const ROLES = ["employee", "hod", "technician", "admin"];
const STORAGE_KEY = "assetcare_onboarding_draft";

const loadDraft = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const draft = loadDraft();

  const [active, setActive] = useState(draft.active ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [org, setOrg] = useState(
    draft.org ?? {
      name: "",
      industry: "",
      employeeCount: "",
      phone: "",
      website: "",
      contactEmail: "",
      gstNumber: "",
      panNumber: "",
      addressLine: "",
      city: "",
      state: "",
      pin: "",
      country: "India"
    }
  );

  const emptyDept = { name: "", code: "", hodName: "", hodEmail: "", hodPhone: "", location: "" };
  const [dept, setDept] = useState(draft.dept ?? emptyDept);
  const [savedDepts, setSavedDepts] = useState(draft.savedDepts ?? []);
  const [existingDepts, setExistingDepts] = useState([]);

  const emptyUser = { name: "", email: "", password: "", role: "employee", department: "", phone: "", employeeId: "" };
  const [user, setUser] = useState(draft.user ?? emptyUser);
  const [savedUsers, setSavedUsers] = useState(draft.savedUsers ?? []);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    api.get("/departments").then(({ data }) => setExistingDepts(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ active, org, dept, savedDepts, user, savedUsers }));
  }, [active, org, dept, savedDepts, user, savedUsers]);

  const departmentOptions = [
    ...existingDepts.map((d) => d.name),
    ...savedDepts.filter((n) => !existingDepts.some((d) => d.name === n))
  ];

  const finish = async () => {
    try {
      await api.patch("/auth/complete-onboarding");
      await refreshUser();
      localStorage.removeItem(STORAGE_KEY);
      navigate("/admin/dashboard");
    } catch {
      navigate("/admin/dashboard");
    }
  };

  const handlePincodeChange = async (val) => {
    const cleanPin = val.replace(/[^0-9]/g, "").slice(0, 6);
    setOrg((prev) => ({ ...prev, pin: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        const data = await response.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const firstPO = data[0].PostOffice[0];
          const city = firstPO.District || firstPO.Division || "";
          const state = firstPO.State || "";
          setOrg((prev) => ({ ...prev, city, state }));
        }
      } catch (err) {
        console.error("Failed to fetch address details from pincode:", err);
      }
    }
  };

  const handleOrgSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");
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
        address: {
          line: org.addressLine || null,
          city: org.city || null,
          state: org.state || null,
          pin: org.pin || null,
          country: org.country || "India"
        }
      });
      window.dispatchEvent(new Event("tenant-branding-changed"));
      setActive(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save organization profile.");
    } finally {
      setSaving(false);
    }
  };

  const deptFilled = dept.name || dept.code || dept.hodName || dept.hodEmail || dept.hodPhone || dept.location;

  const saveCurrentDept = async () => {
    if (!dept.name || !dept.hodName || !dept.hodEmail) {
      setError("Please fill department name, HOD name, and HOD email.");
      return false;
    }
    const finalCode =
      dept.code?.trim() ||
      (dept.name.trim().split(/\s+/).map((w) => w[0]).join("") || dept.name.trim().slice(0, 3)).toUpperCase();
    await api.post("/departments", { ...dept, code: finalCode, status: "Active" });
    setSavedDepts((list) => [...list, dept.name]);
    setUser((u) => ({ ...u, department: dept.name }));
    setDept(emptyDept);
    return true;
  };

  const handleAddAnotherDept = async () => {
    setSaving(true);
    setError("");
    try {
      await saveCurrentDept();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeptContinue = async () => {
    setSaving(true);
    setError("");
    try {
      if (deptFilled) {
        const ok = await saveCurrentDept();
        if (!ok) return;
      } else if (savedDepts.length === 0 && existingDepts.length === 0) {
        setError("Add at least one department, or click 'Skip this step'.");
        return;
      }
      setActive(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setSaving(false);
    }
  };

  const userFilled = user.name || user.email || user.password || user.phone || user.employeeId;

  const saveCurrentUser = async () => {
    if (!user.name || !user.email || !user.password) {
      setError("Please fill user name, email, and password.");
      return false;
    }
    await api.post("/users", user);
    setSavedUsers((list) => [...list, user.name]);
    setUser(emptyUser);
    return true;
  };

  const handleAddAnotherUser = async () => {
    setSaving(true);
    setError("");
    try {
      await saveCurrentUser();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const handleUserContinue = async () => {
    setSaving(true);
    setError("");
    try {
      if (userFilled) {
        const ok = await saveCurrentUser();
        if (!ok) return;
      } else if (savedUsers.length === 0) {
        setError("Add at least one user, or click 'Skip this step'.");
        return;
      }
      setActive(3);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setError("");
    if (active === steps.length - 1) {
      await finish();
    } else {
      setActive((a) => a + 1);
    }
  };

  const goAddAsset = () => {
    navigate("/admin/assets/add?onboarding=1");
  };

  return (
    <>
      <Navbar />
      <div className="auth-wrapper">
        <div className="auth-container">
          <style>{`
            .auth-wrapper {
              min-height: 100vh;
              padding: 110px 20px 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #0B0D17;
              font-family: 'Poppins', 'Inter', -apple-system, sans-serif;
              width: 100%;
            }

            .auth-container {
              width: 100%;
              max-width: 1200px;
              background: #1E233D;
              border: 1px solid rgba(119, 119, 199, 0.22);
              border-radius: 28px;
              box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
              display: flex;
              overflow: hidden;
              color: #ffffff;
            }

            .auth-info {
              flex: 1;
              background: #161B2E;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 56px 48px;
              position: relative;
              border-right: 1px solid rgba(119, 119, 199, 0.18);
            }

            .auth-info::before {
              content: '';
              position: absolute;
              top: -15%;
              left: -15%;
              width: 450px;
              height: 450px;
              background: radial-gradient(circle, rgba(119, 119, 199, 0.14) 0%, rgba(0,0,0,0) 70%);
              border-radius: 50%;
              pointer-events: none;
            }

            .brand-header {
              display: flex;
              align-items: center;
              gap: 14px;
              z-index: 2;
            }

            .brand-logo {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .brand-name {
              font-size: 22px;
              font-weight: 800;
              letter-spacing: -0.5px;
              color: #FFFFFF;
            }

            .info-content {
              max-width: 480px;
              z-index: 2;
              margin: 40px 0;
              position: sticky;
              top: 130px;
            }

            .badge-tag {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #161B2E;
              border: 1px solid rgba(119, 119, 199, 0.35);
              color: #7777C7;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 700;
              margin-bottom: 20px;
              letter-spacing: 0.3px;
            }

            .info-title {
              font-size: 34px;
              font-weight: 800;
              line-height: 1.25;
              margin-bottom: 16px;
              background: linear-gradient(135deg, #FFFFFF 30%, #A1A1AA 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              letter-spacing: -0.8px;
            }

            .info-desc {
              color: #9CA3AF;
              line-height: 1.65;
              font-size: 14.5px;
              margin-bottom: 32px;
            }

            .feature-card {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              padding: 16px 18px;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.06);
              border-radius: 18px;
              backdrop-filter: blur(12px);
              margin-bottom: 14px;
              transition: all 0.25s ease;
            }

            .feature-card:hover {
              background: rgba(255, 255, 255, 0.05);
              border-color: rgba(119, 119, 199, 0.35);
              transform: translateY(-2px);
            }

            .feature-icon-wrapper {
              width: 40px;
              height: 40px;
              border-radius: 12px;
              background: #161B2E;
              color: #7777C7;
              display: grid;
              place-items: center;
              flex-shrink: 0;
            }

            .feature-details h4 {
              font-size: 14.5px;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0 0 4px 0;
            }

            .feature-details p {
              font-size: 12.5px;
              color: #88909E;
              margin: 0;
              line-height: 1.45;
            }

            .auth-form-side {
              flex: 1.35;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 48px 40px;
              background: #1E233D;
              z-index: 2;
            }

            .form-card {
              width: 100%;
              max-width: 580px;
            }

            .form-header-area {
              margin-bottom: 24px;
            }

            .form-title {
              font-size: 26px;
              font-weight: 800;
              margin-bottom: 6px;
              letter-spacing: -0.5px;
              color: #FFFFFF;
            }

            .form-sub {
              color: #88909E;
              font-size: 13.5px;
              margin: 0;
            }

            /* Stepper Navigation */
            .wizard-stepper {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              margin-bottom: 28px;
              padding: 10px 14px;
              background: #161B2E;
              border: 1px solid rgba(119, 119, 199, 0.22);
              border-radius: 16px;
            }

            .wizard-step-item {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              border-radius: 10px;
              font-size: 12.5px;
              font-weight: 700;
              color: #94A3B8;
              transition: all 0.2s ease;
            }

            .wizard-step-item.active {
              background: rgba(119, 119, 199, 0.18);
              color: #FFFFFF;
              border: 1px solid #7777C7;
            }

            .wizard-step-item.completed {
              color: #34D399;
            }

            .step-dot {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              display: grid;
              place-items: center;
              font-size: 11px;
              font-weight: 800;
              background: #1E233D;
              color: #9CA3AF;
            }

            .wizard-step-item.active .step-dot {
              background: #7777C7;
              color: #FFFFFF;
            }

            .wizard-step-item.completed .step-dot {
              background: #059669;
              color: #FFFFFF;
            }

            .form-section-card {
              background: #161B2E;
              border: 1px solid rgba(119, 119, 199, 0.18);
              border-radius: 20px;
              padding: 24px 22px 16px;
              margin-bottom: 22px;
            }

            .section-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
            }

            .section-num {
              width: 32px;
              height: 32px;
              border-radius: 10px;
              background: #7777C7;
              color: #FFFFFF;
              display: grid;
              place-items: center;
              font-weight: 900;
              font-size: 13.5px;
              flex-shrink: 0;
            }

            .section-title {
              font-size: 15.5px;
              font-weight: 800;
              color: #ffffff;
              letter-spacing: -0.2px;
            }

            .section-sub {
              font-size: 12px;
              font-weight: 500;
              color: #94A3B8;
              margin-top: 2px;
            }

            .input-group {
              position: relative;
              margin-bottom: 14px;
            }

            .input-icon {
              position: absolute;
              left: 14px;
              top: 50%;
              transform: translateY(-50%);
              color: #7777C7;
              display: flex;
              align-items: center;
              pointer-events: none;
              z-index: 1;
            }

            .auth-input {
              width: 100%;
              background: #1E233D;
              border: 1px solid rgba(119, 119, 199, 0.22);
              padding: 13px 14px 13px 44px;
              border-radius: 12px;
              color: #ffffff;
              font-size: 13.5px;
              transition: all 0.2s ease;
              outline: none;
              box-sizing: border-box;
            }

            .auth-input:focus {
              border-color: #7777C7;
              background: #232946;
              box-shadow: 0 0 0 3px rgba(119, 119, 199, 0.15);
            }

            .auth-input::placeholder {
              color: #64748B;
            }

            .input-grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }

            .input-suffix {
              position: absolute;
              right: 14px;
              top: 50%;
              transform: translateY(-50%);
              color: #94A3B8;
              cursor: pointer;
              display: flex;
              align-items: center;
            }

            .input-suffix:hover {
              color: #7777C7;
            }

            .error-banner {
              background: rgba(239, 68, 68, 0.1);
              border: 1px solid rgba(239, 68, 68, 0.25);
              color: #F87171;
              padding: 12px 16px;
              border-radius: 12px;
              font-size: 13px;
              margin-bottom: 20px;
              font-weight: 600;
            }

            .chip-container {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 18px;
            }

            .saved-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(16, 185, 129, 0.12);
              border: 1px solid rgba(16, 185, 129, 0.25);
              color: #34D399;
              padding: 5px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
            }

            .add-more-btn {
              width: 100%;
              background: rgba(255, 255, 255, 0.03);
              border: 1px dashed rgba(119, 119, 199, 0.3);
              color: #E5E7EB;
              padding: 12px;
              border-radius: 12px;
              font-size: 13px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              cursor: pointer;
              transition: all 0.2s ease;
              margin-bottom: 20px;
            }

            .add-more-btn:hover {
              background: rgba(119, 119, 199, 0.12);
              border-color: #7777C7;
              color: #7777C7;
            }

            .asset-hero-card {
              text-align: center;
              padding: 36px 20px;
              background: #161B2E;
              border: 1px solid rgba(119, 119, 199, 0.18);
              border-radius: 20px;
              margin-bottom: 24px;
            }

            .asset-icon-box {
              width: 68px;
              height: 68px;
              border-radius: 20px;
              background: #1E233D;
              color: #7777C7;
              display: grid;
              place-items: center;
              margin: 0 auto 16px;
              border: 1px solid rgba(119, 119, 199, 0.35);
            }

            .action-bar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-top: 24px;
              padding-top: 20px;
              border-top: 1px solid rgba(119, 119, 199, 0.15);
              gap: 12px;
            }

            .skip-btn {
              background: transparent;
              border: none;
              color: #88909E;
              font-size: 13.5px;
              font-weight: 700;
              cursor: pointer;
              padding: 10px 16px;
              border-radius: 10px;
              transition: all 0.2s ease;
            }

            .skip-btn:hover {
              color: #FFFFFF;
              background: rgba(255, 255, 255, 0.05);
            }

            .primary-btn {
              background: #7777C7;
              color: #0B0D17;
              border: none;
              padding: 13px 26px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 800;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              box-shadow: 0 8px 24px rgba(119, 119, 199, 0.35);
              transition: all 0.2s ease;
            }

            .primary-btn:hover {
              background: #6464B8;
              color: #FFFFFF;
              transform: translateY(-1px);
              box-shadow: 0 12px 28px rgba(119, 119, 199, 0.5);
            }

            .primary-btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }

            @media (max-width: 960px) {
              .auth-container {
                flex-direction: column;
              }
              .auth-info {
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                padding: 40px 24px;
              }
              .auth-form-side {
                padding: 40px 24px;
              }
              .input-grid-2 {
                grid-template-columns: 1fr;
              }
              .wizard-stepper {
                flex-wrap: wrap;
              }
            }
          `}</style>

          {/* LEFT INFO PANEL */}
          <div className="auth-info">
            <div className="brand-header">
              <div className="brand-logo">
                <img src="/logo_home.png" alt="IAssetCare" style={{ width: 28, height: 28, display: 'block', objectFit: 'contain' }} />
              </div>
              <div className="brand-name">IAssetCare</div>
            </div>

            <div className="info-content">
              <div className="badge-tag">
                <AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} /> Step {active + 1} of 4 · Workspace Setup
              </div>

              {active === 0 && (
                <>
                  <h1 className="info-title">Organization Profile</h1>
                  <p className="info-desc">
                    Establish your corporate identity, tax GSTIN/PAN details, and master registered office location.
                  </p>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><BusinessRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Corporate Identity</h4>
                      <p>Company name, industry vertical, and workforce size parameters.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><ReceiptLongRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Tax & Invoicing</h4>
                      <p>GSTIN and PAN configurations for compliant billing invoices.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><LocationOnRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Master Facility Address</h4>
                      <p>Primary operational headquarters for site asset assignment.</p>
                    </div>
                  </div>
                </>
              )}

              {active === 1 && (
                <>
                  <h1 className="info-title">Add Departments</h1>
                  <p className="info-desc">
                    Structure your organizational units and assign Head of Departments (HODs) for lifecycle governance.
                  </p>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><ApartmentRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Department Hierarchy</h4>
                      <p>Create dedicated partitions for IT, Operations, HR, and Engineering.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><PersonRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>HOD Ownership</h4>
                      <p>Designate departmental approval leaders for equipment requisitions.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><BadgeRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Asset Tag Prefixes</h4>
                      <p>Smart auto-generated departmental codes for tracking.</p>
                    </div>
                  </div>
                </>
              )}

              {active === 2 && (
                <>
                  <h1 className="info-title">Add Team Users</h1>
                  <p className="info-desc">
                    Onboard initial administrators, technicians, HODs, and employees to your tenant partition.
                  </p>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><PeopleRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Role-Based Access Control</h4>
                      <p>Assign Admin, HOD, Technician, or Employee permission tiers.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><LockRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Secure First-Run Creds</h4>
                      <p>Provision temporary master logins that users customize on entry.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><ApartmentRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Unit Alignment</h4>
                      <p>Link employees directly to their respective department partitions.</p>
                    </div>
                  </div>
                </>
              )}

              {active === 3 && (
                <>
                  <h1 className="info-title">Add First Asset</h1>
                  <p className="info-desc">
                    Initialize your physical asset repository with telemetry tracking, QR barcodes, and warranty monitoring.
                  </p>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><Inventory2RoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Hardware Inventory</h4>
                      <p>Track serial numbers, models, purchase cost, and vendors.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><BadgeRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Instant QR Code Tags</h4>
                      <p>Auto-generate printable QR stickers for physical tagging.</p>
                    </div>
                  </div>
                  <div className="feature-card">
                    <div className="feature-icon-wrapper"><CheckCircleRoundedIcon /></div>
                    <div className="feature-details">
                      <h4>Ready to Launch</h4>
                      <p>Your enterprise asset lifecycle workspace is fully primed.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ color: "#717684", fontSize: "12px", zIndex: 2 }}>
              © {new Date().getFullYear()} IAssetCare Enterprise PaaS. All rights reserved.
            </div>
          </div>

          {/* RIGHT FORM SIDE */}
          <div className="auth-form-side">
            <div className="form-card">
              <div className="form-header-area">
                <div className="form-title">Workspace Onboarding</div>
                <div className="form-sub">Quickly set up your company profile, departments, users, and assets.</div>
              </div>

              {/* 4-Step Stepper Header */}
              <div className="wizard-stepper">
                {steps.map((s, idx) => {
                  const isActive = active === idx;
                  const isCompleted = active > idx;
                  return (
                    <div
                      key={s.label}
                      className={`wizard-step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                    >
                      <div className="step-dot">{isCompleted ? "✓" : idx + 1}</div>
                      <span>{s.short}</span>
                    </div>
                  );
                })}
              </div>

              {error && <div className="error-banner">{error}</div>}

              {/* ─── STEP 0: ORGANIZATION PROFILE ─── */}
              {active === 0 && (
                <form onSubmit={handleOrgSave}>
                  <div className="form-section-card">
                    <div className="section-header">
                      <div className="section-num">1</div>
                      <div>
                        <div className="section-title">Organization Identity</div>
                        <div className="section-sub">Company details, industry, and workforce size.</div>
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><ApartmentRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        name="name"
                        placeholder="Company Legal Name (e.g., Acme Innovations Ltd)"
                        className="auth-input"
                        value={org.name}
                        onChange={(e) => setOrg({ ...org, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><BusinessCenterRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="industry"
                          placeholder="Industry (e.g. IT, Manufacturing)"
                          className="auth-input"
                          value={org.industry}
                          onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><PeopleRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="employeeCount"
                          placeholder="Employee Count"
                          className="auth-input"
                          inputMode="numeric"
                          value={org.employeeCount}
                          onChange={(e) => setOrg({ ...org, employeeCount: e.target.value.replace(/[^0-9]/g, "").slice(0, 7) })}
                        />
                      </div>
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><PhoneRoundedIcon fontSize="small" /></span>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Primary Phone Number"
                          className="auth-input"
                          value={org.phone}
                          maxLength={10}
                          inputMode="numeric"
                          onChange={(e) => setOrg({ ...org, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><LanguageRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="website"
                          placeholder="Website (e.g., https://acme.com)"
                          className="auth-input"
                          value={org.website}
                          onChange={(e) => setOrg({ ...org, website: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><EmailRoundedIcon fontSize="small" /></span>
                      <input
                        type="email"
                        name="contactEmail"
                        placeholder="Official Billing Contact Email"
                        className="auth-input"
                        value={org.contactEmail}
                        onChange={(e) => setOrg({ ...org, contactEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-section-card">
                    <div className="section-header">
                      <div className="section-num">2</div>
                      <div>
                        <div className="section-title">Taxation & Registered Location</div>
                        <div className="section-sub">Tax identifier codes and registered headquarters address.</div>
                      </div>
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><ReceiptLongRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="gstNumber"
                          placeholder="GSTIN Number (15 Digits)"
                          className="auth-input"
                          maxLength={15}
                          value={org.gstNumber}
                          onChange={(e) => setOrg({ ...org, gstNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15) })}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><BadgeRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="panNumber"
                          placeholder="PAN Number (10 Digits)"
                          className="auth-input"
                          maxLength={10}
                          value={org.panNumber}
                          onChange={(e) => setOrg({ ...org, panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) })}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><LocationOnRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        name="addressLine"
                        placeholder="Street / Office Address Line"
                        className="auth-input"
                        value={org.addressLine}
                        onChange={(e) => setOrg({ ...org, addressLine: e.target.value })}
                      />
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><PinDropRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="pin"
                          placeholder="6-Digit PIN Code (Auto-fetch)"
                          className="auth-input"
                          value={org.pin}
                          maxLength={6}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><LocationCityRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          className="auth-input"
                          value={org.city}
                          onChange={(e) => setOrg({ ...org, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><LocationOnRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="state"
                          placeholder="State (e.g., Maharashtra)"
                          className="auth-input"
                          value={org.state}
                          onChange={(e) => setOrg({ ...org, state: e.target.value })}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><LanguageRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          name="country"
                          placeholder="Country"
                          className="auth-input"
                          value={org.country}
                          onChange={(e) => setOrg({ ...org, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="action-bar">
                    <button type="button" className="skip-btn" onClick={skip}>
                      Skip this step
                    </button>
                    <button type="submit" className="primary-btn" disabled={saving}>
                      {saving ? "Saving Profile..." : "Save & Continue"}
                      {!saving && <ArrowForwardRoundedIcon fontSize="small" />}
                    </button>
                  </div>
                </form>
              )}

              {/* ─── STEP 1: ADD DEPARTMENT ─── */}
              {active === 1 && (
                <div>
                  <div className="form-section-card">
                    <div className="section-header">
                      <div className="section-num">1</div>
                      <div>
                        <div className="section-title">Department Configuration</div>
                        <div className="section-sub">Create organizational units and assign designated HODs.</div>
                      </div>
                    </div>

                    {savedDepts.length > 0 && (
                      <div className="chip-container">
                        {savedDepts.map((name, i) => (
                          <span key={i} className="saved-badge">
                            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> {name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="input-group">
                      <span className="input-icon"><ApartmentRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        placeholder="Department Name (e.g. Information Technology)"
                        className="auth-input"
                        value={dept.name}
                        onChange={(e) => setDept({ ...dept, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><PinDropRoundedIcon fontSize="small" /></span>
                      <input
                        type="text"
                        placeholder="Department Code (Optional, e.g. IT)"
                        className="auth-input"
                        value={dept.code}
                        onChange={(e) => setDept({ ...dept, code: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><PersonRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          placeholder="HOD Full Name"
                          className="auth-input"
                          value={dept.hodName}
                          onChange={(e) => setDept({ ...dept, hodName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><EmailRoundedIcon fontSize="small" /></span>
                        <input
                          type="email"
                          placeholder="HOD Email Address"
                          className="auth-input"
                          value={dept.hodEmail}
                          onChange={(e) => setDept({ ...dept, hodEmail: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><PhoneRoundedIcon fontSize="small" /></span>
                        <input
                          type="tel"
                          placeholder="HOD Phone Number"
                          className="auth-input"
                          value={dept.hodPhone}
                          maxLength={10}
                          onChange={(e) => setDept({ ...dept, hodPhone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><LocationOnRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          placeholder="Department Location / Floor"
                          className="auth-input"
                          value={dept.location}
                          onChange={(e) => setDept({ ...dept, location: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="button" className="add-more-btn" onClick={handleAddAnotherDept} disabled={saving}>
                    <AddRoundedIcon fontSize="small" /> + Add Another Department
                  </button>

                  <div className="action-bar">
                    <button type="button" className="skip-btn" onClick={skip}>
                      Skip this step
                    </button>
                    <button type="button" className="primary-btn" onClick={handleDeptContinue} disabled={saving}>
                      {saving ? "Saving..." : "Save & Continue"}
                      {!saving && <ArrowForwardRoundedIcon fontSize="small" />}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: ADD USER ─── */}
              {active === 2 && (
                <div>
                  <div className="form-section-card">
                    <div className="section-header">
                      <div className="section-num">1</div>
                      <div>
                        <div className="section-title">Team Member Account</div>
                        <div className="section-sub">Add administrators, technicians, HODs, or employees.</div>
                      </div>
                    </div>

                    {savedUsers.length > 0 && (
                      <div className="chip-container">
                        {savedUsers.map((name, i) => (
                          <span key={i} className="saved-badge">
                            <CheckCircleRoundedIcon sx={{ fontSize: 14 }} /> {name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="input-grid-2">
                      <div className="input-group">
                        <span className="input-icon"><PersonRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="auth-input"
                          value={user.name}
                          onChange={(e) => setUser({ ...user, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-icon"><BadgeRoundedIcon fontSize="small" /></span>
                        <input
                          type="text"
                          placeholder="Employee ID (e.g. EMP001)"
                          className="auth-input"
                          value={user.employeeId}
                          onChange={(e) => setUser({ ...user, employeeId: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><EmailRoundedIcon fontSize="small" /></span>
                      <input
                        type="email"
                        placeholder="User Email Address"
                        className="auth-input"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><LockRoundedIcon fontSize="small" /></span>
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Temporary Password"
                        className="auth-input"
                        value={user.password}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}
                        required
                      />
                      <span className="input-suffix" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </span>
                    </div>

                    <div className="input-grid-2">
                      <div className="input-group">
                        <select
                          className="auth-input"
                          style={{ paddingLeft: "16px", appearance: "none", cursor: "pointer" }}
                          value={user.department}
                          onChange={(e) => setUser({ ...user, department: e.target.value })}
                        >
                          <option value="" style={{ background: "#141721" }}>Select Department</option>
                          {departmentOptions.map((name) => (
                            <option key={name} value={name} style={{ background: "#141721" }}>{name}</option>
                          ))}
                          <option value="Others" style={{ background: "#141721" }}>Others</option>
                        </select>
                      </div>

                      <div className="input-group">
                        <select
                          className="auth-input"
                          style={{ paddingLeft: "16px", appearance: "none", cursor: "pointer" }}
                          value={user.role}
                          onChange={(e) => setUser({ ...user, role: e.target.value })}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r} style={{ background: "#141721", textTransform: "capitalize" }}>
                              {r.replace(/_/g, " ").toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <span className="input-icon"><PhoneRoundedIcon fontSize="small" /></span>
                      <input
                        type="tel"
                        placeholder="Mobile Phone Number"
                        className="auth-input"
                        value={user.phone}
                        maxLength={10}
                        onChange={(e) => setUser({ ...user, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 10) })}
                      />
                    </div>
                  </div>

                  <button type="button" className="add-more-btn" onClick={handleAddAnotherUser} disabled={saving}>
                    <AddRoundedIcon fontSize="small" /> + Add Another User
                  </button>

                  <div className="action-bar">
                    <button type="button" className="skip-btn" onClick={skip}>
                      Skip this step
                    </button>
                    <button type="button" className="primary-btn" onClick={handleUserContinue} disabled={saving}>
                      {saving ? "Saving..." : "Save & Continue"}
                      {!saving && <ArrowForwardRoundedIcon fontSize="small" />}
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: ADD ASSET ─── */}
              {active === 3 && (
                <div>
                  <div className="asset-hero-card">
                    <div className="asset-icon-box">
                      <Inventory2RoundedIcon sx={{ fontSize: 34 }} />
                    </div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px 0", color: "#FFFFFF" }}>
                      Register Your First Equipment Asset
                    </h3>
                    <p style={{ fontSize: "13.5px", color: "#88909E", maxWidth: "420px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                      Add laptops, servers, machinery, or office equipment into your active workspace registry with telemetry &amp; QR codes.
                    </p>

                    <button
                      type="button"
                      className="primary-btn"
                      style={{ margin: "0 auto", padding: "14px 28px" }}
                      onClick={goAddAsset}
                    >
                      <AddRoundedIcon fontSize="small" /> Add Asset Now
                      <ArrowForwardRoundedIcon fontSize="small" />
                    </button>
                  </div>

                  <div className="action-bar">
                    <button type="button" className="skip-btn" onClick={skip}>
                      Skip &amp; Finish Later
                    </button>
                    <button type="button" className="primary-btn" onClick={finish}>
                      <CheckCircleRoundedIcon fontSize="small" /> Finish Setup
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OnboardingWizard;
