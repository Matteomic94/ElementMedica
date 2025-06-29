import express from 'express';
import { PrismaClient } from '@prisma/client';
import middleware from '../auth/middleware.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

const { authenticate: authenticateToken, authorize: requirePermission, requireSameCompany: requireCompanyAccess } = middleware;

// Validation middleware for schedule creation/update
const validateSchedule = [
  body('courseId').notEmpty().withMessage('Course ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('location').optional().isString(),
  body('max_participants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  body('delivery_mode').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation error',
        details: errors.array()
      });
    }
    next();
  }
];

// Get all schedules
router.get('/', authenticateToken(), requirePermission('read:schedules'), async (req, res) => {
  try {
    const schedules = await prisma.courseSchedule.findMany({
      include: {
        course: true,
        sessions: {
          include: {
            trainer: true,
            co_trainer: true,
          },
        },
        companies: {
          include: { company: true },
        },
        enrollments: {
          include: { employee: true },
        },
      },
      orderBy: { start_date: 'asc' },
    });
    
    res.json(schedules);
  } catch (error) {
    logger.error('Failed to fetch schedules', {
      component: 'schedules-routes',
      action: 'getSchedules',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch schedules'
    });
  }
});

// Get schedule by ID
router.get('/:id', authenticateToken(), requirePermission('read:schedules'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await prisma.courseSchedule.findUnique({
      where: { 
        id
      },
      include: {
        course: true,
        sessions: {
          include: {
            trainer: true,
            co_trainer: true,
          },
        },
        companies: { include: { company: true } },
        enrollments: { include: { employee: true } },
      },
    });
    
    if (!schedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: `Schedule with ID ${id} does not exist`
      });
    }
    
    res.json(schedule);
  } catch (error) {
    logger.error('Failed to fetch schedule', {
      component: 'schedules-routes',
      action: 'getSchedule',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      scheduleId: req.params?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch schedule'
    });
  }
});

// Get schedules with attestati
router.get('/with-attestati', authenticateToken(), requirePermission('read:schedules'), async (req, res) => {
  try {
    const schedules = await prisma.courseSchedule.findMany({
      where: {
        status: 'completed'
      },
      include: {
        course: true,
        enrollments: {
          include: {
            employee: {
              include: {
                company: true
              }
            }
          }
        }
      },
      orderBy: { end_date: 'desc' }
    });
    
    res.json(schedules);
  } catch (error) {
    logger.error('Failed to fetch schedules with attestati', {
      component: 'schedules-routes',
      action: 'getSchedulesWithAttestati',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch schedules with attestati'
    });
  }
});

// Create new schedule
router.post('/', authenticateToken(), requirePermission('create:schedules'), validateSchedule, async (req, res) => {
  const {
    courseId,
    start_date,
    end_date,
    location,
    max_participants,
    notes,
    delivery_mode,
    dates, // [{ date, start, end, trainer_id, co_trainer_id }]
    company_ids, // [companyId, ...]
    employee_ids, // [employeeId, ...]
  } = req.body;

  try {
    // Validate main company ID
    const mainCompanyId = Array.isArray(company_ids) && company_ids.length > 0 ? company_ids[0] : null;
    if (!mainCompanyId) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'At least one company_id is required'
      });
    }

    // Build schedule data
    const scheduleData = {
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      location,
      max_participants,
      notes,
      delivery_mode,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Create the main schedule
    const schedule = await prisma.courseSchedule.create({
      data: {
        ...scheduleData,
        course: {
          connect: { id: courseId }
        }
      },
    });

    // 2. Create sessions (dates)
    if (Array.isArray(dates)) {
      for (const session of dates) {
        await prisma.courseSession.create({
          data: {
            scheduleId: schedule.id,
            date: new Date(session.date),
            start: session.start,
            end: session.end,
            trainerId: session.trainer_id || null,
            coTrainerId: session.co_trainer_id || null,
          },
        });
      }
    }

    // 3. Create schedule-company links
    if (Array.isArray(company_ids)) {
      for (const companyId of company_ids) {
        await prisma.scheduleCompany.create({
          data: {
            scheduleId: schedule.id,
            companyId,
          },
        });
      }
    }

    // 4. Create enrollments if provided
    if (Array.isArray(employee_ids)) {
      const uniqueEmployeeIds = [...new Set(employee_ids.map(id => (id || '').trim()))];

      await Promise.all(uniqueEmployeeIds.map(employeeId =>
        prisma.courseEnrollment.create({
          data: { 
            scheduleId: schedule.id, 
            employeeId,
            createdAt: new Date()
          }
        })
      ));
    }

    // 5. Return the full schedule with relations
    const fullSchedule = await prisma.courseSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        course: true,
        sessions: {
          include: {
            trainer: true,
            co_trainer: true,
          },
        },
        companies: { include: { company: true } },
        enrollments: { include: { employee: true } },
      },
    });

    res.status(201).json(fullSchedule);
  } catch (error) {
    logger.error('Failed to create schedule', {
      component: 'schedules-routes',
      action: 'createSchedule',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      scheduleData: req.body
    });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A schedule with this information already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create schedule'
    });
  }
});

