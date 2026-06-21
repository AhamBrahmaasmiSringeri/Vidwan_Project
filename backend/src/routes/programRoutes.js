const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const { protect, requireSuperAdmin, requireDirectorOrAdmin } = require('../middleware/auth');

// Helper function to check conflicts
const checkVidwanConflicts = async (startDate, endDate, vidwanIds = [], excludeProgramId = null) => {
  if (!startDate || !endDate || !vidwanIds || vidwanIds.length === 0) {
    return [];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const query = {
    status: { $ne: 'Cancelled' },
    startDate: { $lte: end },
    endDate: { $gte: start },
    vidwans: { $in: vidwanIds }
  };

  if (excludeProgramId) {
    query._id = { $ne: excludeProgramId };
  }

  // Populate Vidwan names for the warning details
  return await Program.find(query)
    .populate('vidwans', 'name');
};

// @desc    Get all programs
// @route   GET /api/programs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const programs = await Program.find({})
      .populate('vidwans', 'name languages specialization city status')
      .sort({ startDate: 1 });
    res.json(programs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check program conflicts in real time
// @route   POST /api/programs/check-conflict
// @access  Private/DirectorOrAdmin
router.post('/check-conflict', protect, requireDirectorOrAdmin, async (req, res) => {
  const { startDate, endDate, vidwans, excludeProgramId } = req.body;

  try {
    const conflicts = await checkVidwanConflicts(startDate, endDate, vidwans, excludeProgramId);
    res.json({
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a program
// @route   POST /api/programs
// @access  Private/DirectorOrAdmin
router.post('/', protect, requireDirectorOrAdmin, async (req, res) => {
  const { programName, city, venue, startDate, endDate, language, vidwans, status, notes } = req.body;

  try {
    // Check conflicts but allow creation
    const conflicts = await checkVidwanConflicts(startDate, endDate, vidwans);

    const program = new Program({
      programName,
      city,
      venue,
      startDate,
      endDate,
      language,
      vidwans: vidwans || [],
      status,
      notes,
    });

    const createdProgram = await program.save();
    
    // Populate before sending back
    const populatedProgram = await Program.findById(createdProgram._id)
      .populate('vidwans', 'name languages specialization city status');

    res.status(201).json({
      program: populatedProgram,
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a program
// @route   PUT /api/programs/:id
// @access  Private/DirectorOrAdmin
router.put('/:id', protect, requireDirectorOrAdmin, async (req, res) => {
  const { programName, city, venue, startDate, endDate, language, vidwans, status, notes } = req.body;

  try {
    const program = await Program.findById(req.params.id);

    if (program) {
      // Check conflicts excluding this program
      const startToCheck = startDate || program.startDate;
      const endToCheck = endDate || program.endDate;
      const vidwansToCheck = vidwans !== undefined ? vidwans : program.vidwans;

      const conflicts = await checkVidwanConflicts(
        startToCheck,
        endToCheck,
        vidwansToCheck,
        program._id
      );

      program.programName = programName !== undefined ? programName : program.programName;
      program.city = city !== undefined ? city : program.city;
      program.venue = venue !== undefined ? venue : program.venue;
      program.startDate = startDate !== undefined ? startDate : program.startDate;
      program.endDate = endDate !== undefined ? endDate : program.endDate;
      program.language = language !== undefined ? language : program.language;
      program.vidwans = vidwans !== undefined ? vidwans : program.vidwans;
      program.status = status !== undefined ? status : program.status;
      program.notes = notes !== undefined ? notes : program.notes;

      const updatedProgram = await program.save();
      
      const populatedProgram = await Program.findById(updatedProgram._id)
        .populate('vidwans', 'name languages specialization city status');

      res.json({
        program: populatedProgram,
        hasConflict: conflicts.length > 0,
        conflicts,
      });
    } else {
      res.status(404).json({ message: 'Program not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a program
// @route   DELETE /api/programs/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, requireSuperAdmin, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);

    if (program) {
      await Program.findByIdAndDelete(req.params.id);
      res.json({ message: 'Program removed' });
    } else {
      res.status(404).json({ message: 'Program not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
