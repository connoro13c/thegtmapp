import type { Request, Response } from 'express';

export const getAccounts = async (req: Request, res: Response) => {
  try {
    // TODO: Implement with Prisma
    res.status(200).json({ message: 'Get accounts endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Implement with Prisma
    res.status(200).json({ message: `Get account ${id}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    // TODO: Implement with Prisma
    res.status(201).json({ message: 'Create account endpoint' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // TODO: Implement with Prisma
    res.status(200).json({ message: `Update account ${id}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account' });
  }
};

export const scoreAccount = async (req: Request, res: Response) => {
  try {
    const { accounts, weights } = req.body;

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return res.status(400).json({ error: 'Invalid accounts data' });
    }

    if (!weights) {
      return res.status(400).json({ error: 'Missing scoring weights' });
    }

    // Implement a simplified scoring algorithm
    // In a real implementation, this would use a machine learning model like Random Forest
    const scoredAccounts = accounts.map(account => {
      // Calculate base score components
      let score = 0;
      let totalWeight = 0;
      
      // Score based on segment (Enterprise > SMB > Self-Service)
      if (account['Current FY Segmentation']) {
        const segmentScore = 
          account['Current FY Segmentation'] === 'Enterprise' ? 100 :
          account['Current FY Segmentation'] === 'SMB' ? 70 :
          account['Current FY Segmentation'] === 'Self-Service' ? 40 : 0;
        
        score += segmentScore * weights.segment;
        totalWeight += weights.segment;
      }
      
      // Score based on industry
      if (account['Clearbit Industry Group']) {
        // Prioritize certain industries (example)
        const industryScores: Record<string, number> = {
          'Software & Services': 100,
          'Technology Hardware & Equipment': 90,
          'Media & Entertainment': 80,
          'Diversified Financials': 75,
          'Health Care Equipment & Services': 70
        };
        
        const industryScore = industryScores[account['Clearbit Industry Group']] || 50;
        score += industryScore * weights.industry;
        totalWeight += weights.industry;
      }
      
      // Score based on employee count
      if (account['Employee Range']) {
        const employeeRangeScores: Record<string, number> = {
          'Over 10,000': 100,
          '5,000 - 10,000': 90,
          '1,000 - 5,000': 80,
          '500 - 1,000': 70,
          '250 - 500': 60,
          '100 - 250': 50,
          '50 - 100': 40,
          '20 - 50': 30,
          '10 - 20': 20,
          '1 - 10': 10
        };
        
        const employeeScore = employeeRangeScores[account['Employee Range']] || 50;
        score += employeeScore * weights.employeeRange;
        totalWeight += weights.employeeRange;
      }
      
      // Score based on annual revenue
      if (account['Annual Revenue']) {
        let revenueScore = 0;
        const revenue = Number.parseFloat(String(account['Annual Revenue']).replace(/,/g, ''));
        
        if (!Number.isNaN(revenue)) {
          if (revenue > 1000000000) revenueScore = 100; // > $1B
          else if (revenue > 500000000) revenueScore = 90; // > $500M
          else if (revenue > 100000000) revenueScore = 80; // > $100M
          else if (revenue > 50000000) revenueScore = 70; // > $50M
          else if (revenue > 10000000) revenueScore = 60; // > $10M
          else if (revenue > 5000000) revenueScore = 50; // > $5M
          else if (revenue > 1000000) revenueScore = 40; // > $1M
          else revenueScore = 30; // < $1M
        }
        
        score += revenueScore * weights.annualRevenue;
        totalWeight += weights.annualRevenue;
      }
      
      // Score based on customer flag
      if (account['Customer Flag']) {
        const customerScore = account['Customer Flag'] === 'Customer' ? 100 : 50;
        score += customerScore * weights.customerFlag;
        totalWeight += weights.customerFlag;
      }
      
      // Score based on ARR
      if (account['Calculated ARR']) {
        let arrScore = 0;
        const arr = Number.parseFloat(String(account['Calculated ARR']).replace(/,/g, ''));
        
        if (!Number.isNaN(arr) && arr > 0) {
          if (arr > 1000000) arrScore = 100; // > $1M ARR
          else if (arr > 500000) arrScore = 90; // > $500K ARR
          else if (arr > 100000) arrScore = 80; // > $100K ARR
          else if (arr > 50000) arrScore = 70; // > $50K ARR
          else if (arr > 10000) arrScore = 60; // > $10K ARR
          else arrScore = 50; // < $10K ARR
        }
        
        score += arrScore * weights.calculatedARR;
        totalWeight += weights.calculatedARR;
      }
      
      // Normalize score to 1-100 range
      const normalizedScore = totalWeight > 0 ? Math.round(score / totalWeight) : 50;
      
      // Ensure score is within 1-100 range
      const finalScore = Math.max(1, Math.min(100, normalizedScore));
      
      return {
        ...account,
        'Account Score': finalScore
      };
    });

    res.status(200).json({ scoredAccounts });
  } catch (error) {
    console.error('Error scoring accounts:', error);
    res.status(500).json({ error: 'Failed to score accounts' });
  }
};
