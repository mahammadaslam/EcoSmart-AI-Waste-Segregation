import { Router, Response } from 'express';
import { db } from '../config/db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET ALL USERS (ADMIN)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const usersList = await db.getUsers();
    // Exclude password hashes for security
    const sanitizedUsers = usersList.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      google_id: u.google_id,
      profile_image: u.profile_image,
      role: u.role,
      created_at: u.created_at
    }));

    res.json({ users: sanitizedUsers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve admin users: ' + error.message });
  }
});

// GET ALL SCANS (ADMIN)
router.get('/scans', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allScans = await db.getScans();
    const usersList = await db.getUsers();

    // Map scanner details with username profiles
    const mappedScans = allScans.map(scan => {
      const user = usersList.find(u => u.id === scan.user_id);
      return {
        ...scan,
        username: user ? user.name : 'Unknown User',
        userEmail: user ? user.email : 'Deleted Email'
      };
    });

    res.json({ scans: mappedScans });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve admin scans: ' + error.message });
  }
});

// DELETE USER ACCOUNT (ADMIN - CASCADE DELETES ALL TRACES)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const targetId = parseInt(req.params.id);

  if (targetId === req.user?.id) {
    res.status(400).json({ error: "Self-account termination is prohibited. Please request deletion from an outside administrator." });
    return;
  }

  try {
    const success = await db.deleteUser(targetId);
    if (success) {
      res.json({ message: 'User account and associated records terminated successfully.' });
    } else {
      res.status(404).json({ error: 'User account not located in database.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SPECIFIC SCAN FROM DATABASE (ADMIN)
router.delete('/scans/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const scanId = parseInt(req.params.id);

  try {
    const success = await db.deleteScan(scanId);
    if (success) {
      res.json({ message: 'Scan record deleted from database successfully.' });
    } else {
      res.status(404).json({ error: 'Scan record not found.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET SYSTEM GENERAL ANALYTICS SUMMARY (ADMIN & STANDARD USERS FOR THE MAIN DASHBOARD)
router.get('/analytics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.role === 'admin' ? undefined : req.user?.id;
    const scansList = await db.getScans(userId);

    // Initial default calculations (Strictly 0 if database is completely empty!)
    const stats = {
      totalScans: scansList.length,
      plasticCount: scansList.filter(s => s.category === 'Plastic').length,
      paperCount: scansList.filter(s => s.category === 'Paper').length,
      metalCount: scansList.filter(s => s.category === 'Metal').length,
      organicCount: scansList.filter(s => s.category === 'Organic' || s.category === 'Organic/Biodegradable').length,
      eWasteCount: scansList.filter(s => s.category === 'E-Waste').length,
      glassCount: scansList.filter(s => s.category === 'Glass').length,
      otherCount: scansList.filter(s => s.category === 'Other' || s.category === 'Hazardous Waste' || s.category === 'Mixed Waste').length,
    };

    // Monthly aggregation for trends (Empty if no data exists)
    // Format: [{ month: 'June', count: 5 }]
    const monthlyMap: { [key: string]: number } = {};
    const categoriesMap: { [key: string]: number } = {};

    scansList.forEach(scan => {
      // 1. Accumulate Monthly Trends
      try {
        const date = new Date(scan.created_at);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + 1;
      } catch (err) {
        // Fallback string month parsing
        monthlyMap['Unknown'] = (monthlyMap['Unknown'] || 0) + 1;
      }

      // 2. Accumulate Category Distributions
      categoriesMap[scan.category] = (categoriesMap[scan.category] || 0) + 1;
    });

    const monthlyTrends = Object.keys(monthlyMap).map(m => ({
      month: m,
      count: monthlyMap[m]
    })).reverse(); // Keeping ascending timeline list

    const categoryDistribution = Object.keys(categoriesMap).map(c => ({
      name: c,
      value: categoriesMap[c]
    }));

    res.json({
      stats,
      monthlyTrends,
      categoryDistribution
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Analytics compilation failed: ' + error.message });
  }
});

export default router;
