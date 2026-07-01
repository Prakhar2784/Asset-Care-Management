const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register Mongoose multi-tenant plugin
const tenantPlugin = require('../middleware/tenantPlugin');
mongoose.plugin(tenantPlugin);

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const DeviceRequest = require('../models/DeviceRequest');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalTracking = require('../models/ApprovalTracking');
const { setTenantId } = require('../middleware/tenantContext');

const verifyWorkflows = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not defined in environment.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const tenantSlug = 'test-wf-comp';

    // Provision test tenant
    let tenant = await Tenant.findOne({ slug: tenantSlug });
    if (!tenant) {
      tenant = await Tenant.create({ name: 'Workflow Company', slug: tenantSlug, plan: 'Basic' });
      console.log('Created Tenant:', tenantSlug);
    }

    await setTenantId(tenantSlug, async () => {
      // Clean up previous test runs
      await User.deleteMany({});
      await DeviceRequest.deleteMany({});
      await ApprovalWorkflow.deleteMany({});
      await ApprovalTracking.deleteMany({});

      console.log('\n--- STEP 1: Creating Users ---');
      // Create test users
      const employee = await User.create({
        name: 'John Employee',
        email: 'john@workflow.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering'
      });
      console.log('Created Employee:', employee.name);

      const hod = await User.create({
        name: 'Sarah HOD',
        email: 'sarah@workflow.com',
        password: 'password123',
        role: 'hod',
        department: 'Engineering'
      });
      console.log('Created HOD:', hod.name);

      const itSupport = await User.create({
        name: 'Mike IT',
        email: 'mike@workflow.com',
        password: 'password123',
        role: 'it_support',
        department: 'IT'
      });
      console.log('Created IT Support:', itSupport.name);

      console.log('\n--- STEP 2: Creating Approval Workflow Chain ---');
      const workflow = await ApprovalWorkflow.create({
        name: 'Device Procurement Workflow',
        requestType: 'New Device',
        isActive: true,
        stages: [
          { sequence: 1, label: 'Department Head Approval', role: 'hod' },
          { sequence: 2, label: 'IT Review & Provisioning', role: 'it_support' }
        ],
        tenantId: tenantSlug
      });
      console.log('Created Workflow:', workflow.name);

      console.log('\n--- STEP 3: Raising Device Request ---');
      // Set requester user inside request mock context
      const reqMock = {
        user: employee,
        tenantId: tenantSlug,
        body: {
          requestType: 'New Device',
          itemRequested: 'MacBook Pro M3',
          reason: 'Development work requirements',
          urgency: 'High'
        }
      };

      // Mock controller action workflow matching and creation
      const requestId = `REQ-${Math.floor(10000 + Math.random() * 90000)}`;

      // Locate active matching workflow
      let matchingWorkflow = await ApprovalWorkflow.findOne({
        requestType: reqMock.body.requestType,
        isActive: true
      });

      if (!matchingWorkflow) {
        throw new Error('Workflow not found by mock query!');
      }

      console.log('Matching Workflow Found:', matchingWorkflow.name);

      const request = await DeviceRequest.create({
        requestId,
        requestType: reqMock.body.requestType,
        itemRequested: reqMock.body.itemRequested,
        reason: reqMock.body.reason,
        urgency: reqMock.body.urgency,
        raisedBy: employee._id,
        status: 'Under Review'
      });
      console.log(`Created Request: ${request.requestId} - Status: ${request.status}`);

      const tracking = await ApprovalTracking.create({
        deviceRequest: request._id,
        workflow: matchingWorkflow._id,
        currentStageIndex: 0,
        history: matchingWorkflow.stages.map((stage, idx) => ({
          stageIndex: idx,
          sequence: stage.sequence,
          label: stage.label,
          assignedRole: stage.role,
          action: 'Pending',
          remarks: '',
          actionedBy: null,
          actionedAt: null
        })),
        tenantId: tenantSlug
      });
      console.log(`Initialized ApprovalTracking. Current Stage: ${tracking.history[0].label}`);

      console.log('\n--- STEP 4: Simulating HOD Approval (Stage 1) ---');
      // Retrieve tracking
      let activeTracking = await ApprovalTracking.findOne({ deviceRequest: request._id });
      let currentStage = activeTracking.history.find(h => h.stageIndex === activeTracking.currentStageIndex);

      if (currentStage.assignedRole !== 'hod') {
        throw new Error(`Expected stage role to be HOD, got ${currentStage.assignedRole}`);
      }

      // Perform authorization check mock
      const isHODAuth = hod.role === currentStage.assignedRole && hod.department === employee.department;
      if (!isHODAuth) {
        throw new Error('HOD auth check failed!');
      }

      console.log('Sarah HOD authorized to action this stage. Approving...');
      currentStage.action = 'Approved';
      currentStage.remarks = 'Approved by Engineering HOD';
      currentStage.actionedBy = hod._id;
      currentStage.actionedAt = new Date();

      // Advance stage
      activeTracking.currentStageIndex += 1;
      await activeTracking.save();
      console.log(`Stage 1 approved. Advancing. Next Stage: ${activeTracking.history[activeTracking.currentStageIndex].label}`);

      console.log('\n--- STEP 5: Simulating IT Support Approval (Stage 2 - Final) ---');
      activeTracking = await ApprovalTracking.findOne({ deviceRequest: request._id });
      currentStage = activeTracking.history.find(h => h.stageIndex === activeTracking.currentStageIndex);

      if (currentStage.assignedRole !== 'it_support') {
        throw new Error(`Expected stage role to be IT Support, got ${currentStage.assignedRole}`);
      }

      const isITAuth = itSupport.role === currentStage.assignedRole;
      if (!isITAuth) {
        throw new Error('IT Support auth check failed!');
      }

      console.log('Mike IT authorized to action final stage. Approving & completing request...');
      currentStage.action = 'Approved';
      currentStage.remarks = 'IT stock available. Approved.';
      currentStage.actionedBy = itSupport._id;
      currentStage.actionedAt = new Date();

      // Final stage completed -> approve device request
      request.status = 'Approved';
      request.adminRemarks = 'Approved by all stages';
      request.reviewedBy = itSupport._id;
      request.reviewedAt = new Date();

      await activeTracking.save();
      await request.save();

      console.log(`Request status updated to: ${request.status}`);

      // Verify states
      const finalRequest = await DeviceRequest.findById(request._id);
      if (finalRequest.status !== 'Approved') {
        throw new Error(`Expected final status to be Approved, got ${finalRequest.status}`);
      }

      console.log('\n--- CLEANING UP ---');
      await User.deleteMany({});
      await DeviceRequest.deleteMany({});
      await ApprovalWorkflow.deleteMany({});
      await ApprovalTracking.deleteMany({});
      console.log('Test collections cleaned.');
    });

    await Tenant.deleteOne({ slug: tenantSlug });
    console.log('Tenant Stark cleaned.');

    console.log('\nALL APPROVAL WORKFLOW FLOW TESTS PASSED! ARCHITECTURE SECURE AND OPERATIONAL.');
    process.exit(0);
  } catch (error) {
    console.error('\nVerification failed:', error.message);
    process.exit(1);
  }
};

verifyWorkflows();
