import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Divider, Button, CircularProgress } from '@mui/material';
import { PrintRounded } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data } = await api.get('/billing/invoices/' + id);
      setInvoice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (!invoice) return <Typography>No invoice found.</Typography>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="flex-end" gap={2} mb={3} className="no-print">
        <Button variant="outlined" startIcon={<PrintRounded />} onClick={() => window.print()}>Print</Button>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 6 }, borderRadius: 2 }} id="printable-invoice">
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
              <Box component="img" src="/logo.png" alt="IAssetCare" sx={{ width: 44, height: 44, objectFit: "contain" }} />
              <Typography variant="h4" fontWeight={900} color="primary.main">IAssetCare</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              123 Enterprise Drive<br/>
              Mumbai, Maharashtra 400001<br/>
              GSTIN: 27AAAAA0000A1Z5
            </Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography variant="h5" fontWeight={700} color="text.secondary">TAX INVOICE</Typography>
            <Typography variant="body2" mt={1}><strong>Invoice #:</strong> {invoice.invoiceNumber}</Typography>
            <Typography variant="body2"><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</Typography>
            <Typography variant="body2" color="success.main" fontWeight={600} mt={1}>Status: {invoice.status}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>BILL TO</Typography>
            <Typography variant="h6" fontWeight={700}>{invoice.companyName}</Typography>
            <Typography variant="body2">{invoice.address}</Typography>
            <Typography variant="body2">{invoice.city}, {invoice.state} {invoice.pin}</Typography>
            {invoice.gstin && <Typography variant="body2" mt={1}><strong>GSTIN:</strong> {invoice.gstin}</Typography>}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>SUBSCRIPTION DETAILS</Typography>
            <Typography variant="body2"><strong>Plan:</strong> {invoice.planName}</Typography>
            <Typography variant="body2"><strong>Period:</strong> {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}</Typography>
          </Grid>
        </Grid>

        <Box mt={6}>
          <Grid container sx={{ bgcolor: 'rgba(0,0,0,0.04)', p: 2, borderRadius: 1, fontWeight: 700 }}>
            <Grid item xs={8}>Description</Grid>
            <Grid item xs={4} textAlign="right">Amount</Grid>
          </Grid>
          
          <Grid container sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Grid item xs={8}>
              <Typography variant="body1">{invoice.planName} - 1 Year Subscription</Typography>
            </Grid>
            <Grid item xs={4} textAlign="right">
              ₹{invoice.baseAmount.toFixed(2)}
            </Grid>
          </Grid>
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Box width="300px">
            {invoice.discountAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">Discount ({invoice.couponCode})</Typography>
                <Typography color="success.main">-₹{invoice.discountAmount.toFixed(2)}</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography color="text.secondary">Taxable Amount</Typography>
              <Typography>₹{invoice.taxableAmount.toFixed(2)}</Typography>
            </Box>
            {invoice.cgst > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">CGST</Typography>
                <Typography>₹{invoice.cgst.toFixed(2)}</Typography>
              </Box>
            )}
            {invoice.sgst > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">SGST</Typography>
                <Typography>₹{invoice.sgst.toFixed(2)}</Typography>
              </Box>
            )}
            {invoice.igst > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography color="text.secondary">IGST</Typography>
                <Typography>₹{invoice.igst.toFixed(2)}</Typography>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight={800}>Total</Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main">₹{invoice.totalAmount.toFixed(2)}</Typography>
            </Box>
          </Box>
        </Box>

        <Box mt={8} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Thank you for subscribing to IAssetCare. For billing inquiries, contact billing@iassetcare.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}