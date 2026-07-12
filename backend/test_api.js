/**
 * Integration Test Script for Vidwan Scheduling and Camp Allocation System API.
 * Uses native fetch (available in Node.js v18+) to run requests against the local running backend server.
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING VIDWAN SCHEDULER API TESTS ---');
  let adminToken = '';
  let directorToken = '';
  let testVidwanId = '';
  let testProgramId = '';

  // Helper function to call fetch and return parsed JSON or throw error
  async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    return { status, data };
  }

  // TEST 1: Login as Super Admin
  try {
    console.log('\n[Test 1] Login as Super Admin...');
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password123' }),
    });
    if (status === 200 && data.token) {
      adminToken = data.token;
      console.log('✅ Success! Role:', data.role);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 1:', err);
  }

  // TEST 2: Login as Program Director
  try {
    console.log('\n[Test 2] Login as Program Director...');
    const { status, data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'director', password: 'password123' }),
    });
    if (status === 200 && data.token) {
      directorToken = data.token;
      console.log('✅ Success! Role:', data.role);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 2:', err);
  }

  // TEST 3: Auth Profile Check
  try {
    console.log('\n[Test 3] Fetch current user profile (me)...');
    const { status, data } = await apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (status === 200 && data.username === 'admin') {
      console.log('✅ Success! Username:', data.username);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 3:', err);
  }

  // TEST 4: Get All Vidwans
  try {
    console.log('\n[Test 4] Get all Vidwans...');
    const { status, data } = await apiRequest('/vidwans', {
      headers: { Authorization: `Bearer ${directorToken}` },
    });
    if (status === 200 && Array.isArray(data)) {
      console.log(`✅ Success! Found ${data.length} Vidwans.`);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 4:', err);
  }

  // TEST 5: Create a new Vidwan
  try {
    console.log('\n[Test 5] Create a new Vidwan...');
    const { status, data } = await apiRequest('/vidwans', {
      method: 'POST',
      headers: { Authorization: `Bearer ${directorToken}` },
      body: JSON.stringify({
        name: 'Shastri G. Narayana',
        languages: ['Sanskrit', 'Kannada'],
        specialization: 'Advaita Vedanta',
        city: 'Sringeri',
        travelCapability: 'South India',
        status: 'Active',
        notes: 'Highly respected scholar.',
        isOverseas: false,
      }),
    });
    if (status === 201 && data._id) {
      testVidwanId = data._id;
      console.log('✅ Success! Created Vidwan ID:', testVidwanId);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 5:', err);
  }

  // TEST 6: Update a Vidwan
  try {
    console.log('\n[Test 6] Update Vidwan...');
    const { status, data } = await apiRequest(`/vidwans/${testVidwanId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${directorToken}` },
      body: JSON.stringify({
        notes: 'Highly respected scholar and author.',
      }),
    });
    if (status === 200 && data.notes === 'Highly respected scholar and author.') {
      console.log('✅ Success! Updated notes:', data.notes);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 6:', err);
  }

  // TEST 7: Create a Program (no conflict)
  try {
    console.log('\n[Test 7] Create a Program (no conflict)...');
    const { status, data } = await apiRequest('/programs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${directorToken}` },
      body: JSON.stringify({
        programName: 'Advaita Jnana Satra',
        city: 'Sringeri',
        venue: 'Sri Sharada Peetham Pravachana Mandiram',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        language: 'Sanskrit',
        vidwans: [testVidwanId],
        status: 'Confirmed',
        notes: 'Annual conference',
      }),
    });
    if (status === 201 && data.program._id) {
      testProgramId = data.program._id;
      console.log('✅ Success! Created Program ID:', testProgramId, 'Has Conflict:', data.hasConflict);
    } else {
      console.error('❌ Failed!', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 7:', err);
  }

  // TEST 8: Check Conflict (Real-time checking)
  try {
    console.log('\n[Test 8] Check conflict endpoint for overlapping dates...');
    const { status, data } = await apiRequest('/programs/check-conflict', {
      method: 'POST',
      headers: { Authorization: `Bearer ${directorToken}` },
      body: JSON.stringify({
        startDate: '2026-08-03',
        endDate: '2026-08-10',
        vidwans: [testVidwanId],
      }),
    });
    if (status === 200 && data.hasConflict === true) {
      console.log('✅ Success! Conflict correctly detected. Details:', data.conflicts.map(c => c.programName));
    } else {
      console.error('❌ Failed! Should have detected conflict.', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 8:', err);
  }

  // TEST 9: Get Vidwan Availability / Bookings
  try {
    console.log('\n[Test 9] Get Vidwan availability/bookings...');
    const { status, data } = await apiRequest(`/vidwans/${testVidwanId}/availability`, {
      headers: { Authorization: `Bearer ${directorToken}` },
    });
    if (status === 200 && data.bookings && data.bookings.length > 0) {
      console.log(`✅ Success! Found ${data.bookings.length} bookings for the Vidwan.`);
      data.bookings.forEach(b => console.log(` - Program: ${b.programName} (${b.startDate.substring(0, 10)} to ${b.endDate.substring(0, 10)})`));
    } else {
      console.error('❌ Failed! Bookings should be returned but was empty/failed.', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 9:', err);
  }

  // TEST 10: Delete Vidwan when assigned to active program (should be blocked)
  try {
    console.log('\n[Test 10] Delete Vidwan when assigned to active program (should be blocked)...');
    const { status, data } = await apiRequest(`/vidwans/${testVidwanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (status === 400) {
      console.log('✅ Success! Correctly blocked deletion with message:', data.message);
    } else {
      console.error('❌ Failed! Deletion should be blocked but was allowed or returned unexpected status:', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 10:', err);
  }

  // TEST 11: Delete Program (Super Admin privilege check)
  try {
    console.log('\n[Test 11] Delete Program as Program Director (should be forbidden)...');
    const { status: status1 } = await apiRequest(`/programs/${testProgramId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${directorToken}` },
    });
    if (status1 === 403) {
      console.log('✅ Success! Correctly denied to Program Director.');
    } else {
      console.error('❌ Failed! Program Director should be forbidden from deleting programs. Status:', status1);
    }

    console.log('Deleting Program as Super Admin (should succeed)...');
    const { status: status2, data: data2 } = await apiRequest(`/programs/${testProgramId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (status2 === 200) {
      console.log('✅ Success! Program removed.');
    } else {
      console.error('❌ Failed! Super Admin should be able to delete. Status:', status2, data2);
    }
  } catch (err) {
    console.error('❌ Error in Test 11:', err);
  }

  // TEST 12: Delete Vidwan now that program is deleted (should succeed)
  try {
    console.log('\n[Test 12] Delete Vidwan after program is deleted...');
    const { status, data } = await apiRequest(`/vidwans/${testVidwanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (status === 200) {
      console.log('✅ Success! Vidwan removed successfully.');
    } else {
      console.error('❌ Failed! Vidwan deletion failed:', status, data);
    }
  } catch (err) {
    console.error('❌ Error in Test 12:', err);
  }

  console.log('\n--- TESTS COMPLETED ---');
}

runTests();
