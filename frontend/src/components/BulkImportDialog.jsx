// frontend/src/components/BulkImportDialog.jsx
// CSV Bulk Asset Import Wizard — Template download, file upload, parse, preview, validate & submit
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Paper, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, LinearProgress, Chip, IconButton, Divider, CircularProgress
} from '@mui/material';
import {
  UploadFileRounded, DownloadRounded, CloseRounded,
  CheckCircleRounded, ErrorRounded, WarningAmberRounded,
  CloudUploadRounded, TableChartRounded, SendRounded
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const ACCENT = '#111827';
const DARK = '#111827';

const STEPS = ['Download Template', 'Upload File', 'Preview & Validate', 'Import'];

const TEMPLATE_COLUMNS = [
  'name', 'serialNumber', 'department',
  'location', 'vendor', 'modelNumber', 'purchaseCost',
  'procurementDate', 'warrantyEnd', 'status'
];

const SAMPLE_ROWS = [
  {
    name: 'Dell Latitude 3520', serialNumber: 'SN-DL-001',
    department: 'Engineering', location: 'Floor 2', vendor: 'Dell India',
    modelNumber: 'LAT3520', purchaseCost: 55000,
    procurementDate: '2023-01-15', warrantyEnd: '2026-01-14',
    status: 'Active'
  },
  {
    name: 'HP LaserJet Pro', serialNumber: 'SN-HP-002',
    department: 'Admin', location: 'Reception', vendor: 'HP India',
    modelNumber: 'M404dn', purchaseCost: 28000,
    procurementDate: '2022-06-01', warrantyEnd: '2025-06-01',
    status: 'Active'
  },
];

const REQUIRED_COLS = ['name', 'serialNumber', 'department'];

function downloadTemplate(customFieldConfigs = []) {
  const columns = [...TEMPLATE_COLUMNS];
  const sampleRows = SAMPLE_ROWS.map(r => ({ ...r }));
  
  customFieldConfigs.forEach(f => {
    columns.push(f.name);
    const sampleVal = f.type === 'Number' ? 16 : f.type === 'Date' ? '2023-05-10' : f.type === 'Select' ? (f.options[0] || 'Option') : 'Value';
    sampleRows[0][f.name] = sampleVal;
  });

  const ws = XLSX.utils.json_to_sheet(sampleRows, { header: columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Assets');

  // Add a "Instructions" sheet
  const instructions = [
    ['Field', 'Required', 'Notes'],
    ['name', 'Yes', 'Asset display name'],
    ['serialNumber', 'Yes', 'Must be unique per company'],
    ['department', 'Yes', 'Department name (must match exactly)'],
    ['location', 'No', 'Physical location / room'],
    ['vendor', 'No', 'Vendor / supplier name'],
    ['modelNumber', 'No', 'Manufacturer model number'],
    ['purchaseCost', 'No', 'Number in INR (e.g., 55000)'],
    ['procurementDate', 'No', 'YYYY-MM-DD format'],
    ['warrantyEnd', 'No', 'YYYY-MM-DD format'],
    ['status', 'No', 'Active (default) / In Storage / Decommissioned'],
  ];

  customFieldConfigs.forEach(f => {
    instructions.push([
      f.name,
      f.isRequired ? 'Yes' : 'No',
      `${f.type} type custom field configured for category '${f.category}'.${f.type === 'Select' ? ` Choices: ${f.options.join(', ')}` : ''}`
    ]);
  });

  const wsInst = XLSX.utils.aoa_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInst, 'Instructions');

  XLSX.writeFile(wb, 'AssetCare_Bulk_Import_Template.xlsx');
}

export default function BulkImportDialog({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [rows, setRows] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    if (!open) return;
    api.get('/custom-fields')
      .then(res => setCustomFields(res.data.data || []))
      .catch(e => console.error("Failed to load custom fields for bulk template:", e));
  }, [open]);

  const reset = () => {
    setStep(0); setRows([]); setValidRows([]); setParseErrors([]);
    setFileName(''); setImporting(false); setResult(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
          .filter(row => REQUIRED_COLS.some(c => row[c]?.toString().trim()));

        const errors = [];
        const valid = [];

        data.forEach((row, i) => {
          const missing = REQUIRED_COLS.filter(c => !row[c]?.toString().trim());
          if (missing.length > 0) {
            errors.push({ row: i + 2, issue: `Missing: ${missing.join(', ')}`, data: row });
          } else {
            valid.push(row);
          }
        });

        setRows(data);
        setValidRows(valid);
        setParseErrors(errors);
        setStep(2);
      } catch {
        setParseErrors([{ row: 0, issue: 'Could not parse file. Please use the provided template.' }]);
        setStep(2);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, []);

  const handleImport = async () => {
    setImporting(true);
    try {
      const payload = validRows.map(r => ({
        name: r.name?.toString().trim(),
        serialNumber: r.serialNumber?.toString().trim(),
        department: r.department?.toString().trim(),
        location: r.location?.toString().trim() || '',
        vendor: r.vendor?.toString().trim() || '',
        modelNumber: r.modelNumber?.toString().trim() || '',
        purchaseCost: r.purchaseCost ? Number(r.purchaseCost) : undefined,
        procurementDate: r.procurementDate ? String(r.procurementDate) : undefined,
        warrantyEnd: r.warrantyEnd ? String(r.warrantyEnd) : undefined,
        status: r.status?.toString().trim() || 'Active',
      }));

      const { data } = await api.post('/assets/bulk-import', { rows: payload });
      setResult(data);
      setStep(3);
      if (data.imported > 0) onSuccess?.();
    } catch (e) {
      setResult({ error: e?.response?.data?.message || 'Import failed. Please try again.' });
      setStep(3);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '16px', bgcolor: 'background.paper' } } }}>

      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: DARK, display: 'grid', placeItems: 'center' }}>
              <CloudUploadRounded sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={18}>Bulk Asset Import</Typography>
              <Typography variant="caption" color="text.secondary">Import up to 1000 assets from an Excel / CSV file</Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small"><CloseRounded /></IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel sx={{
                '& .MuiStepLabel-label': { fontWeight: 700, fontSize: 12 },
                '& .MuiStepIcon-root.Mui-active': { color: ACCENT },
                '& .MuiStepIcon-root.Mui-completed': { color: ACCENT },
                '& .MuiStepIcon-text': { fill: '#fff' },
              }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ─── STEP 0 — Download Template ─── */}
        {step === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: `${ACCENT}15`, mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TableChartRounded sx={{ fontSize: 40, color: ACCENT }} />
            </Box>
            <Typography variant="h6" fontWeight={800} mb={1}>Start with our Excel Template</Typography>
            <Typography color="text.secondary" mb={3} sx={{ maxWidth: 480, mx: 'auto' }}>
              Download the pre-formatted template with sample data and instructions. Fill it in and upload it back.
            </Typography>
            <Button
              id="download-template-btn"
              variant="contained"
              size="large"
              startIcon={<DownloadRounded />}
              onClick={() => { downloadTemplate(customFields); setStep(1); }}
              sx={{ bgcolor: ACCENT, color: '#fff', fontWeight: 900, borderRadius: '12px', px: 4, py: 1.3 }}
            >
              Download Template (.xlsx)
            </Button>
            <Typography variant="caption" color="text.disabled" display="block" mt={2}>
              You can also upload an existing spreadsheet — just ensure column headers match the template.
            </Typography>
          </Box>
        )}

        {/* ─── STEP 1 — Upload File ─── */}
        {step === 1 && (
          <Box>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
            <Paper
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile({ target: { files: [file], value: '' } });
              }}
              sx={{
                p: 6, borderRadius: 3, border: '2px dashed', borderColor: ACCENT,
                bgcolor: `${ACCENT}08`, cursor: 'pointer', textAlign: 'center',
                '&:hover': { bgcolor: `${ACCENT}12` }, transition: 'all 0.2s'
              }}
            >
              <UploadFileRounded sx={{ fontSize: 52, color: ACCENT, mb: 2 }} />
              <Typography variant="h6" fontWeight={800} color="text.primary">Drop your file here or click to browse</Typography>
              <Typography color="text.secondary" mt={1}>Supports .xlsx, .xls, .csv — up to 1000 assets</Typography>
            </Paper>
            <Button variant="text" size="small" sx={{ mt: 1.5, color: 'text.secondary', fontWeight: 700 }} onClick={() => setStep(0)}>
              ← Back to template
            </Button>
          </Box>
        )}

        {/* ─── STEP 2 — Preview & Validate ─── */}
        {step === 2 && (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
              <Chip icon={<CheckCircleRounded />} label={`${validRows.length} valid rows`} sx={{ bgcolor: '#14532d', color: '#4ade80', fontWeight: 700 }} />
              {parseErrors.length > 0 && (
                <Chip icon={<ErrorRounded />} label={`${parseErrors.length} rows with errors`} sx={{ bgcolor: '#450a0a', color: '#f87171', fontWeight: 700 }} />
              )}
              <Chip icon={<TableChartRounded />} label={fileName} variant="outlined" sx={{ fontWeight: 600 }} />
            </Box>

            {parseErrors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography fontWeight={700} mb={0.5}>{parseErrors.length} row(s) have validation errors and will be skipped:</Typography>
                {parseErrors.slice(0, 5).map((e, i) => (
                  <Typography key={i} variant="body2">Row {e.row}: {e.issue}</Typography>
                ))}
                {parseErrors.length > 5 && <Typography variant="caption">...and {parseErrors.length - 5} more</Typography>}
              </Alert>
            )}

            {validRows.length > 0 && (
              <TableContainer sx={{ maxHeight: 280, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['#', 'Name', 'Serial No.', 'Category', 'Department', 'Vendor', 'Cost', 'Status'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', bgcolor: 'background.paper' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validRows.map((r, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ color: 'text.disabled', fontSize: 11 }}>{i + 1}</TableCell>
                        <TableCell><Typography fontSize={12} fontWeight={600}>{r.name}</Typography></TableCell>
                        <TableCell><Typography fontSize={11} color="text.secondary">{r.serialNumber}</Typography></TableCell>
                        <TableCell><Chip label={r.category} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700 }} /></TableCell>
                        <TableCell><Typography fontSize={12}>{r.department}</Typography></TableCell>
                        <TableCell><Typography fontSize={12} color="text.secondary">{r.vendor || '—'}</Typography></TableCell>
                        <TableCell><Typography fontSize={12}>₹{r.purchaseCost ? Number(r.purchaseCost).toLocaleString('en-IN') : '—'}</Typography></TableCell>
                        <TableCell>
                          <Chip label={r.status || 'Active'} size="small"
                            sx={{ height: 18, fontSize: 10, fontWeight: 700,
                              bgcolor: r.status === 'Active' ? '#14532d' : '#1e293b',
                              color: r.status === 'Active' ? '#4ade80' : '#94a3b8' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* ─── STEP 3 — Result ─── */}
        {step === 3 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {result?.error ? (
              <>
                <ErrorRounded sx={{ fontSize: 60, color: '#f87171', mb: 2 }} />
                <Typography variant="h6" fontWeight={800} color="error.main">Import Failed</Typography>
                <Typography color="text.secondary" mt={1}>{result.error}</Typography>
              </>
            ) : (
              <>
                <CheckCircleRounded sx={{ fontSize: 60, color: ACCENT, mb: 2 }} />
                <Typography variant="h5" fontWeight={900}>Import Complete!</Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2.5 }}>
                  <Paper sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', minWidth: 110 }}>
                    <Typography variant="h3" fontWeight={900} color={ACCENT}>{result?.imported || 0}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>Assets Imported</Typography>
                  </Paper>
                  {result?.skipped > 0 && (
                    <Paper sx={{ p: 2.5, borderRadius: 2, textAlign: 'center', minWidth: 110 }}>
                      <Typography variant="h3" fontWeight={900} color="#f87171">{result.skipped}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>Skipped</Typography>
                    </Paper>
                  )}
                </Box>
                {result?.errors?.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, textAlign: 'left' }}>
                    {result.errors.slice(0, 3).map((e, i) => (
                      <Typography key={i} variant="body2">Row {e.row}: {e.issue}</Typography>
                    ))}
                  </Alert>
                )}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2.5 }}>
        {step === 0 && (
          <Button onClick={() => setStep(1)} variant="outlined" sx={{ fontWeight: 700, borderRadius: '10px' }}>
            I already have a file →
          </Button>
        )}
        {step === 1 && (
          <Button onClick={() => fileRef.current?.click()} variant="outlined" startIcon={<UploadFileRounded />} sx={{ fontWeight: 700, borderRadius: '10px' }}>
            Choose File
          </Button>
        )}
        {step === 2 && (
          <>
            <Button onClick={() => { setStep(1); setRows([]); setValidRows([]); setParseErrors([]); }} sx={{ color: 'text.secondary', fontWeight: 700 }}>
              ← Change File
            </Button>
            <Button
              id="confirm-bulk-import-btn"
              variant="contained"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              startIcon={importing ? <CircularProgress size={16} /> : <SendRounded />}
              sx={{ bgcolor: ACCENT, color: '#fff', fontWeight: 900, borderRadius: '10px', px: 3 }}
            >
              {importing ? 'Importing...' : `Import ${validRows.length} Asset(s)`}
            </Button>
          </>
        )}
        {step === 3 && (
          <Button variant="contained" onClick={handleClose} sx={{ bgcolor: ACCENT, color: '#fff', fontWeight: 900, borderRadius: '10px', px: 3 }}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
