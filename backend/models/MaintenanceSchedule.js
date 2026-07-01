const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  asset: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Asset', 
    required: true 
  },
  taskName: { 
    type: String, 
    required: true,
    trim: true
  },
  frequency: { 
    type: String, 
    enum: ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'], 
    default: 'Quarterly' 
  },
  lastDoneDate: { 
    type: Date 
  },
  nextDueDate: { 
    type: Date, 
    required: true 
  },
  assignedEngineer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Overdue', 'Completed'], 
    default: 'Scheduled' 
  },
  tenantId: { 
    type: String, 
    required: true, 
    default: 'default' 
  }
}, { 
  timestamps: true 
});

maintenanceScheduleSchema.index({ tenantId: 1 });
maintenanceScheduleSchema.index({ nextDueDate: 1 });

const MaintenanceSchedule = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
const createTenantModelProxy = require('../middleware/tenantModelProxy');
module.exports = createTenantModelProxy('MaintenanceSchedule', MaintenanceSchedule);