// Update schedule
router.put('/:id', authenticateToken(), requirePermission('update:schedules'), async (req, res) => {
  const {
    courseId,
    start_date,
    end_date,
    location,
    max_participants,
    notes,
    delivery_mode,
    dates, // optional array of sessions
    company_ids, // optional array of company IDs
    employee_ids, // optional array of employee IDs
    attendance, // optional attendance JSON
    status,     // optional status update
  } = req.body;

  try {
    const { id } = req.params;
    
    // Check if schedule exists
    const existingSchedule = await prisma.courseSchedule.findUnique({ 
      where: { 
        id
      }
    });
    
    if (!existingSchedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: `Schedule with ID ${id} does not exist`
      });
    }

    // 1. Update the main schedule fields (only provided)
    const updateData = { updatedAt: new Date() };
    if (courseId !== undefined)       updateData.courseId        = courseId;
    if (start_date !== undefined)     updateData.start_date     = new Date(start_date);
    if (end_date !== undefined)       updateData.end_date       = new Date(end_date);
    if (location !== undefined)       updateData.location       = location;
    if (max_participants !== undefined) updateData.max_participants = max_participants;
    if (notes !== undefined)          updateData.notes          = notes;
    if (delivery_mode !== undefined)  updateData.delivery_mode  = delivery_mode;
    if (status !== undefined)         updateData.status         = status;
    if (attendance !== undefined)     updateData.attendance     = attendance;

    const schedule = await prisma.courseSchedule.update({
      where: { id },
      data: updateData,
    });

    // 2. Update sessions if provided
    if (Array.isArray(dates)) {
      // Delete existing sessions
      await prisma.courseSession.deleteMany({ where: { scheduleId: schedule.id } });
      // Create new sessions
      for (const session of dates) {
        await prisma.courseSession.create({
          data: {
            scheduleId: schedule.id,
            date: new Date(session.date),
            start: session.start,
            end: session.end,
            trainerId: session.trainer_id || null,
            coTrainerId: session.co_trainer_id || null,
          },
        });
      }
    }

    // 3. Update company associations if provided
    if (Array.isArray(company_ids)) {
      // Delete existing associations
      await prisma.scheduleCompany.deleteMany({ where: { scheduleId: schedule.id } });
      // Create new associations
      for (const companyId of company_ids) {
        await prisma.scheduleCompany.create({
          data: {
            scheduleId: schedule.id,
            companyId,
          },
        });
      }
    }

    // 4. Update enrollments if provided
    if (Array.isArray(employee_ids)) {
      const uniqueEmployeeIds = [...new Set(employee_ids.map(id => (id || '').trim()))];

      // Delete enrollments not in the new list
      await prisma.courseEnrollment.deleteMany({
        where: {
          scheduleId: schedule.id,
          employeeId: { notIn: uniqueEmployeeIds }
        }
      });

      // Upsert enrollments for each employee
      await Promise.all(uniqueEmployeeIds.map(employeeId =>
        prisma.courseEnrollment.upsert({
          where: { scheduleId_employeeId: { scheduleId: schedule.id, employeeId } },
          update: { updatedAt: new Date() },
          create: { 
            scheduleId: schedule.id, 
            employeeId,
            createdAt: new Date()
          }
        })
      ));
    }

    // 5. Return the updated schedule with relations
    const fullSchedule = await prisma.courseSchedule.findUnique({
      where: { id: schedule.id },
      include: {
        course: true,
        sessions: {
          include: {
            trainer: true,
            co_trainer: true,
          },
        },
        companies: { include: { company: true } },
        enrollments: { include: { employee: true } },
      },
    });

    res.json(fullSchedule);
  } catch (error) {
    logger.error('Failed to update schedule', {
      component: 'schedules-routes',
      action: 'updateSchedule',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      scheduleId: req.params?.id
    });
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A schedule with this information already exists'
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to update schedule'
    });
  }
});

// Soft delete schedule
router.delete('/:id', authenticateToken(), requirePermission('delete:schedules'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if schedule exists
    const existingSchedule = await prisma.courseSchedule.findUnique({ 
      where: { 
        id
      },
      include: {
        enrollments: true,
        sessions: true
      }
    });
    
    if (!existingSchedule) {
      return res.status(404).json({ 
        error: 'Schedule not found',
        message: `Schedule with ID ${id} does not exist`
      });
    }
    
    // Check if schedule has active enrollments
    if (existingSchedule.enrollments.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete schedule',
        message: 'Schedule has active enrollments. Please remove enrollments first.'
      });
    }
    
    // Perform soft delete by updating deletedAt field
    await prisma.courseSchedule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(204).end();
  } catch (error) {
    logger.error('Failed to delete schedule', {
      component: 'schedules-routes',
      action: 'deleteSchedule',
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      scheduleId: req.params?.id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete schedule'
    });
  }
});

export default router;