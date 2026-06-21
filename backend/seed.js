const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Vidwan = require('./src/models/Vidwan');
const Program = require('./src/models/Program');

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Vidwan.deleteMany({});
    await Program.deleteMany({});
    console.log('Cleared existing collections...');

    // Create users (using save to trigger pre-save bcrypt hook)
    const superAdmin = new User({
      username: 'admin',
      password: 'password123',
      name: 'Sri Shankara Prasad',
      role: 'Super Admin',
    });
    await superAdmin.save();

    const director = new User({
      username: 'director',
      password: 'password123',
      name: 'Sri Girish Sharma',
      role: 'Program Director',
    });
    await director.save();

    console.log('Seeded Users:');
    console.log('- Super Admin: username="admin", password="password123"');
    console.log('- Program Director: username="director", password="password123"');

    // Create Vidwans
    const vidwans = [
      {
        name: 'Sri Ramakrishna Shastri',
        languages: ['Sanskrit', 'Kannada', 'Tamil'],
        specialization: 'Advaita Vedanta & Prasthanatraya Bhashya',
        city: 'Sringeri',
        travelCapability: 'South India (Karnataka, Tamil Nadu, Kerala, Andhra)',
        status: 'Active',
        notes: 'Highly revered scholar. Preferred travel via train or car. Requires serene accommodation.',
      },
      {
        name: 'Dr. K. Venkatesha Swamy',
        languages: ['Sanskrit', 'Telugu', 'English'],
        specialization: 'Vyakarana (Grammar) & Purva Mimamsa',
        city: 'Hyderabad',
        travelCapability: 'All India (Air travel preferred for long distance)',
        status: 'Active',
        notes: 'Professor of Sanskrit. Available mostly during weekends and university holidays.',
      },
      {
        name: 'Vidwan Mahadeva Bhat',
        languages: ['Sanskrit', 'Kannada', 'Marathi'],
        specialization: 'Rigveda Samhita, Pourohithya & Smartha Prayoga',
        city: 'Gokarna',
        travelCapability: 'Karnataka & Maharashtra (Konkan region preferred)',
        status: 'Active',
        notes: 'Conducts intensive Shrauta and Smartha rituals. Easily available for coastal camps.',
      },
      {
        name: 'Srimati Sharada Devi',
        languages: ['Sanskrit', 'Hindi', 'English'],
        specialization: 'Upanishadic Contemplation & Bhagavad Gita',
        city: 'Haridwar',
        travelCapability: 'North India & Metro Cities',
        status: 'Active',
        notes: 'Excellent orator in Hindi and English. Focuses on youth retreats and meditation programs.',
      },
      {
        name: 'Sri Ananthakrishna Acharya',
        languages: ['Sanskrit', 'Tamil'],
        specialization: 'Nyaya-Vaisheshika & Tarka Shastra',
        city: 'Chennai',
        travelCapability: 'Tamil Nadu (Chennai, Kanchipuram, Madurai)',
        status: 'Active',
        notes: 'Traditional scholar from Sastra Pathashala. Fluent in Sanskrit discourse.',
      },
      {
        name: 'Shastri Narayana Murthy',
        languages: ['Sanskrit', 'Telugu', 'Kannada'],
        specialization: 'Yajurveda & Dharma Shastras',
        city: 'Vijayawada',
        travelCapability: 'Andhra Pradesh & Telangana',
        status: 'Inactive',
        notes: 'Currently on a long-term spiritual retreat (Mouna Vrata). Not available for scheduling.',
      }
    ];

    const createdVidwans = await Vidwan.insertMany(vidwans);
    console.log(`Seeded ${createdVidwans.length} Vidwans.`);

    // Map Vidwans for program assignment
    const shastri = createdVidwans[0]; // Ramakrishna Shastri
    const venkatesh = createdVidwans[1]; // K. Venkatesha Swamy
    const bhat = createdVidwans[2]; // Mahadeva Bhat
    const sharada = createdVidwans[3]; // Srimati Sharada Devi
    const acharya = createdVidwans[4]; // Ananthakrishna Acharya

    // Create Programs (camps)
    const programs = [
      {
        programName: 'Gita Jnana Yajna',
        city: 'Sringeri',
        venue: 'Sharada Peetham Pravachana Mandiram',
        startDate: new Date('2026-06-10T09:00:00Z'),
        endDate: new Date('2026-06-15T18:00:00Z'),
        language: 'Kannada',
        vidwans: [shastri._id, bhat._id],
        status: 'Confirmed',
        notes: 'Public evening discourses on Gita Chapter 12. Morning meditation sessions.',
      },
      {
        programName: 'Advaita Vedanta Sadhana Retreat',
        city: 'Rishikesh',
        venue: 'Sharada Kutir Ashrama',
        startDate: new Date('2026-07-01T08:00:00Z'),
        endDate: new Date('2026-07-07T17:00:00Z'),
        language: 'Hindi',
        vidwans: [sharada._id, shastri._id],
        status: 'Confirmed',
        notes: 'Residential camp focusing on Vivekachudamani. Requires Satvic diet arrangements.',
      },
      {
        programName: 'Paniniya Vyakarana Workshop',
        city: 'Hyderabad',
        venue: 'Sankara Gurukul Vidyalaya',
        startDate: new Date('2026-06-20T09:00:00Z'),
        endDate: new Date('2026-06-25T17:00:00Z'),
        language: 'Sanskrit',
        vidwans: [venkatesh._id, acharya._id],
        status: 'Confirmed',
        notes: 'Intensive workshop on Mahabhashya. Target audience: Postgraduate research scholars.',
      },
      {
        programName: 'Rigveda Samhita Homa & Swadhyaya',
        city: 'Gokarna',
        venue: 'Mahabaleshwar Temple Sabha Griha',
        startDate: new Date('2026-06-12T06:00:00Z'),
        endDate: new Date('2026-06-14T13:00:00Z'),
        language: 'Sanskrit',
        vidwans: [bhat._id],
        status: 'Confirmed',
        notes: 'Ritualistic Homam in the morning, followed by text studies in the afternoon.',
      },
      {
        programName: 'Upanishad Swadhyaya (Katha Upanishad)',
        city: 'Bangalore',
        venue: 'Aham Brahmasmi Kendra, Jayanagar',
        startDate: new Date('2026-06-28T09:00:00Z'),
        endDate: new Date('2026-06-29T18:00:00Z'),
        language: 'Kannada',
        vidwans: [shastri._id, bhat._id],
        status: 'Tentative',
        notes: 'Weekend classes. Awaiting hall booking confirmation.',
      },
      {
        programName: 'Tarka Sangraha Discourse',
        city: 'Kanchipuram',
        venue: 'Sankara Matham Sabha Hall',
        startDate: new Date('2026-07-15T15:00:00Z'),
        endDate: new Date('2026-07-20T19:00:00Z'),
        language: 'Tamil',
        vidwans: [acharya._id, venkatesh._id],
        status: 'Tentative',
        notes: 'Introductory course on logic. Open to all traditional students.',
      },
      {
        programName: 'Unassigned Vedic Workshop',
        city: 'Mysore',
        venue: 'Veda Pathashala',
        startDate: new Date('2026-08-05T09:00:00Z'),
        endDate: new Date('2026-08-10T17:00:00Z'),
        language: 'Kannada',
        vidwans: [],
        status: 'Tentative',
        notes: 'Requires at least 2 Vidwans to be assigned.',
      }
    ];

    await Program.insertMany(programs);
    console.log('Seeded initial Programs (Camps). No conflict by default.');

    console.log('--- Aham Brahmaasmi Foundation® System Seeded Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
