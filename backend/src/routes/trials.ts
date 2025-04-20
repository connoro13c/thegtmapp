import express from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

// Create a separate router for non-parameterized endpoints
const noAuthRouter = express.Router();

// Test endpoint - no authentication needed
noAuthRouter.get('/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint working' });
});

// Generate static inspiration for ICP - no OpenAI API calls
noAuthRouter.get('/icp-inspiration', (req, res) => {
  // Static inspiration text - no API calls
  const inspiration = "Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.";
  
  // Return the static inspiration
  res.status(200).json({ inspiration });
});

// OpenAI-powered ICP inspiration
noAuthRouter.get('/ai-inspiration', async (req, res) => {
  try {
    console.log('AI inspiration endpoint called');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Generate inspiration with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping with generating Ideal Customer Profile (ICP) descriptions. 
          Create a concise description of a hypothetical B2B or B2C company's ideal customer profile.
          
          Follow this exact format: "Our best-fit customers are usually fast-growing [INDUSTRY TYPE] companies with [EMPLOYEE RANGE] employees, based in [LOCATION]. They use tools like [TOOL1] and [TOOL2], and their main use case is [USE CASE]. We typically sell to [BUYER PERSONAS]. [BAD FIT DESCRIPTION] are usually a bad fit."
          
          Vary your responses each time with different industries, sizes, tools, and regions.
          
          Keep your response to a single paragraph with exactly the format specified.`
        },
        {
          role: "user",
          content: "Generate an Ideal Customer Profile for a B2B/B2C software company."
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    const inspiration = completion.choices[0].message.content?.trim();
    console.log('Generated inspiration:', inspiration);
    
    res.status(200).json({ inspiration });
  } catch (error) {
    console.error('Error generating inspiration:', error);
    
    // Fallback static inspiration
    res.status(200).json({ 
      inspiration: 'Our best-fit customers are usually fast-growing B2C SaaS companies with 50 to 500 employees, based in North America. They use tools like Stripe and Shopify, and their main use case is reducing cart abandonment. We typically sell to heads of marketing or growth. Hardware or government orgs are usually a bad fit.',
      source: 'fallback'
    });
  }
});

// Start a new trial
router.post('/start', async (req, res) => {
  try {
    const { userId, timestamp } = req.body;
    
    // Create a new trial in the database
    const trial = await prisma.trial.create({
      data: {
        userId: userId || null,
        startedAt: timestamp || new Date().toISOString(),
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    });
    
    res.status(201).json({
      trialId: trial.id,
      message: 'Trial started successfully',
      expiresAt: trial.expiresAt
    });
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

// Update ICP definition
router.post('/:trialId/icp', async (req, res) => {
  try {
    const { trialId } = req.params;
    const icpData = req.body;
    
    // Update the trial with ICP data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        icpDefinition: icpData,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'ICP definition updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating ICP definition:', error);
    res.status(500).json({ error: 'Failed to update ICP definition' });
  }
});

// Update accounts data
router.post('/:trialId/accounts', async (req, res) => {
  try {
    const { trialId } = req.params;
    const accountsData = req.body;
    
    // Update the trial with accounts data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        accountsData,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Accounts data updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating accounts data:', error);
    res.status(500).json({ error: 'Failed to update accounts data' });
  }
});

// Update segments data
router.post('/:trialId/segments', async (req, res) => {
  try {
    const { trialId } = req.params;
    const segmentsData = req.body;
    
    // Update the trial with segments data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        segmentsData,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Segments data updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating segments data:', error);
    res.status(500).json({ error: 'Failed to update segments data' });
  }
});

// Update territories data
router.post('/:trialId/territories', async (req, res) => {
  try {
    const { trialId } = req.params;
    const territoriesData = req.body;
    
    // Update the trial with territories data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        territoriesData,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Territories data updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating territories data:', error);
    res.status(500).json({ error: 'Failed to update territories data' });
  }
});

// Update metrics data
router.post('/:trialId/metrics', async (req, res) => {
  try {
    const { trialId } = req.params;
    const metricsData = req.body;
    
    // Update the trial with metrics data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        metricsData,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Metrics data updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating metrics data:', error);
    res.status(500).json({ error: 'Failed to update metrics data' });
  }
});

// Save entire trial state in one call
router.post('/:trialId/state', async (req, res) => {
  try {
    const { trialId } = req.params;
    const { 
      icpDefinition,
      accountsData,
      segmentsData,
      territoriesData,
      metricsData, 
      currentStep 
    } = req.body;
    
    // Build update object with only provided fields
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    
    if (icpDefinition !== undefined) updateData.icpDefinition = icpDefinition;
    if (accountsData !== undefined) updateData.accountsData = accountsData;
    if (segmentsData !== undefined) updateData.segmentsData = segmentsData;
    if (territoriesData !== undefined) updateData.territoriesData = territoriesData;
    if (metricsData !== undefined) updateData.metricsData = metricsData;
    if (currentStep !== undefined) updateData.currentStep = currentStep;
    
    // Update the trial with all provided data
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: updateData,
    });
    
    res.status(200).json({
      message: 'Trial state updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating trial state:', error);
    res.status(500).json({ error: 'Failed to update trial state' });
  }
});

// Update current step
router.post('/:trialId/step', async (req, res) => {
  try {
    const { trialId } = req.params;
    const { currentStep } = req.body;
    
    if (currentStep === undefined) {
      return res.status(400).json({ error: 'Current step is required' });
    }
    
    // Update the trial with current step
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        currentStep,
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Current step updated successfully',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error updating current step:', error);
    res.status(500).json({ error: 'Failed to update current step' });
  }
});

// Get trial status and data
router.get('/:trialId', async (req, res) => {
  try {
    const { trialId } = req.params;
    
    const trial = await prisma.trial.findUnique({
      where: { id: trialId },
    });
    
    if (!trial) {
      return res.status(404).json({ error: 'Trial not found' });
    }
    
    res.status(200).json(trial);
  } catch (error) {
    console.error('Error getting trial:', error);
    res.status(500).json({ error: 'Failed to get trial information' });
  }
});

// Get active trial for user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const trial = await prisma.trial.findFirst({
      where: { 
        userId,
        status: 'ACTIVE',
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!trial) {
      return res.status(404).json({ error: 'No active trial found' });
    }
    
    res.status(200).json(trial);
  } catch (error) {
    console.error('Error getting user trial:', error);
    res.status(500).json({ error: 'Failed to get trial information' });
  }
});

// Convert trial to paid subscription
router.post('/:trialId/convert', async (req, res) => {
  try {
    const { trialId } = req.params;
    
    // Update trial status to CONVERTED
    const updatedTrial = await prisma.trial.update({
      where: { id: trialId },
      data: {
        status: 'CONVERTED',
        updatedAt: new Date().toISOString(),
      },
    });
    
    res.status(200).json({
      message: 'Trial successfully converted',
      trialId: updatedTrial.id
    });
  } catch (error) {
    console.error('Error converting trial:', error);
    res.status(500).json({ error: 'Failed to convert trial' });
  }
});



// Add no-auth router to main router
router.use('/', noAuthRouter);

export default router;