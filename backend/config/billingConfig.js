module.exports = {
  // Base Company State used to determine CGST/SGST vs IGST
  // If customer is in same state, it's 9% CGST + 9% SGST. Otherwise, 18% IGST.
  COMPANY_STATE: 'Maharashtra',
  GST_RATE: 0.18, // 18%

  PLANS: {
    HOME_USER: {
      name: 'Home User',
      price: 999,
      maxAssets: 20,
      description: 'Up to 20 assets'
    },
    MSME: {
      name: 'MSME',
      price: 2999,
      maxAssets: 50,
      description: 'Up to 50 assets'
    },
    LARGE_SCALE: {
      name: 'Large Scale',
      price: 8999,
      maxAssets: 999999999,
      description: 'Unlimited assets'
    }
  },

  COUPONS: {
    'WELCOME50': {
      type: 'fixed',
      value: 50,
      minPurchase: 0,
      active: true
    },
    'SAVE10': {
      type: 'percentage',
      value: 10,
      minPurchase: 1000,
      active: true
    }
  }
};