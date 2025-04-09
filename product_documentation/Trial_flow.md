# GTM App Trial Flow

## Overview

The trial flow is designed to guide users through the key features of our GTM optimization platform in a structured, step-by-step process. This document outlines the technical implementation of the trial process.

## Trial Process

1. **Entry Point**
   - User clicks "Begin Your Trial" button
   - System creates a new trial record in the database with status "ACTIVE"
   - Trial is set to expire in 14 days
   - User is directed to the first step of the wizard

2. **ICP Definition**
   - User defines their Ideal Customer Profile
   - Data is saved to the trial record

3. **Account Scoring**
   - User uploads or selects accounts to score
   - System applies scoring based on ICP match
   - Scored accounts are saved to the trial record

4. **Segmentation**
   - System generates suggested segments based on scoring and attributes
   - User can adjust and customize segments
   - Segmentation data is saved to the trial record

5. **Territory Health**
   - System analyzes territory distribution based on segments
   - Provides insights on territory balance and distribution
   - Territory analysis is saved to the trial record

6. **Account Assignment**
   - System suggests optimal account assignments to territories
   - User can adjust assignments
   - Assignment data is saved to the trial record

7. **Fit Coverage Metrics**
   - System generates fit coverage metrics and insights
   - Shows improvement potential with GTM optimization
   - Metrics data is saved to the trial record

8. **Completion**
   - User sees summary of trial process and results
   - Option to convert to paid plan or schedule a demo

## Technical Implementation

### Backend

- Trial data is stored in PostgreSQL using Prisma ORM
- Each trial has a unique ID that links all the user's trial data
- Trial status can be "ACTIVE", "EXPIRED", or "CONVERTED"
- Trial expiration is checked on each request

### Frontend

- Trial wizard implemented as a multi-step React component
- WizardContainer manages overall state and step navigation
- Each step is implemented as a separate component
- User progress is tracked and displayed via WizardProgress component

### API Endpoints

- `POST /api/trials/start` - Create a new trial
- `POST /api/trials/:trialId/icp` - Save ICP definition
- `POST /api/trials/:trialId/accounts` - Upload/process accounts
- `POST /api/trials/:trialId/segments` - Generate/save segments
- `POST /api/trials/:trialId/territories` - Process territory health
- `POST /api/trials/:trialId/assignments` - Save account assignments
- `POST /api/trials/:trialId/metrics` - Generate/save fit coverage metrics
- `GET /api/trials/:trialId` - Get trial status and data

## After Trial Completion

When a user completes the trial flow:
1. They are directed to their dashboard with their trial results
2. A notification is sent to the sales team
3. User receives an email with options to schedule a demo or convert to paid plan

## Handling Trial Expiration

- Scheduled job checks for expired trials daily
- When a trial expires, its status is updated to "EXPIRED"
- Users with expired trials receive different UI prompting them to convert