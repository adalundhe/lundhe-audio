export 
  const getDiscountLable = (discounts: number[]) => discounts.filter(d => d > 0).map(d => `${d}%`).join(' + ')