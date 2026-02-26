import 'dotenv/config';

const API_URL = 'http://localhost:8000/api';

async function testTeacherEndpoint() {
  try {
    console.log('Step 1: Teacher login...');
    const loginRes = await fetch(`${API_URL}/auth/teacher/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'teacher', password: 'teacher123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('Login failed:', loginData);
      process.exit(1);
    }
    const token = loginData.token;

    console.log('Step 2: Create exam via /api/teacher/exam/create (no questions)');
    const payload = {
      title: 'Physics Quick ' + Date.now(),
      subject: 'Physics',
      class: '9',
      section: 'A',
      duration: 45,
      totalMarks: 50,
      // questions intentionally omitted to test optional behavior
    };

    const res = await fetch(`${API_URL}/teacher/exam/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testTeacherEndpoint();
