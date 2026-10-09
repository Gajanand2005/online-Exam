# ✅ System Testing Checklist

## 🔧 Pre-flight Checks

- [x] Backend server running on port 8000
- [x] Student frontend running on port 5174
- [x] Teacher frontend running on port 5175
- [x] MongoDB connected
- [x] All dependencies installed
- [x] Environment variables configured

---

## 🧪 Manual Testing Workflow

### Phase 1: Student User Flow

#### Step 1: Student Login
```
1. Open http://localhost:5174
2. Fill student login form:
   - Name: "Raj Kumar"
   - Father Name: "Ramesh Kumar"
   - Class: "10"
   - Section: "A"
   - Roll No: "001"
3. Click Login
4. Expected: Redirect to Dashboard with welcome message
```

#### Step 2: View Available Exams
```
1. On dashboard, should see:
   - List of exams for class 10-A
   - Exam title, subject, duration, marks
   - "Start Exam" button for each
2. If no exams: Create one using teacher account first
```

#### Step 3: Take Exam
```
1. Click "Start Exam" on any available exam
2. Verify:
   - Timer displays remaining time
   - Question appears with text
   - MCQ options displayed
   - Navigation buttons work (Previous/Next)
   - Can select only one option per question
3. Navigate through all questions
4. Click "Submit Exam" on last question
5. Expected: Success message and redirect to dashboard
```

#### Step 4: View Results
```
1. Click "My Results" button
2. Verify:
   - Table shows exam name, marks, percentage
   - Results from submitted exam appears
   - Date of submission shown
3. Check calculation: marks obtained / total marks * 100 = percentage
```

#### Step 5: Logout
```
1. Click Logout button
2. Expected: Return to login page
3. Token cleared from localStorage
```

---

### Phase 2: Teacher User Flow

#### Step 1: Teacher Login
```
1. Open http://localhost:5175/teacher-login
2. Enter credentials:
   - Email: the TEACHER_EMAIL from server/.env
   - Password: the TEACHER_PASSWORD from server/.env
3. Click Login
4. Expected: Redirect to exam management page
```

#### Step 2: Create Exam
```
1. Click "Create Exam" button
2. Fill form:
   - Title: "Mid Term Hindi"
   - Subject: "Hindi"
   - Class: "10"
   - Section: "A"
   - Duration: "30"
   - Total Marks: "100"
3. Click "Create & Add Questions"
4. Expected: Redirect to question builder for new exam
```

#### Step 3: Add Questions
```
1. Click "+ Add Question"
2. Fill question:
   - Text: "भारत की राजधानी क्या है?"
   - Option 1: "नई दिल्ली" (mark as correct)
   - Option 2: "मुंबई"
   - Option 3: "कोलकाता"
   - Marks: "1"
3. Click Save / Add Option
4. Add at least 2-3 questions
5. Each question should save successfully
```

#### Step 4: View Results
```
1. Click "View Results" / "Show Result"
2. Select the exam just created
3. Should show:
   - Student results who submitted
   - Marks, percentage, submission date
   - Table with all columns populated
```

#### Step 5: Export to Excel
```
1. On results page, click "Download Excel"
2. Excel file should download
3. Verify columns:
   - Student Name, Father Name, Class, Section, Roll No
   - Exam Title, Subject, Total Marks
   - Marks Obtained, Percentage, Submitted Date
4. Data should match table display
```

#### Step 6: Logout
```
1. Click Logout / Back
2. Expected: Redirect to login page
```

---

### Phase 3: Principal User Flow

#### Step 1: Principal Login
```
1. Open http://localhost:5175/principal-login
2. Enter credentials:
   - Username: the PRINCIPAL_USERNAME from server/.env
   - Password: the PRINCIPAL_PASSWORD from server/.env
3. Click Login
4. Expected: Redirect to all results dashboard
```

#### Step 2: View All Results
```
1. Dashboard shows results from all classes
2. Verify:
   - Results from all exams displayed
   - All student data visible
   - Proper formatting maintained
```

