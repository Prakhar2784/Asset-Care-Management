import React, { useState, useRef } from "react";
import {
  Alert, Box, Button, Chip, Divider, Grid, MenuItem,
  Paper, Snackbar, TextField, Typography, CircularProgress,
  LinearProgress, Fade, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItemButton,
  ListItemText, ListItemSecondaryAction, Autocomplete, InputAdornment, IconButton
} from "@mui/material";
import {
  SaveRounded, UploadFileRounded, CheckCircleRounded,
  DescriptionRounded, DeleteRounded, DocumentScannerRounded,
  AutoAwesomeRounded, CloseRounded, ShoppingCartRounded,
  Inventory2Rounded, ArrowBackRounded,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { createWorker } from "tesseract.js";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const SectionLabel = ({ number, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, mt: 0.5 }}>
    <Box sx={{
      width: 34, height: 34, borderRadius: "10px",
      background: "#FBBF24",
      color: "#111827",
      display: "grid", placeItems: "center",
      fontWeight: 900, fontSize: 14, flexShrink: 0,
    }}>
      {number}
    </Box>
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: 17, color: "text.primary", letterSpacing: "-0.3px" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ color: "text.secondary", fontSize: 12.5, fontWeight: 500, mt: 0.2 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

const DOC_TYPES = [
  { key: "invoice", label: "Purchase Invoice", accept: ".pdf,.png,.jpg,.jpeg" },
  { key: "warranty", label: "Warranty Card", accept: ".pdf,.png,.jpg,.jpeg" },
  { key: "amc", label: "AMC Contract", accept: ".pdf" },
  { key: "manual", label: "User Manual", accept: ".pdf" },
  { key: "service", label: "Service Report", accept: ".pdf,.docx" },
];

const AddAsset = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const isOnboarding = new URLSearchParams(location.search).get("onboarding") === "1";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "IT Asset",
    formFactor: "Movable",
    vendor: "",
    modelNumber: "",
    serialNumber: "",
    procurementDate: "",
    warrantyStart: "",
    warrantyEnd: "",
    supportPhone: "",
    supportEmail: "",
    department: "Information Technology",
    location: "",
    status: "Active",
    purchaseCost: "",
    notes: "",
    purchaseFromName: "",
    purchaseFromAddress: "",
    purchaseFromPhone: "",
    purchaseFromEmail: "",
    purchaseFromGst: "",
    servicePartnerName: "",
    servicePartnerContact: "",
  });

  const [emptyFieldsDialog, setEmptyFieldsDialog] = useState(false);
  const [blankOptionals, setBlankOptionals] = useState([]);

  const getCompletionPercentage = () => {
    const standardFields = [
      "name",
      "category",
      "formFactor",
      "vendor",
      "modelNumber",
      "serialNumber",
      "purchaseCost",
      "procurementDate",
      "warrantyStart",
      "warrantyEnd",
      "servicePartnerName",
      "servicePartnerContact",
      "supportPhone",
      "supportEmail",
      "department",
      "location",
      "notes",
      "purchaseFromName",
      "purchaseFromAddress",
      "purchaseFromPhone",
      "purchaseFromEmail",
      "purchaseFromGst"
    ];

    let filledCount = 0;
    standardFields.forEach(field => {
      if (formData[field] && formData[field].toString().trim() !== "") {
        filledCount++;
      }
    });

    const customConfigs = customFieldConfigs || [];
    let customFilled = 0;
    customConfigs.forEach(f => {
      if (customFields[f.name] && customFields[f.name].toString().trim() !== "") {
        customFilled++;
      }
    });

    const totalFields = standardFields.length + customConfigs.length;
    const totalFilled = filledCount + customFilled;

    return Math.round((totalFilled / totalFields) * 100);
  };

  const [docs, setDocs] = useState({});
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const [ocrFilled, setOcrFilled] = useState([]);
  const [ocrItems, setOcrItems] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const ocrInputRef = useRef(null);

  // Custom fields configuration and values
  const [customFieldConfigs, setCustomFieldConfigs] = useState([]);
  const [customFields, setCustomFields] = useState({});

  const [serviceCenters, setServiceCenters] = useState([]);
  const [scDialogOpen, setScDialogOpen] = useState(false);

  React.useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        const { data } = await api.get("/service-centers");
        setServiceCenters(Array.isArray(data) ? data : data.serviceCenters || []);
      } catch (err) {
        console.error("Failed to load service centers:", err);
      }
    };
    fetchServiceCenters();
  }, []);

  React.useEffect(() => {
    const fetchCustomFieldConfigs = async () => {
      try {
        const { data } = await api.get(`/custom-fields?category=${encodeURIComponent(formData.category)}`);
        setCustomFieldConfigs(data.data || []);
        const initial = {};
        (data.data || []).forEach(f => {
          initial[f.name] = "";
        });
        setCustomFields(initial);
      } catch (err) {
        console.error("Failed to load custom fields configs:", err);
      }
    };
    fetchCustomFieldConfigs();
  }, [formData.category]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleCustomFieldChange = (name, val) => {
    setCustomFields(prev => ({ ...prev, [name]: val }));
    setError(null);
  };

  const parseInvoiceText = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const full = text;
    const updates = {};

    // --- Serial Number ---
    const snLabeled = full.match(/(?:serial\s*(?:no\.?|number|#)?|s\/n|service\s*tag)[:\s#]+([A-Z0-9][A-Z0-9\-]{4,18})/i);
    const snInline = full.match(/\bSN[-:]([A-Z0-9]{5,15})\b/i);
    const snVal = snLabeled?.[1] || snInline?.[1];
    if (snVal) updates.serialNumber = snVal.trim();

    // --- Model Number ---
    const modelKnown = full.match(/\b(inspiron|latitude|thinkpad|elitebook|probook|ideapad|vostro|xps|pavilion|spectre|envy|omen|vivobook|zenbook|surface|macbook)\s+([A-Z0-9][A-Z0-9\-\/]*)/i);
    if (modelKnown) {
      const family = modelKnown[1];
      const next = modelKnown[2];
      // Drop the trailing token only if it looks like a year, not a model number
      updates.modelNumber = (/^(19|20)\d{2}$/.test(next) ? family : `${family} ${next}`).trim().substring(0, 30);
    } else {
      const modelLabeled = full.match(/(?:model\s*(?:no\.?|number|#)?)[:\s]+([A-Z0-9][\w\-\/]{3,24})/i);
      if (modelLabeled) updates.modelNumber = modelLabeled[1].trim();
    }

    // --- Purchase Cost ---
    const totalLines = full.match(/^.*\bTOTAL\b.*$/gim) || [];
    let maxCost = 0;
    for (const line of totalLines) {
      const nums = [...line.matchAll(/([\d,]+(?:\.\d{1,2})?)/g)];
      for (const n of nums) {
        const val = parseFloat(n[1].replace(/,/g, ""));
        if (val > maxCost) maxCost = val;
      }
    }
    if (maxCost >= 100) updates.purchaseCost = String(maxCost);
    else {
      const grandTotal = full.match(/(?:grand\s*total|net\s*amount|total\s*amount)[^\d]{0,10}([\d,]{4,}(?:\.\d{1,2})?)/i);
      if (grandTotal) updates.purchaseCost = grandTotal[1].replace(/,/g, "");
    }

    // --- Dates ---
    const MONTHS = { jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
                     jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12" };
    const namedDates = [];
    const namedPat = /(\d{1,2})[-\/\s](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-\/\s](\d{4})/gi;
    let nd;
    while ((nd = namedPat.exec(full)) !== null) {
      const mm = MONTHS[nd[2].toLowerCase().substring(0,3)];
      namedDates.push(`${nd[3]}-${mm}-${nd[1].padStart(2,"0")}`);
    }
    const numericDates = [];
    const numPat = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/g;
    let nm;
    while ((nm = numPat.exec(full)) !== null) {
      numericDates.push(`${nm[3]}-${nm[2]}-${nm[1]}`);
    }
    const allDates = [...namedDates, ...numericDates];
    if (allDates.length > 0) updates.procurementDate = allDates[0];
    if (allDates.length > 1) updates.warrantyEnd = allDates[allDates.length - 1];

    // --- Email ---
    const emailMatch = full.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) updates.supportEmail = emailMatch[0];

    // --- Phone (Indian) ---
    const phoneMatch = full.match(/(?:\+91[\s\-]?)?[6-9]\d{9}|\d{3,4}[\s\-]\d{4}[\s\-]\d{4}/);
    if (phoneMatch) updates.supportPhone = phoneMatch[0].replace(/\s/g, "").trim();

    // --- Vendor / Brand ---
    const BRANDS = ["Dell","HP","Lenovo","Apple","Samsung","Asus","Acer","Microsoft",
      "Cisco","Epson","Canon","Brother","LG","Sony","Logitech","Zebra","Honeywell","HCL","Toshiba"];
    for (const brand of BRANDS) {
      if (new RegExp(`\\b${brand}\\b`, "i").test(full)) { updates.vendor = brand; break; }
    }

    // --- Asset Name ---
    const productPat = /\b(dell\s+inspiron|dell\s+latitude|hp\s+\w+|lenovo\s+\w+|thinkpad\s+\w+|elitebook\s+\w+|probook\s+\w+|ideapad\s+\w+|macbook\s+\w+|xps\s+\w+|vostro\s+\w+|pavilion\s+\w+|spectre\s+\w+|asus\s+\w+|acer\s+\w+)/i;
    const productMatch = full.match(productPat);
    if (productMatch) {
      const lineStart = full.lastIndexOf("\n", productMatch.index) + 1;
      const lineEnd = full.indexOf("\n", productMatch.index);
      const rawLine = full.substring(lineStart, lineEnd > 0 ? lineEnd : lineStart + 120);
      const trimmed = rawLine
        .replace(/^\s*(?:item|product|description|desc|goods)\s*[:\-]\s*/i, "") // strip label prefixes
        .replace(/\s+(?:19|20)\d{2}\s.*$/, "") // strip from a year onward (keep model numbers like 5420)
        .replace(/\s+[\d,]+\.\d{2}\b.*$/, "")  // strip trailing amounts (e.g. 45,000.00)
        .replace(/[\|\[\]].*/g, "").replace(/\s+SN[-:]\S+/i, "");
      updates.name = trimmed.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim().substring(0, 60);
    } else {
      const skip = /^(invoice|bill|tax|gst|pan|cin|date|total|amount|page|flat|block|plot|no\.|s\.no|hsn|qty|rate|terms|place|state|buyer)/i;
      const productLine = lines.find(l => l.length > 8 && l.length < 80 && /[a-zA-Z]{3}/.test(l) && /\d/.test(l) && !skip.test(l));
      if (productLine) updates.name = productLine.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim().substring(0, 60);
    }

    // --- Category ---
    const catMap = [
      [/laptop|desktop|inspiron|thinkpad|elitebook|notebook|workstation|monitor|keyboard|mouse|printer|scanner|projector/i, "IT Asset"],
      [/switch|router|firewall|access\s*point|modem|wifi|network/i, "Networking"],
      [/chair|table|desk|cabinet|sofa|shelf/i, "Furniture"],
      [/ups|generator|stabilizer|inverter|battery|power/i, "Electrical"],
      [/phone|camera|tv|television|speaker|headphone/i, "Electronic"],
    ];
    for (const [pat, cat] of catMap) {
      if (pat.test(full)) { updates.category = cat; break; }
    }

    // --- Invoice number → notes ---
    // The capture must contain a digit *within the pattern* — a plain
    // [A-Z0-9]+ capture lets "TAX INVOICE\nInvoice No: X" swallow the word
    // "Invoice" as the token, consuming the real match
    const invMatch = full.match(/invoice\s*(?:no\.?|#|number)?[:\s]+([A-Z]{0,6}[-\/]?\d[A-Z0-9\/\-]{2,19})/i);
    if (invMatch) updates.notes = `Invoice: ${invMatch[1].trim()}`;

    return updates;
  };

  const extractLineItems = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const items = [];
    const BRANDS = ["Dell","HP","Lenovo","Apple","Samsung","Asus","Acer","Sandisk","ADATA",
                    "Logitech","Canon","Epson","Brother","LG","Sony","Cisco","HCL","Toshiba","Kingston"];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!/\bNos\b/i.test(line)) continue;
      if (/^(qty|rate|amount|total|hsn|gst|description|s\.?\s*no)/i.test(line)) continue;
      if (!/[a-zA-Z]{2}/.test(line)) continue;

      let desc = line
        .replace(/\s+\d{4,8}[\s\|]*\d+\.\d{2}[\]\s\|]*\d+\s+Nos.*/i, "")
        .replace(/\bSN[-:]\s*[A-Z0-9]{5,15}\b/gi, "")
        .replace(/[\|\[\]]/g, " ")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s+/g, " ").trim();

      if (desc.length < 3) {
        desc = line.replace(/\s+\d{4,}.*$/, "").replace(/[^\x20-\x7E]/g, " ").trim();
      }
      if (desc.length < 3 || !/[a-zA-Z]{2}/.test(desc)) continue;

      const priceNums = [...line.matchAll(/([\d,]+\.\d{2})/g)]
        .map(m => parseFloat(m[1].replace(/,/g, "")))
        .filter(n => n >= 50);
      const amount = priceNums.length ? priceNums[priceNums.length - 1] : null;

      const context = [line, lines[i+1]||"", lines[i+2]||""].join(" ");
      const snMatch = context.match(/\bSN[-:]([A-Z0-9]{5,15})\b/i) ||
                      context.match(/(?:serial\s*(?:no\.?)?|s\/n)[:\s]+([A-Z0-9\-]{5,18})/i);
      const sn = snMatch ? snMatch[1] : "";

      const nextLine = lines[i+1] || "";
      let fullName = desc;
      if (nextLine && !/\bNos\b/i.test(nextLine) && /[A-Z0-9]{4,}/i.test(nextLine) && nextLine.length < 50) {
        const contPart = nextLine.replace(/\bSN[-:]\S+/gi,"").replace(/[^\x20-\x7E]/g," ").trim();
        if (contPart.length > 2) fullName = `${desc} ${contPart}`.substring(0, 60);
      }

      let category = "IT Asset";
      if (/switch|router|modem|wifi|network/i.test(fullName)) category = "Networking";
      else if (/chair|table|desk|furniture|rack/i.test(fullName)) category = "Furniture";
      else if (/ups|generator|inverter|stabilizer/i.test(fullName)) category = "Electrical";
      else if (/phone|camera|tv|speaker|headphone/i.test(fullName)) category = "Electronic";

      const vendor = BRANDS.find(b => new RegExp(`\\b${b}\\b`, "i").test(fullName)) || "";

      items.push({ name: fullName.trim(), serialNumber: sn, purchaseCost: amount ? String(amount) : "", category, vendor, index: items.length + 1 });
    }

    return items;
  };

  const applyOcrItem = (item, sharedData = {}) => {
    const updates = { ...sharedData };
    if (item.name) updates.name = item.name;
    if (item.serialNumber) updates.serialNumber = item.serialNumber;
    if (item.purchaseCost) updates.purchaseCost = item.purchaseCost;
    if (item.category) updates.category = item.category;
    if (item.vendor) updates.vendor = item.vendor;
    const filled = Object.keys(updates).filter(k => updates[k]);
    setFormData(prev => ({ ...prev, ...updates }));
    setOcrFilled(filled);
    setShowPicker(false);
  };

  const handleOcrScan = async (file) => {
    if (!file) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrFilled([]);
    try {
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      if (import.meta.env.DEV) window.__lastOcrText = text; // debug aid for OCR tuning

      const shared = parseInvoiceText(text);
      const sharedOnly = { ...shared };
      delete sharedOnly.name; delete sharedOnly.serialNumber;
      delete sharedOnly.purchaseCost; delete sharedOnly.modelNumber;

      const items = extractLineItems(text);

      if (items.length > 1) {
        setOcrItems(items.map(it => ({ ...it, sharedData: sharedOnly })));
        setShowPicker(true);
      } else if (items.length === 1) {
        applyOcrItem(items[0], sharedOnly);
      } else {
        const filled = Object.keys(shared).filter(k => shared[k]);
        if (filled.length === 0) {
          setOcrError("Could not extract any data from this image. Try a clearer photo.");
        } else {
          setFormData(prev => ({ ...prev, ...shared }));
          setOcrFilled(filled);
        }
      }
    } catch (err) {
      setOcrError("OCR failed. Please try a clearer image.");
      console.error(err);
    } finally {
      setOcrLoading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = "";
    }
  };

  const handleDocChange = (key, file) => {
    setDocs(prev => ({ ...prev, [key]: file }));
  };

  const handleRemoveDoc = (key) => {
    setDocs(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.serialNumber.trim()) {
      setError("Asset Name and Serial Number are required.");
      return;
    }

    if (formData.warrantyStart && formData.warrantyEnd && formData.warrantyEnd < formData.warrantyStart) {
      setError("Warranty expiry date cannot be before the warranty start date.");
      return;
    }

    const missingFields = customFieldConfigs.filter(f => f.isRequired && !customFields[f.name]?.toString().trim());
    if (missingFields.length > 0) {
      setError(`Required custom field(s) missing: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    // Optional fields warning popup
    if (!force) {
      const emptyOptional = [];
      const fieldLabels = {
        vendor: "OEM / Brand",
        modelNumber: "Model Number",
        purchaseCost: "Purchase Cost",
        procurementDate: "Procurement Date",
        warrantyStart: "Warranty Start",
        warrantyEnd: "Warranty Expiry",
        servicePartnerName: "Authorized Service Partner",
        servicePartnerContact: "Service Partner Contact Person",
        supportPhone: "Support Phone",
        supportEmail: "Support Email",
        location: "Location",
        notes: "Notes",
        purchaseFromName: "Purchase From Name",
        purchaseFromAddress: "Purchase From Address",
        purchaseFromPhone: "Purchase From Phone",
        purchaseFromEmail: "Purchase From Email",
        purchaseFromGst: "Purchase From GST"
      };

      Object.keys(fieldLabels).forEach(key => {
        if (!formData[key] || formData[key].toString().trim() === "") {
          emptyOptional.push(fieldLabels[key]);
        }
      });

      customFieldConfigs.forEach(f => {
        if (!f.isRequired && (!customFields[f.name] || customFields[f.name].toString().trim() === "")) {
          emptyOptional.push(`${f.name} (Custom)`);
        }
      });

      if (emptyOptional.length > 0) {
        setBlankOptionals(emptyOptional);
        setEmptyFieldsDialog(true);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { ...formData, customFields };
      const { data: createdAsset } = await api.post('/assets', payload);

      const docEntries = Object.entries(docs);
      if (docEntries.length > 0) {
        const fd = new FormData();
        docEntries.forEach(([key, file]) => {
          fd.append('documents', file);
          fd.append('docTypes', key);
        });
        try {
          await api.post(`/assets/${createdAsset._id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          setError("Asset was registered, but the attached documents failed to upload. You can add them later from the asset's detail page.");
        }
      }

      setOpen(true);
      if (isOnboarding) {
        await api.patch('/auth/complete-onboarding');
        await refreshUser();
        setTimeout(() => navigate("/admin/dashboard"), 1500);
      } else {
        setTimeout(() => navigate("/admin/assets"), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision asset. Please ensure the serial number is unique.");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = (fieldName) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: ocrFilled.includes(fieldName) ? "rgba(17,24,39,0.06)" : "background.paper",
      ...(ocrFilled.includes(fieldName) && {
        "& fieldset": { borderColor: "#111827 !important", borderWidth: "2px !important" },
      }),
    },
    "& .MuiInputLabel-root": {
      fontWeight: 600,
      ...(ocrFilled.includes(fieldName) && { color: "text.primary" }),
    },
  });

  const docCount = Object.keys(docs).length;

  return (
    <Box sx={{ width: "100%", pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: "12px", display: "grid", placeItems: "center", bgcolor: "rgba(17,24,39,0.12)" }}>
            <Inventory2Rounded sx={{ color: "text.primary" }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.5px">Register New Asset</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Add a new company asset for warranty monitoring, service tracking and department allocation
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/admin/assets")}
          sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "10px" }}
        >
          Back to Registry
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "text.primary" } }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px", fontWeight: 600 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Progress Completion Indicator */}
        <Paper sx={{
          p: 2.2, borderRadius: "20px", border: "1px solid", borderColor: "divider",
          bgcolor: "background.paper", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.02)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2.5
        }}>
          <Typography fontSize={13.5} fontWeight={800} color="text.secondary" sx={{ minWidth: 140 }}>
            Form Completion:
          </Typography>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={getCompletionPercentage()}
              sx={{ height: 10, borderRadius: 5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "text.primary" } }}
            />
          </Box>
          <Typography fontSize={14} fontWeight={900} color="text.primary">
            {getCompletionPercentage()}%
          </Typography>
        </Paper>

        {/* OCR Invoice Scanner */}
        <Paper sx={{
          p: { xs: 2.5, md: 3 }, borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(17,24,39,0.07) 0%, rgba(17,24,39,0.04) 100%)",
          border: "1.5px dashed",
          borderColor: ocrFilled.length > 0 ? "#111827" : "rgba(17,24,39,0.3)",
          position: "relative", overflow: "hidden",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "14px", flexShrink: 0,
              background: "#111827",
              display: "grid", placeItems: "center",
            }}>
              <DocumentScannerRounded sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 16, color: "text.primary" }}>
                AI Invoice Scanner
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12.5, fontWeight: 500, mt: 0.3 }}>
                Upload a photo or scan of the purchase invoice — fields will be filled automatically.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              {ocrFilled.length > 0 && (
                <>
                  <Chip
                    icon={<CheckCircleRounded sx={{ fontSize: "14px !important", color: "#22C55E !important" }} />}
                    label={`${ocrFilled.length} field${ocrFilled.length > 1 ? "s" : ""} filled`}
                    size="small"
                    sx={{ bgcolor: "rgba(34,197,94,0.1)", color: "#22C55E", fontWeight: 700, fontSize: 11.5, border: "1px solid rgba(34,197,94,0.3)" }}
                  />
                  <Tooltip title="Clear OCR highlights">
                    <Button size="small" onClick={() => setOcrFilled([])}
                      sx={{ minWidth: 0, p: 0.5, color: "text.disabled", borderRadius: "8px" }}>
                      <CloseRounded sx={{ fontSize: 16 }} />
                    </Button>
                  </Tooltip>
                </>
              )}
              <Button
                component="label"
                variant="contained"
                disabled={ocrLoading}
                startIcon={ocrLoading ? <CircularProgress size={15} color="inherit" /> : <UploadFileRounded sx={{ fontSize: 17 }} />}
                sx={{
                  background: "#FBBF24", color: "#111827",
                  fontWeight: 800, borderRadius: "12px", px: 3, py: 1.1, fontSize: 13.5, boxShadow: "none",
                  "&:hover": { background: "#F5A623", boxShadow: "none" },
                  whiteSpace: "nowrap",
                }}>
                {ocrLoading ? "Scanning…" : ocrFilled.length > 0 ? "Scan Again" : "Upload Invoice"}
                <input ref={ocrInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) { handleOcrScan(f); setDocs(prev => ({ ...prev, invoice: f })); }
                  }} />
              </Button>
            </Box>
          </Box>

          {ocrLoading && (
            <Fade in={ocrLoading}>
              <Box sx={{ mt: 2 }}>
                <LinearProgress sx={{ borderRadius: 2, bgcolor: "rgba(17,24,39,0.12)", "& .MuiLinearProgress-bar": { background: "#111827" } }} />
                <Typography sx={{ fontSize: 12, color: "text.primary", fontWeight: 600, mt: 0.8, textAlign: "center" }}>
                  Reading invoice — this may take 10–20 seconds…
                </Typography>
              </Box>
            </Fade>
          )}

          {ocrError && (
            <Alert severity="error" onClose={() => setOcrError(null)}
              sx={{ mt: 2, borderRadius: "10px", fontSize: 13, fontWeight: 600 }}>
              {ocrError}
            </Alert>
          )}

          {ocrFilled.length > 0 && (
            <Fade in>
              <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "10px", bgcolor: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <Typography sx={{ fontSize: 12, color: "#16A34A", fontWeight: 700 }}>
                  Fields auto-filled: {ocrFilled.map(f => ({
                    name: "Asset Name", vendor: "Vendor", modelNumber: "Model",
                    serialNumber: "Serial No.", purchaseCost: "Cost", procurementDate: "Procurement Date",
                    warrantyStart: "Warranty Start", warrantyEnd: "Warranty Expiry",
                    category: "Category", supportPhone: "Support Phone",
                    supportEmail: "Support Email", notes: "Notes",
                  }[f] || f)).join(" · ")}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "text.secondary", mt: 0.3 }}>
                  Review and correct any values before saving.
                </Typography>
              </Box>
            </Fade>
          )}
        </Paper>

        {/* Section 1 — Hardware */}
        <Paper sx={{
          p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper",
          border: "1px solid", borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
        }}>
          <SectionLabel number="1" title="Hardware Specifications" subtitle="Basic technical and identity details of the asset." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField required fullWidth autoFocus name="name" value={formData.name} onChange={handleChange}
                sx={inputSx("name")} label="Asset Name *" placeholder="e.g. Dell Latitude 5420" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField required fullWidth select name="category" value={formData.category} onChange={handleChange} sx={inputSx("category")} label="Category *">
                <MenuItem value="IT Asset">IT Asset</MenuItem>
                <MenuItem value="Electrical">Electrical</MenuItem>
                <MenuItem value="Electronic">Electronic</MenuItem>
                <MenuItem value="Furniture">Furniture</MenuItem>
                <MenuItem value="Networking">Networking</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <TextField required fullWidth select name="formFactor" value={formData.formFactor} onChange={handleChange} sx={inputSx("formFactor")} label="Form Factor *">
                <MenuItem value="Movable">Movable</MenuItem>
                <MenuItem value="Fixed">Fixed / Immovable</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="vendor" value={formData.vendor} onChange={handleChange}
                sx={inputSx("vendor")} label="OEM / Brand" placeholder="e.g. Dell" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="modelNumber" value={formData.modelNumber} onChange={handleChange}
                sx={inputSx("modelNumber")} label="Model Number" placeholder="e.g. LAT-5420-X" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField required fullWidth name="serialNumber" value={formData.serialNumber} onChange={handleChange}
                sx={inputSx("serialNumber")} label="Serial Number / Service Tag *" placeholder="e.g. 8JZ91A" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="purchaseCost" value={formData.purchaseCost} onChange={handleChange}
                sx={inputSx("purchaseCost")} label="Purchase Cost (₹)" placeholder="e.g. 85000"
                type="number" slotProps={{ htmlInput: { min: 0, step: "any" } }} />
            </Grid>

            {customFieldConfigs.length > 0 && (
              <Grid size={12}>
                <Divider sx={{ my: 1.5 }}>
                  <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Custom CMDB Specifications
                  </Typography>
                </Divider>
              </Grid>
            )}

            {customFieldConfigs.map((field) => (
              <Grid key={field._id} size={{ xs: 12, sm: 6, md: 4 }}>
                {field.type === "Select" ? (
                  <TextField
                    select
                    fullWidth
                    required={field.isRequired}
                    label={`${field.name}${field.isRequired ? " *" : ""}`}
                    value={customFields[field.name] || ""}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    sx={inputSx(field.name)}
                  >
                    {field.options.map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    required={field.isRequired}
                    type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : "text"}
                    label={`${field.name}${field.isRequired ? " *" : ""}`}
                    value={customFields[field.name] || ""}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    sx={inputSx(field.name)}
                    slotProps={field.type === "Date" ? { inputLabel: { shrink: true } } : undefined}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Section 2 — Lifecycle */}
        <Paper sx={{
          p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper",
          border: "1px solid", borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
        }}>
          <SectionLabel number="2" title="Lifecycle & Vendor Data" subtitle="Warranty period, procurement date and service partner." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="procurementDate" value={formData.procurementDate}
                onChange={handleChange} sx={inputSx("procurementDate")} label="Procurement Date" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="warrantyStart" value={formData.warrantyStart}
                onChange={handleChange} sx={inputSx("warrantyStart")} label="Warranty Start" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="date" name="warrantyEnd" value={formData.warrantyEnd}
                onChange={handleChange} sx={inputSx("warrantyEnd")} label="Warranty Expiry" slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                name="servicePartnerName"
                value={formData.servicePartnerName}
                onChange={handleChange}
                sx={inputSx("servicePartnerName")}
                label="Authorized Service Partner"
                placeholder="e.g. Dell ProSupport"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setScDialogOpen(true)}
                          sx={{ fontSize: 11, fontWeight: 800, textTransform: "none", color: "text.primary", minWidth: 0, p: 0.5 }}
                        >
                          Select Registered
                        </Button>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="servicePartnerContact" value={formData.servicePartnerContact} onChange={handleChange}
                sx={inputSx("servicePartnerContact")} label="Contact Person Name" placeholder="e.g. John Doe" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth name="supportPhone" value={formData.supportPhone} onChange={handleChange}
                sx={inputSx("supportPhone")} label="Support Phone" placeholder="+91 800-456-7890" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField fullWidth type="email" name="supportEmail" value={formData.supportEmail}
                onChange={handleChange} sx={inputSx("supportEmail")} label="Support Email" placeholder="support@vendor.com" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 3 — Purchase & Transaction Details */}
        <Paper sx={{
          p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper",
          border: "1px solid", borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
        }}>
          <SectionLabel number="3" title="Purchase & Transaction Details" subtitle="Vendor purchase details, address, and GST registration." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth name="purchaseFromName" value={formData.purchaseFromName} onChange={handleChange}
                sx={inputSx("purchaseFromName")} label="Purchase From (Vendor Name)" placeholder="e.g. Reliance Retail" />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField fullWidth name="purchaseFromGst" value={formData.purchaseFromGst} onChange={handleChange}
                sx={inputSx("purchaseFromGst")} label="Vendor GST Number" placeholder="e.g. 27AAAAA1111A1Z1" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField fullWidth name="purchaseFromPhone" value={formData.purchaseFromPhone} onChange={handleChange}
                sx={inputSx("purchaseFromPhone")} label="Vendor Phone" placeholder="+91 98765-43210" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField fullWidth type="email" name="purchaseFromEmail" value={formData.purchaseFromEmail} onChange={handleChange}
                sx={inputSx("purchaseFromEmail")} label="Vendor Email" placeholder="sales@vendor.com" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={2} name="purchaseFromAddress" value={formData.purchaseFromAddress} onChange={handleChange}
                sx={inputSx("purchaseFromAddress")} label="Vendor Address" placeholder="Street, City, State, ZIP" />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4 — Deployment */}
        <Paper sx={{
          p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper",
          border: "1px solid", borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
        }}>
          <SectionLabel number="4" title="Deployment & Location" subtitle="Assign to a department and set the asset's physical location." />
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField required fullWidth select name="department" value={formData.department}
                onChange={handleChange} sx={inputSx("department")} label="Target Department *">
                <MenuItem value="Information Technology">Information Technology</MenuItem>
                <MenuItem value="Administration">Administration</MenuItem>
                <MenuItem value="Finance & Accounts">Finance & Accounts</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Human Resources">Human Resources</MenuItem>
                <MenuItem value="Sales & Marketing">Sales & Marketing</MenuItem>
                <MenuItem value="Legal">Legal</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField fullWidth name="location" value={formData.location} onChange={handleChange}
                sx={inputSx("location")} label="Physical Location" placeholder="e.g. Tower B, Floor 4, Desk 12" />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField required fullWidth select name="status" value={formData.status}
                onChange={handleChange} sx={inputSx("status")} label="Current Status *">
                <MenuItem value="Active">Active / Deployed</MenuItem>
                <MenuItem value="In Storage">In Storage</MenuItem>
                <MenuItem value="In Transit">In Transit</MenuItem>
                <MenuItem value="Under Repair">Under Repair</MenuItem>
                <MenuItem value="Decommissioned">Decommissioned</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth multiline rows={2} name="notes" value={formData.notes}
                onChange={handleChange} sx={inputSx("notes")} label="Notes (optional)"
                placeholder="Any additional notes about this asset..." />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 4 — Documents */}
        <Paper sx={{
          p: { xs: 3, md: 4 }, borderRadius: "20px", bgcolor: "background.paper",
          border: "1px solid", borderColor: "divider",
          boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: "10px",
                background: "#FBBF24",
                color: "#111827", display: "grid", placeItems: "center",
                fontWeight: 900, fontSize: 14, flexShrink: 0,
              }}>
                5
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 17, color: "text.primary", letterSpacing: "-0.3px" }}>
                  Document Vault
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12.5, fontWeight: 500, mt: 0.2 }}>
                  Attach invoice, warranty card, AMC contract, manual and service reports.
                </Typography>
              </Box>
            </Box>
            {docCount > 0 && (
              <Chip label={`${docCount} file${docCount > 1 ? "s" : ""} attached`}
                size="small" sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, fontSize: 11 }} />
            )}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {DOC_TYPES.map(({ key, label, accept }) => {
              const file = docs[key];
              return (
                <Box key={key}
                  sx={{
                    p: 2, borderRadius: "14px", border: "1.5px dashed",
                    borderColor: file ? "#111827" : "divider",
                    bgcolor: file ? "rgba(17,24,39,0.04)" : "background.default",
                    display: "flex", flexDirection: "column", gap: 1,
                    transition: "all 0.2s ease",
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: file ? "#111827" : "text.secondary" }}>
                      {label}
                    </Typography>
                    {file && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <CheckCircleRounded sx={{ fontSize: 14, color: "text.primary" }} />
                        <Button size="small" onClick={() => handleRemoveDoc(key)}
                          sx={{ minWidth: 0, p: 0.3, color: "#EF4444" }}>
                          <DeleteRounded sx={{ fontSize: 14 }} />
                        </Button>
                      </Box>
                    )}
                  </Box>
                  {file ? (
                    <Typography sx={{ fontSize: 11.5, color: "text.secondary", fontWeight: 500, wordBreak: "break-all" }}>
                      {file.name.length > 28 ? file.name.substring(0, 28) + "…" : file.name}
                    </Typography>
                  ) : (
                    <Button component="label" size="small"
                      startIcon={<UploadFileRounded sx={{ fontSize: 15 }} />}
                      sx={{
                        justifyContent: "flex-start", borderRadius: "8px", fontWeight: 700,
                        fontSize: 12, color: "text.secondary", p: 0,
                        "&:hover": { color: "text.primary", bgcolor: "transparent" }
                      }}>
                      Upload {accept.includes("pdf") ? "PDF" : "file"}
                      <input type="file" hidden accept={accept}
                        onChange={(e) => e.target.files[0] && handleDocChange(key, e.target.files[0])} />
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ mt: 2.5, p: 2, borderRadius: "12px", bgcolor: "action.hover", border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>
              Accepted formats: PDF, PNG, JPG, DOCX &nbsp;·&nbsp; Max 10 MB per file &nbsp;·&nbsp; Documents stored against this asset record
            </Typography>
          </Box>
        </Paper>

        {/* Action Row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => navigate("/admin/assets")}
            sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "12px", px: 3, py: 1.2 }}>
            Discard
          </Button>

          <Button type="submit" variant="contained" disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveRounded />}
            sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "12px", boxShadow: "none", px: 4, py: 1.4, fontSize: 15, "&:hover": { background: "#F5A623", boxShadow: "none" } }}>
            {loading ? "Registering…" : "Register Asset"}
          </Button>
        </Box>

      </Box>

      {/* Multi-item picker dialog */}
      <Dialog open={showPicker} onClose={() => setShowPicker(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", bgcolor: "background.paper" } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, fontSize: 18, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <ShoppingCartRounded sx={{ color: "text.primary" }} />
            Multiple Items Found
          </Box>
          <Typography component="div" sx={{ fontSize: 13, color: "text.secondary", fontWeight: 500, mt: 0.5 }}>
            This invoice has {ocrItems.length} items. Select the asset you want to register.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List disablePadding>
            {ocrItems.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider />}
                <ListItemButton onClick={() => applyOcrItem(item, item.sharedData)}
                  sx={{ px: 3, py: 2, "&:hover": { bgcolor: "rgba(17,24,39,0.06)" } }}>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.primary" }}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                        {item.serialNumber && (
                          <Chip label={`S/N: ${item.serialNumber}`} size="small"
                            sx={{ fontSize: 11, height: 20, bgcolor: "rgba(17,24,39,0.1)", color: "text.primary" }} />
                        )}
                        {item.purchaseCost && (
                          <Chip label={`₹${parseFloat(item.purchaseCost).toLocaleString("en-IN")}`} size="small"
                            sx={{ fontSize: 11, height: 20, bgcolor: "action.hover" }} />
                        )}
                        <Chip label={item.category} size="small"
                          sx={{ fontSize: 11, height: 20, bgcolor: "action.hover" }} />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button size="small" variant="outlined"
                      sx={{ borderRadius: "8px", fontWeight: 700, fontSize: 12, borderColor: "#111827", color: "text.primary",
                        "&:hover": { bgcolor: "rgba(17,24,39,0.08)" } }}>
                      Select
                    </Button>
                  </ListItemSecondaryAction>
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowPicker(false)} sx={{ color: "text.secondary", fontWeight: 700 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: "14px", fontWeight: 800 }}>
          Asset registered successfully.
        </Alert>
      </Snackbar>

      {/* Optional fields empty notification popup dialog */}
      <Dialog open={emptyFieldsDialog} onClose={() => setEmptyFieldsDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", bgcolor: "background.paper", p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 1, color: "text.primary" }}>
          Empty Optional Fields
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            You have left the following optional fields blank. If you'd like to fill them, click <strong>Fill Them</strong>. Otherwise, click <strong>Register Anyway</strong>.
          </Typography>
          <Box sx={{
            maxHeight: 180, overflowY: "auto", bgcolor: "action.hover", p: 1.5, borderRadius: "12px", border: "1px solid", borderColor: "divider"
          }}>
            {blankOptionals.map((field, idx) => (
              <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: idx === blankOptionals.length - 1 ? 0 : 1 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "text.primary" }} />
                <Typography fontSize={12} color="text.primary" fontWeight={700}>
                  {field}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button onClick={() => setEmptyFieldsDialog(false)} variant="outlined" sx={{ borderColor: "divider", color: "text.secondary", fontWeight: 700, borderRadius: "10px", flex: 1, textTransform: "none" }}>
            Fill Them
          </Button>
          <Button onClick={() => { setEmptyFieldsDialog(false); handleSubmit(null, true); }} variant="contained" sx={{ background: "#FBBF24", color: "#111827", fontWeight: 800, borderRadius: "10px", flex: 1, boxShadow: "none", textTransform: "none" }}>
            Register Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Service Centers Selector Dialog */}
      <Dialog open={scDialogOpen} onClose={() => setScDialogOpen(false)} fullWidth maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" } } }}>
        <DialogTitle sx={{ p: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography fontWeight={900} fontSize={17}>Select Registered Service Center</Typography>
          <IconButton size="small" onClick={() => setScDialogOpen(false)} sx={{ bgcolor: "action.hover" }}><CloseRounded fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {serviceCenters.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography fontSize={13} color="text.secondary" fontWeight={600}>No registered service centers found.</Typography>
            </Box>
          ) : (
            <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {serviceCenters.map(sc => (
                <ListItemButton
                  key={sc._id}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      servicePartnerName: sc.name,
                      servicePartnerContact: sc.contactPerson || "",
                      supportPhone: sc.phone || "",
                      supportEmail: sc.email || "",
                    }));
                    setScDialogOpen(false);
                  }}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 1.5 }}
                >
                  <ListItemText
                    primary={<Typography fontWeight={800} fontSize={14}>{sc.name}</Typography>}
                    secondary={
                      <Typography fontSize={12} color="text.secondary" mt={0.5}>
                        {sc.contactPerson ? `Contact: ${sc.contactPerson}` : ""}
                        {sc.phone ? ` · Phone: ${sc.phone}` : ""}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AddAsset;
