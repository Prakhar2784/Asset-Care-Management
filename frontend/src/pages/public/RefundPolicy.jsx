import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import PageHeader from '../../components/PageHeader';

export default function RefundPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <PageHeader title="Refund & Cancellation Policy" subtitle="Last updated: October 2026" />
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" mb={2}>1. Subscription Cancellations</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          You may cancel your subscription at any time. Cancellation will take effect at the end of your current billing cycle.
        </Typography>
        <Typography variant="h6" mb={2}>2. Refunds</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Generally, all charges for purchases are nonrefundable, and there are no refunds or credits for partially used periods. Exceptions may be made on a case-by-case basis at our sole discretion.
        </Typography>
      </Paper>
    </Container>
  );
}