#### Step 3: Filter Results
```
1. Use filter options:
   - By Class: Select "10" → should show only class 10
   - By Section: Select "A" → should show only section A
   - By Exam: Select specific exam → filter results
2. Verify filters work individually and combined
```

#### Step 4: Export Master Report
```
1. Click "Export" on filtered results
2. Excel downloaded successfully
3. Contains all current filtered results
```

#### Step 5: Logout
```
1. Click Logout
2. Return to principal login page
```

---

## ✔️ Core Features Test

### Authentication
- [ ] Student login creates record if not exists
- [ ] Same student (same roll no + class) recognized on re-login
- [ ] Teacher login validates credentials
- [ ] Principal login validates credentials
- [ ] JWT token generated and stored in localStorage
- [ ] Token sent in Authorization header on API calls

### Exam Management
- [ ] Teacher can create exam
- [ ] Exam details saved correctly (title, subject, class, section, duration, marks)
- [ ] Exam only visible to students of that class/section
- [ ] Cannot submit same exam twice
- [ ] Exam can be edited by teacher
- [ ] Exam deletion removes associated questions and results

### Questions
- [ ] Questions created for exam
- [ ] Multiple options per question
- [ ] Only one correct answer per question
- [ ] Marks per question configurable
- [ ] Questions displayed in exam in correct order
- [ ] Question images supported and displayable
- [ ] Questions can be edited/deleted

### Exam Taking
- [ ] Timer starts and counts down
- [ ] Student can navigate between questions
- [ ] Answers saved (not lost on navigation)
- [ ] Can select and change answers
- [ ] Submit locks exam
- [ ] Cannot retake same exam

### Results & Grading
- [ ] Marks calculated correctly
- [ ] Percentage calculated: (obtained / total) * 100
- [ ] Results viewable by student who took exam
- [ ] Teacher can see results per exam
- [ ] Principal can see all results
- [ ] Results can be exported to Excel
- [ ] Excel export properly formatted

### Role-Based Access
- [ ] Students cannot access teacher/principal routes
- [ ] Teachers cannot access student-specific routes
- [ ] Principals have access to all views
- [ ] Unauthorized requests return 401/403 errors

---

## 🐛 Common Issues & Fixes

### Issue: API calls failing (404)
**Check**:
- Backend running on port 8000
- Frontend API URL pointing to `http://localhost:8000/api`
- Routes registered in app.js

### Issue: Database errors
**Check**:
- MongoDB URI correct in .env
- MongoDB Atlas cluster accessible
- Network connection available

### Issue: Image upload fails
**Check**:
- Cloudinary credentials in .env
- Image file not corrupted
- File size within limits (20MB)

### Issue: Excel export not downloading
**Check**:
- Browser download settings
- No ad-blocker blocking download
- Backend returning correct headers
- Results exist to export

### Issue: Styling looks broken
**Check**:
- Tailwind CSS loaded
- Material-UI components loaded
- Browser CSS cache cleared (F12 → Network → Disable cache)

---

## 📊 Performance Testing (Optional)

```javascript
// Test concurrent user logins
for (let i = 0; i < 100; i++) {
  loginStudent(`Student${i}`, "FatherName", "10", "A", `${i}`);
}

// Test bulk question creation
for (let i = 0; i < 50; i++) {
  addQuestion(examId, { text: `Q${i}`, options: [...] });
}

// Test result export with 1000+ results
exportResults(); // Monitor response time
```

---

## ✅ Pre-Production Checklist

- [ ] All tests passed
- [ ] No console errors (check browser F12)
- [ ] No server errors in terminal
- [ ] Database backups configured
- [ ] Cloudinary storage verified
- [ ] Environment variables secured (.env not in git)
- [ ] CORS properly configured
- [ ] Rate limiting implemented (if needed)
- [ ] Error logging enabled
- [ ] Monitoring setup
- [ ] Database indexes optimized
- [ ] API response times acceptable
- [ ] Memory usage stable
- [ ] No memory leaks detected

---

**Last Updated**: February 10, 2026
**Status**: ✅ Ready for Testing
