import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <PageHeader title="Privacy Policy" subtitle="Last updated: October 2026" />
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" mb={2}>1. Data Collection</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We collect information you provide directly to us, such as when you create or modify your account, request support, or otherwise communicate with us.
        </Typography>
        <Typography variant="h6" mb={2}>2. Use of Information</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We use the information we collect to provide, maintain, and improve our services, process transactions, and send related information including confirmations and invoices.
        </Typography>
        <Typography variant="h6" mb={2}>3. Data Security</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
        </Typography>
      </Paper>
    </Container>
  );
}