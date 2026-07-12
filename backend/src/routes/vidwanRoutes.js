const express = require('express');
const router = express.Router();
const Vidwan = require('../models/Vidwan');
const Program = require('../models/Program');
const { protect, requireSuperAdmin, requireDirectorOrAdmin } = require('../middleware/auth');

// @desc    Get all vidwans
// @route   GET /api/vidwans
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const vidwans = await Vidwan.find({}).sort({ name: 1 });
    res.json(vidwans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new vidwan
// @route   POST /api/vidwans
// @access  Private/DirectorOrAdmin
router.post('/', protect, requireDirectorOrAdmin, async (req, res) => {
  const { name, languages, specialization, city, travelCapability, status, notes, isOverseas } = req.body;

  try {
    const vidwan = new Vidwan({
      name,
      languages,
      specialization,
      city,
      travelCapability,
      status,
      notes,
      isOverseas,
    });

    const createdVidwan = await vidwan.save();
    res.status(201).json(createdVidwan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update a vidwan
// @route   PUT /api/vidwans/:id
// @access  Private/DirectorOrAdmin
router.put('/:id', protect, requireDirectorOrAdmin, async (req, res) => {
  const { name, languages, specialization, city, travelCapability, status, notes, isOverseas } = req.body;

  try {
    const vidwan = await Vidwan.findById(req.params.id);

    if (vidwan) {
      vidwan.name = name !== undefined ? name : vidwan.name;
      vidwan.languages = languages !== undefined ? languages : vidwan.languages;
      vidwan.specialization = specialization !== undefined ? specialization : vidwan.specialization;
      vidwan.city = city !== undefined ? city : vidwan.city;
      vidwan.travelCapability = travelCapability !== undefined ? travelCapability : vidwan.travelCapability;
      vidwan.status = status !== undefined ? status : vidwan.status;
      vidwan.notes = notes !== undefined ? notes : vidwan.notes;
      vidwan.isOverseas = isOverseas !== undefined ? isOverseas : vidwan.isOverseas;

      const updatedVidwan = await vidwan.save();
      res.json(updatedVidwan);
    } else {
      res.status(404).json({ message: 'Vidwan not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a vidwan
// @route   DELETE /api/vidwans/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, requireSuperAdmin, async (req, res) => {
  try {
    const vidwan = await Vidwan.findById(req.params.id);

    if (vidwan) {
      // Check if Vidwan is currently assigned to any programs
      const assignedPrograms = await Program.find({
        vidwans: vidwan._id,
        status: { $ne: 'Cancelled' },
      });

      if (assignedPrograms.length > 0) {
        return res.status(400).json({
          message: 'Cannot delete Vidwan. They are currently assigned to active programs.',
          programs: assignedPrograms,
        });
      }

      await Vidwan.findByIdAndDelete(req.params.id);
      res.json({ message: 'Vidwan removed' });
    } else {
      res.status(404).json({ message: 'Vidwan not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get specific Vidwan's bookings/availability
// @route   GET /api/vidwans/:id/availability
// @access  Private
router.get('/:id/availability', protect, async (req, res) => {
  try {
    const vidwan = await Vidwan.findById(req.params.id);
    if (!vidwan) {
      return res.status(404).json({ message: 'Vidwan not found' });
    }

    // Get all non-cancelled programs where the Vidwan is assigned or backup
    const bookings = await Program.find({
      vidwans: req.params.id,
      status: { $ne: 'Cancelled' },
    }).sort({ startDate: 1 });

    res.json({
      vidwan,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
