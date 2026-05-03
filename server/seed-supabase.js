require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Deterministic UUID: same seed always produces the same UUID
// This prevents FK violations when re-running the seed
const deterministicUUID = (seed) => {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),           // version 4
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.slice(18, 20),
    hash.slice(20, 32)
  ].join('-');
};

const validGrades = ['KG 1', 'KG 2', 'KG 3', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Basic 7', 'Basic 8', 'Basic 9', 'JHS 1', 'JHS 2', 'JHS 3'];

// 260 unique Ghanaian first names spanning Akan, Ewe, Ga, Dagomba & Christian naming traditions
// Using sequential index-based picking ensures each name appears at most twice across 500 students
const firstNames = [
  // Akan male day names
  'Kwame','Kofi','Yaw','Kwasi','Kojo','Kwabena','Akwasi','Kweku','Kobina','Kwaku',
  // Akan female day names
  'Abena','Akosua','Yaa','Afia','Ama','Adwoa','Esi','Akua','Afua','Araba',
  // Ewe names (Volta Region – home of UHAS Basic School)
  'Mawuli','Selorm','Edem','Kafui','Dela','Seli','Koku','Dodzi','Senanu','Komi',
  'Elorm','Eyram','Delali','Senam','Yorm','Setor','Kekeli','Mawuena','Worlanyo','Elikem',
  'Kwashie','Kwami','Yao','Elolo','Sena','Vigbedor','Ametor','Kwadzo','Gbevlo','Lartey',
  // Biblical / Christian names common in Ghana
  'Emmanuel','Samuel','Daniel','Grace','Mary','Esther','Joseph','David','Sarah','Comfort',
  'Isaac','Ebenezer','Michael','John','Peter','Paul','James','Ruth','Naomi','Hannah',
  'Gifty','Joyce','Felix','Priscilla','Dorcas','Gladys','Abraham','Moses','Solomon','Elijah',
  'Enoch','Joshua','Rebecca','Rachel','Miriam','Deborah','Abigail','Elizabeth','Martha','Lydia',
  'Phoebe','Eunice','Stephen','Philip','Andrew','Simon','Matthew','Thomas','Barnabas','Timothy',
  'Benjamin','Caleb','Gideon','Hosea','Joel','Amos','Jonah','Micah','Ezekiel','Jeremiah',
  // Virtue / Concept names popular in Ghana
  'Blessing','Mercy','Patience','Charity','Faith','Hope','Love','Peace','Joy','Gloria',
  'Prince','Princess','Precious','Favor','Triumph','Victor','Godfred','Godwin','Godfrey','Goodness',
  // Northern Ghana names (Dagomba / Mamprusi / Wala)
  'Alhassan','Ibrahim','Abdulai','Mohammed','Yakubu','Issahaku','Fuseini','Sulemana','Haruna','Mumuni',
  'Seidu','Dramani','Mahama','Musah','Alidu','Tampuli','Ayesha','Fatima','Rashida','Habiba',
  'Mariama','Amina','Zainab','Kadijatu','Bawa','Ziblim','Iddrissu','Abubakar','Umar','Ramatu',
  // English / European names common in Ghana
  'Bernard','Francis','Anthony','Augustine','Christopher','Dominic','Edward','Frederick','George','Henry',
  'Lawrence','Nicholas','Patrick','Richard','Robert','William','Ernest','Eugene','Frank','Gerald',
  'Kenneth','Leonard','Martin','Nathan','Oscar','Ralph','Roger','Stanley','Theodore','Vincent',
  'Angela','Florence','Victoria','Juliet','Sandra','Felicia','Beatrice','Dorothy','Georgina','Helena',
  'Irene','Josephine','Linda','Agnes','Cecilia','Philomena','Theresa','Veronica','Yvonne','Alberta',
  'Audrey','Bernice','Constance','Doris','Edith','Ella','Emma','Fiona','Harriet','Janet',
  'Jennifer','Karen','Katherine','Laura','Lillian','Margaret','Nora','Olivia','Pamela','Patricia',
  'Penelope','Phyllis','Rhonda','Rita','Roberta','Rose','Rosemary','Shirley','Sylvia','Winifred',
  // More Akan names
  'Asantewaa','Dufie','Pokua','Fosua','Gyamfua','Oforiwaa','Adjoa','Ekua','Efua','Nhyira',
  'Serwaa','Adepa','Ampomaa','Frema','Akesse','Nkrumah','Acheampong','Nana','Maame','Nkemdirim',
  // Ga names
  'Nii','Naa','Tetteh','Tetteley','Amerley','Korkor','Okaishie','Shormeh','Ayorkor','Lomo',
];

const lastNames = [
  // Akan surnames (100)
  'Mensah','Osei','Owusu','Boateng','Appiah','Asamoah','Frimpong','Ofori','Yeboah','Agyemang',
  'Boakye','Arthur','Adu','Asante','Danquah','Gyan','Quaye','Tetteh','Addo','Nketiah',
  'Opoku','Sarfo','Boadu','Annan','Amoah','Ansah','Baah','Agyei','Agyapong','Anim',
  'Donkor','Kusi','Otoo','Okyere','Baafi','Nyarko','Atta','Asare','Bediako','Bonsu',
  'Dankwa','Darko','Duah','Ennin','Fosu','Gyasi','Inkoom','Kyei','Mintah','Nkrumah',
  'Obeng','Oduro','Ohene','Poku','Sarpong','Twum','Wiredu','Yiadom','Acheampong','Prempeh',
  'Amoako','Marfo','Sefa','Kwarteng','Afrifa','Buadu','Koranteng','Awuah','Ampofo','Ankrah',
  'Tawiah','Adusei','Ntim','Amponsah','Adjei','Baffour','Nyantakyi','Takyi','Berko','Bekoe',
  'Fordjour','Konadu','Yirenkyi','Brobbey','Twumasi','Kesse','Achiaa','Kumah','Peprah','Otchere',
  'Dwomoh','Asamani','Akoto','Ampadu','Dua','Obiri','Asiedu','Attah','Bimpong','Fofie',
  // Ewe surnames (50)
  'Agbeko','Amegashie','Amedzo','Ametefe','Anyidoho','Attivor','Avemegah','Awittor','Bedzo','Degbor',
  'Dotse','Dzogbenuku','Fiagbe','Gakpo','Gbagbo','Hodge','Kpodo','Kumordzi','Ladzekpo','Logah',
  'Mawutor','Nyavor','Nutsugah','Ocloo','Senaya','Seshie','Tay','Togbe','Vigbedor','Yevugah',
  'Akpalu','Awuku','Deku','Dzamesi','Gbedemah','Kudzo','Lumor','Mensa','Novieto','Torku',
  'Agbemabiese','Ahiable','Atsiatorme','Dzikunu','Kpordugbe','Midawo','Sakitey','Sowu','Wanyo','Yegbe',
  // Ga / Ga-Adangbe surnames (30)
  'Adjetey','Amarteifio','Armah','Ashong','Bannerman','Clottey','Dedey','Hammond','Kotey','Laryea',
  'Lomotey','Martey','Nartey','Nortey','Nortei','Odoi','Okai','Okine','Ollenu','Quartey',
  'Sackey','Sowah','Tackie','Teye','Vanderpuije','Welbeck','Wetey','Yartey','Dodoo','Korley',
  // Northern Ghana surnames (30)
  'Abubakari','Alhassan','Azumah','Bintoye','Dagomba','Fusheini','Iddrisu','Issaka','Jabuni','Kaleem',
  'Kantanka','Lamptey','Mahami','Naporo','Nuhu','Osman','Razak','Salifu','Tampuri','Wumbei',
  'Yidana','Zakariah','Zulkarnain','Abdallah','Abukari','Dawuni','Duut','Gandaa','Haruna','Issahaku',
  // Other Ghanaian & general surnames (40)
  'Ackon','Addae','Agbenyega','Akomea','Amissah','Ankomah','Asiedu-Mante','Djan','Essien','Fiifi',
  'Koomson','Mensah-Bonsu','Nkansah','Nortsu','Ocran','Quartson','Reindorf','Sackeyfio','Sakyi','Siriboe',
  'Tandoh','Ussher','Woode','Yankey','Afful','Amankwah','Asomaning','Attafuah','Botwe','Crentsil',
  'Debrah','Effah','Gaisie','Korsah','Kwapong','Obuobi','Tuffour','Yakah','Ziem','Abankwa',
];


// Deterministic name picker — index-based, no randomness
// nameIdx(n, pool) → pool[n % pool.length] ensuring max ⌈n_total/pool.length⌉ repetitions
const nameAt = (idx, arr) => arr[idx % arr.length];
const lastAt = (idx) => lastNames[idx % lastNames.length];

const seedData = async () => {
  try {
    console.log('Starting Supabase seed...');
    console.log('This might take a minute due to generating passwords for 750+ users...');

    const getUId = (key) => deterministicUUID('user-' + key);
    const getTId = (key) => deterministicUUID('teacher-' + key);
    const getPId = (key) => deterministicUUID('parent-' + key);
    const getSId = (key) => deterministicUUID('student-' + key);
    const getCId = (key) => deterministicUUID('course-' + key);
    const getFId = (key) => deterministicUUID('fee-' + key);
    const getStfId = (key) => deterministicUUID('staff-' + key);

    const hashCache = {};
    const getHash = async (pwd) => {
      if (!hashCache[pwd]) {
        hashCache[pwd] = await bcrypt.hash(pwd, 10);
      }
      return hashCache[pwd];
    };

    const usersData = [];
    const staffData = [];

    // ==================== SYSTEM & STAFF (Non-teaching staff) ====================
    const adminId = 'admin001';
    usersData.push({ id: getUId(adminId), email: `${adminId}@uhasbasic.edu.gh`, password: await getHash(`${adminId}uhas_basic_password`), role: 'admin', first_name: 'System', last_name: 'Administrator', phone: '+233501234567', is_active: true });
    staffData.push({ id: getStfId(adminId), user_id: getUId(adminId), employee_id: 'STF0001', first_name: 'System', last_name: 'Administrator', department: 'admin', position: 'Administrator', status: 'active', email: `${adminId}@uhasbasic.edu.gh` });

    const financeId = 'f001';
    usersData.push({ id: getUId(financeId), email: `${financeId}@uhasbasic.edu.gh`, password: await getHash(`${financeId}uhas_basic_password`), role: 'finance', first_name: 'Michael', last_name: 'Scott', phone: '+233501234588', is_active: true });
    staffData.push({ id: getStfId(financeId), user_id: getUId(financeId), employee_id: 'STF0002', first_name: 'Michael', last_name: 'Scott', department: 'finance', position: 'Finance Manager', status: 'active', email: `${financeId}@uhasbasic.edu.gh` });

    const itId = 'it001';
    usersData.push({ id: getUId(itId), email: `${itId}@uhasbasic.edu.gh`, password: await getHash(`${itId}uhas_basic_password`), role: 'ITSupport', first_name: 'John', last_name: 'Boateng', phone: '+233501234599', is_active: true });
    staffData.push({ id: getStfId(itId), user_id: getUId(itId), employee_id: 'STF0003', first_name: 'John', last_name: 'Boateng', department: 'ITSupport', position: 'IT Support', status: 'active', email: `${itId}@uhasbasic.edu.gh` });

    // ==================== TEACHERS ====================
    const teacherSubjects = [
      { subject: 'Mathematics', grades: ['JHS 1', 'JHS 2', 'JHS 3'] },
      { subject: 'Science', grades: ['Primary 4', 'Primary 5', 'Primary 6', 'JHS 1'] },
      { subject: 'English', grades: ['Primary 1', 'Primary 2', 'Primary 3'] },
      { subject: 'Social Studies', grades: ['JHS 1', 'JHS 2', 'JHS 3'] },
      { subject: 'Creative Arts', grades: ['KG 1', 'KG 2', 'Primary 1', 'Primary 2'] },
      { subject: 'ICT', grades: ['Primary 4', 'Primary 5', 'Primary 6', 'JHS 1', 'JHS 2', 'JHS 3'] },
      { subject: 'RME', grades: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4'] },
      { subject: 'Ghanaian Language', grades: ['Primary 4', 'Primary 5', 'Primary 6', 'JHS 1'] },
      { subject: 'French', grades: ['JHS 1', 'JHS 2', 'JHS 3'] },
      { subject: 'Physical Education', grades: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'] }
    ];

    const teachersData = [];
    for (let i = 1; i <= 10; i++) {
      let tId = `t${String(i).padStart(3, '0')}`;
      let fName = nameAt(i - 1, firstNames);
      let lName = lastAt(i - 1);
      usersData.push({ id: getUId(tId), email: `${tId}@uhasbasic.edu.gh`, password: await getHash(`${tId}uhas_basic_password`), role: 'teacher', first_name: fName, last_name: lName, phone: `+233502${String(i).padStart(4, '0')}`, is_active: true });

      teachersData.push({
        id: getTId(tId), user_id: getUId(tId), employee_id: `TCH${String(i).padStart(3, '0')}`,
        first_name: fName, last_name: lName,
        date_of_birth: '1985-01-01', gender: i % 2 === 0 ? 'male' : 'female',
        subject: teacherSubjects[i-1].subject, grades: teacherSubjects[i-1].grades,
        salary: 4000 + (i * 500), status: 'active'
      });
    }

    // ==================== PARENTS & STUDENTS ====================
    const parentsData = [];
    const studentsData = [];
    
    let studentCounter = 1;
    // 250 parents, each with 2 children = 500 students
    for (let i = 1; i <= 250; i++) {
      let pId = `p${String(i).padStart(3, '0')}`;
      // Index-based name: parent i → firstNames[i-1], lastNames[i-1]
      // Siblings get firstNames[(i-1)*2] and firstNames[(i-1)*2+1] — always different
      let pFName = nameAt(i - 1, firstNames);
      let familyName = lastAt(i - 1);
      
      usersData.push({ id: getUId(pId), email: `${pId}@uhasbasic.edu.gh`, password: await getHash(`${pId}uhas_basic_password`), role: 'parent', first_name: pFName, last_name: familyName, phone: `+233503${String(i).padStart(4, '0')}`, is_active: true });

      let child1Id = `s${String(studentCounter).padStart(3, '0')}`;
      studentCounter++;
      let child2Id = `s${String(studentCounter).padStart(3, '0')}`;
      studentCounter++;

      const occupations = ['Teacher', 'Nurse', 'Trader', 'Farmer', 'Civil Servant', 'Driver', 'Pastor', 'Engineer'];
      parentsData.push({
        id: getPId(pId), user_id: getUId(pId), first_name: pFName, last_name: familyName,
        email: `${pId}@uhasbasic.edu.gh`,
        gender: i % 2 === 0 ? 'male' : 'female', relationship: i % 2 === 0 ? 'father' : 'mother',
        phone: `+233503${String(i).padStart(4, '0')}`,
        occupation: occupations[i % occupations.length],
        receive_sms: true, receive_email: true, preferred_language: 'en',
        student_ids: [getSId(child1Id), getSId(child2Id)]
      });

      // Children accounts
      for (let sId of [child1Id, child2Id]) {
        let num = parseInt(sId.replace('s', ''));
        // Child indices: parent i has students at positions (i-1)*2 and (i-1)*2+1
        // This guarantees siblings have different first names and each name repeats ≤ 2 times
        const childSlot = (i - 1) * 2 + (sId === child1Id ? 0 : 1);
        let cFName = nameAt(childSlot, firstNames);
        
        usersData.push({ id: getUId(sId), email: `${sId}@uhasbasic.edu.gh`, password: await getHash(`${sId}uhas_basic_password`), role: 'student', first_name: cFName, last_name: familyName, phone: `+233504${String(num).padStart(4, '0')}`, is_active: true });

        const houses = ['Green House', 'Yellow House', 'Red House', 'Blue House'];
        const religions = ['Christianity', 'Islam', 'Christianity', 'Christianity'];
        studentsData.push({
          id: getSId(sId), user_id: getUId(sId), admission_number: `STU${String(num).padStart(4, '0')}`,
          first_name: cFName, last_name: familyName, email: `${sId}@uhasbasic.edu.gh`,
          date_of_birth: `${2008 + (num % 6)}-${String((num % 12) + 1).padStart(2,'0')}-${String((num % 28) + 1).padStart(2,'0')}`,
          gender: num % 2 === 0 ? 'male' : 'female',
          grade: validGrades[num % validGrades.length], section: num % 2 === 0 ? 'A' : 'B',
          academic_year: '2024-2025', parent_ids: [getPId(pId)], status: 'active',
          phone: `+233504${String(num).padStart(4, '0')}`, nationality: 'Ghanaian',
          religion: religions[num % religions.length], house: houses[num % houses.length],
          address: { street: `${num} Main Street`, city: 'Ho', region: 'Volta Region', country: 'Ghana' },
          emergency_contact: { name: pFName, relationship: 'Parent', phone: `+233503${String(i).padStart(4, '0')}`, email: `${pId}@uhasbasic.edu.gh` },
          medical_info: { bloodType: 'O+', allergies: [], conditions: [], medications: [], doctorName: '', doctorPhone: '' }
        });
      }
    }

    console.log(`Generated ${usersData.length} users, preparing to upsert...`);

    // Clear all tables in FK-safe order (dependents first, then parent tables)
    // This is needed once to remove any stale records with old random UUIDs.
    // After the first clean run, subsequent runs will just upsert without deleting.
    console.log('Clearing stale data in FK-safe order...');
    const clearOrder = [
      'payments', 'fees', 'health_records', 'disciplinary_records',
      'report_cards', 'grades', 'attendance', 'assignments', 'timetable',
      'courses', 'students', 'parents', 'teachers', 'staff',
      'announcements', 'events', 'settings', 'users'
    ];
    for (const table of clearOrder) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error && !error.message.toLowerCase().includes('does not exist')) {
        console.warn(`  Warning clearing ${table}: ${error.message}`);
      } else {
        console.log(`  Cleared ${table}`);
      }
    }

    // Upsert users (conflict on id — deterministic UUID means same key = same id every run)
    const chunkSize = 100;
    for (let i = 0; i < usersData.length; i += chunkSize) {
      let { error: usersError } = await supabase
        .from('users')
        .upsert(usersData.slice(i, i + chunkSize), { onConflict: 'id' });
      if (usersError) throw new Error('Users upsert failed: ' + usersError.message);
      console.log(`Upserted users ${i + 1} to ${Math.min(i + chunkSize, usersData.length)}`);
    }

    // Upsert teachers (conflict on employee_id)
    let { error: teachersError } = await supabase
      .from('teachers')
      .upsert(teachersData, { onConflict: 'employee_id' });
    if (teachersError) throw new Error('Teachers upsert failed: ' + teachersError.message);
    console.log(`Upserted ${teachersData.length} teachers`);

    // Upsert staff (conflict on employee_id)
    let { error: staffError } = await supabase
      .from('staff')
      .upsert(staffData, { onConflict: 'employee_id' });
    if (staffError) throw new Error('Staff upsert failed: ' + staffError.message);
    console.log(`Upserted ${staffData.length} staff`);

    // Upsert parents (conflict on id)
    for (let i = 0; i < parentsData.length; i += chunkSize) {
      let { error: parentsError } = await supabase
        .from('parents')
        .upsert(parentsData.slice(i, i + chunkSize), { onConflict: 'id' });
      if (parentsError) throw new Error('Parents upsert failed: ' + parentsError.message);
      console.log(`Upserted parents ${i + 1} to ${Math.min(i + chunkSize, parentsData.length)}`);
    }

    // Upsert students (conflict on admission_number)
    for (let i = 0; i < studentsData.length; i += chunkSize) {
      let { error: studentsError } = await supabase
        .from('students')
        .upsert(studentsData.slice(i, i + chunkSize), { onConflict: 'admission_number' });
      if (studentsError) throw new Error('Students upsert failed: ' + studentsError.message);
      console.log(`Upserted students ${i + 1} to ${Math.min(i + chunkSize, studentsData.length)}`);
    }

    // ==================== COURSES ====================
    const coursesMock = [
      { id: 'c001', name: 'Mathematics', code: 'MATH101', grade: 'JHS 1', teacherId: 't001', hoursPerWeek: 4, room: 'R101' },
      { id: 'c002', name: 'Science', code: 'SCI101', grade: 'JHS 1', teacherId: 't002', hoursPerWeek: 3, room: 'R102' },
      { id: 'c003', name: 'English', code: 'ENG101', grade: 'Basic 7', teacherId: 't003', hoursPerWeek: 3, room: 'R103' },
      { id: 'c004', name: 'Social Studies', code: 'SOC101', grade: 'JHS 2', teacherId: 't004', hoursPerWeek: 4, room: 'R104' },
      { id: 'c005', name: 'Creative Arts', code: 'ART101', grade: 'Primary 1', teacherId: 't005', hoursPerWeek: 3, room: 'R105' },
      { id: 'c006', name: 'ICT', code: 'ICT101', grade: 'JHS 3', teacherId: 't006', hoursPerWeek: 3, room: 'R106' },
      { id: 'c007', name: 'RME', code: 'RME101', grade: 'Primary 4', teacherId: 't007', hoursPerWeek: 3, room: 'R107' },
      { id: 'c008', name: 'Ghanaian Language', code: 'GHA101', grade: 'Primary 5', teacherId: 't008', hoursPerWeek: 2, room: 'R108' },
      { id: 'c009', name: 'French', code: 'FRE101', grade: 'JHS 1', teacherId: 't009', hoursPerWeek: 2, room: 'R109' },
      { id: 'c010', name: 'Physical Education', code: 'PE101', grade: 'Primary 6', teacherId: 't010', hoursPerWeek: 2, room: 'FIELD' }
    ];

    const coursesData = coursesMock.map(c => ({
      id: getCId(c.id), name: c.name, code: c.code, grade: c.grade, academic_year: '2024-2025',
      teacher_id: getTId(c.teacherId), hours_per_week: c.hoursPerWeek, room: c.room, is_active: true
    }));

    // Upsert courses (conflict on code)
    let { error: coursesError } = await supabase
      .from('courses')
      .upsert(coursesData, { onConflict: 'code' });
    if (coursesError) throw new Error('Courses upsert failed: ' + coursesError.message);
    console.log(`Upserted ${coursesData.length} courses`);

    // ==================== GRADES ====================
    // Grades (just for first 15 students to keep it light)
    const gradesData = [];
    const gradeLetters = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
    let gradeIndex = 0;

    studentsData.slice(0, 15).forEach(s => {
      coursesMock.forEach(c => {
        if (c.grade === s.grade) {
          const classwork = 70 + Math.floor(Math.random() * 25);
          const homework = 72 + Math.floor(Math.random() * 23);
          const midterm = 68 + Math.floor(Math.random() * 27);
          const finalExam = 70 + Math.floor(Math.random() * 25);
          const total = parseFloat(((classwork + homework + midterm + finalExam) / 4).toFixed(1));
          
          gradesData.push({
            student_id: s.id, course_id: getCId(c.id), academic_year: '2024-2025', term: '1st',
            assessments: { classwork, homework, midterm, finalExam }, total_score: total, letter_grade: gradeLetters[gradeIndex % gradeLetters.length]
          });
          gradeIndex++;
        }
      });
    });

    if (gradesData.length > 0) {
      let { error: gradesError } = await supabase
        .from('grades')
        .upsert(gradesData, { onConflict: 'student_id,course_id,academic_year,term' });
      if (gradesError) throw new Error('Grades upsert failed: ' + gradesError.message);
      console.log(`Upserted ${gradesData.length} grades`);
    }

    // ==================== FEES & PAYMENTS ====================
    const feesMock = [
      { id: 'fee001', name: 'Term 1 Tuition', grade: 'JHS 1', amount: 1500 },
      { id: 'fee002', name: 'Term 1 Tuition', grade: 'Primary 6', amount: 1600 },
      { id: 'fee003', name: 'Term 1 Tuition', grade: 'KG 1', amount: 1400 }
    ];

    const feesData = feesMock.map(f => ({
      id: getFId(f.id), name: f.name, academic_year: '2024-2025', term: '1st',
      grade: f.grade, amount: f.amount, due_date: '2024-09-15'
    }));

    let { error: feesError } = await supabase
      .from('fees')
      .upsert(feesData, { onConflict: 'id' });
    if (feesError) throw new Error('Fees upsert failed: ' + feesError.message);
    console.log(`Upserted ${feesData.length} fees`);

    const paymentsData = [];
    const paymentMethods = ['mobileMoney', 'bankTransfer', 'cash'];
    const statuses = ['completed', 'completed', 'completed', 'pending'];
    
    studentsData.slice(0, 15).forEach((s, index) => {
      paymentsData.push({
        student_id: s.id, fee_id: getFId('fee001'), academic_year: '2024-2025', term: '1st', amount: 1500,
        payment_method: paymentMethods[index % paymentMethods.length], status: statuses[index % statuses.length],
        receipt_number: `RCP${String(index + 1).padStart(5, '0')}`, payment_date: new Date().toISOString()
      });
    });

    if (paymentsData.length > 0) {
      let { error: paymentsError } = await supabase
        .from('payments')
        .upsert(paymentsData, { onConflict: 'receipt_number' });
      if (paymentsError) throw new Error('Payments upsert failed: ' + paymentsError.message);
      console.log(`Upserted ${paymentsData.length} payments`);
    }

    // ==================== NEW SCHEMA TABLES ====================
    // These tables require the updated schema.sql to be applied in the Supabase SQL Editor.
    // If not applied yet, they will be skipped gracefully.
    const tryInsert = async (label, fn) => {
      try { await fn(); } catch (e) { console.warn(`  ⚠ Skipped ${label} (schema not updated yet): ${e.message}`); }
    };

    await tryInsert('announcements', async () => {
      const announcementsData = [
        { id: deterministicUUID('ann-001'), title: 'Welcome Back to Term 1!', content: 'Dear students, teachers, and parents, welcome to the 2024-2025 academic year.', priority: 'high', is_published: true, published_at: new Date('2024-09-02').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('ann-002'), title: 'PTA Meeting Notice', content: 'A PTA meeting is scheduled for Saturday 28th September 2024 at 9:00 AM.', priority: 'normal', is_published: true, published_at: new Date('2024-09-15').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('ann-003'), title: 'Mid-Term Examination Timetable', content: 'Mid-term examinations will commence on October 7th.', priority: 'high', is_published: true, published_at: new Date('2024-09-20').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('ann-004'), title: 'School Fees Reminder', content: 'All outstanding fees for Term 1 must be paid by 30th September 2024.', priority: 'urgent', is_published: true, published_at: new Date('2024-09-18').toISOString(), created_by: getUId(financeId) },
        { id: deterministicUUID('ann-005'), title: 'Inter-House Sports Day', content: 'Annual competition on 15th November 2024. Register with House Masters.', priority: 'normal', is_published: true, published_at: new Date('2024-10-01').toISOString(), created_by: getUId(adminId) }
      ];
      const { error } = await supabase.from('announcements').upsert(announcementsData, { onConflict: 'id' });
      if (error) throw error;
      console.log(`  Upserted ${announcementsData.length} announcements`);
    });

    await tryInsert('events', async () => {
      const eventsData = [
        { id: deterministicUUID('evt-001'), title: 'First Day of Term 1', description: 'Academic year 2024-2025 begins', event_type: 'academic', start_date: new Date('2024-09-02T07:30:00').toISOString(), end_date: new Date('2024-09-02T15:00:00').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('evt-002'), title: 'Mid-Term Examinations', description: 'Term 1 Mid-Term Exams', event_type: 'exam', start_date: new Date('2024-10-07T07:30:00').toISOString(), end_date: new Date('2024-10-11T15:00:00').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('evt-003'), title: 'Inter-House Sports Day', description: 'Annual inter-house sports', event_type: 'sports', start_date: new Date('2024-11-15T08:00:00').toISOString(), end_date: new Date('2024-11-15T17:00:00').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('evt-004'), title: 'PTA Meeting', description: 'First Term PTA Meeting', event_type: 'meeting', start_date: new Date('2024-09-28T09:00:00').toISOString(), end_date: new Date('2024-09-28T12:00:00').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('evt-005'), title: 'End of Term 1', description: 'Last day of first term', event_type: 'academic', start_date: new Date('2024-12-13T07:30:00').toISOString(), end_date: new Date('2024-12-13T12:00:00').toISOString(), created_by: getUId(adminId) },
        { id: deterministicUUID('evt-006'), title: 'Christmas Vacation', description: 'Term 1 vacation', event_type: 'holiday', start_date: new Date('2024-12-14T00:00:00').toISOString(), end_date: new Date('2025-01-05T00:00:00').toISOString(), created_by: getUId(adminId) }
      ];
      const { error } = await supabase.from('events').upsert(eventsData, { onConflict: 'id' });
      if (error) throw error;
      console.log(`  Upserted ${eventsData.length} events`);
    });

    await tryInsert('timetable', async () => {
      const timetableData = [];
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      const periods = [
        { period: 1, start: '07:30', end: '08:20' },
        { period: 2, start: '08:20', end: '09:10' },
        { period: 3, start: '09:10', end: '09:30', isBreak: true, label: 'Morning Break' },
        { period: 4, start: '09:30', end: '10:20' },
        { period: 5, start: '10:20', end: '11:10' },
        { period: 6, start: '11:10', end: '12:00' },
        { period: 7, start: '12:00', end: '13:00', isBreak: true, label: 'Lunch Break' },
        { period: 8, start: '13:00', end: '13:50' },
      ];
      const jhs1Courses = [getCId('c001'), getCId('c002'), getCId('c009')];
      days.forEach(day => {
        periods.forEach(p => {
          timetableData.push({
            id: deterministicUUID(`tt-JHS1-A-${day}-${p.period}`),
            academic_year: '2024-2025', term: '1st', grade: 'JHS 1', section: 'A',
            day, period: p.period, start_time: p.start, end_time: p.end,
            is_break: p.isBreak || false, break_label: p.label || null,
            course_id: p.isBreak ? null : jhs1Courses[p.period % jhs1Courses.length],
            teacher_id: p.isBreak ? null : getTId(`t${String((p.period % 3) + 1).padStart(3,'0')}`),
            room: p.isBreak ? null : `R10${(p.period % 3) + 1}`,
            created_by: getUId(adminId)
          });
        });
      });
      const { error } = await supabase.from('timetable').upsert(timetableData, { onConflict: 'id' });
      if (error) throw error;
      console.log(`  Upserted ${timetableData.length} timetable entries`);
    });

    await tryInsert('disciplinary_records', async () => {
      const discData = [
        { id: deterministicUUID('disc-001'), student_id: studentsData[0].id, incident_date: '2024-10-05', incident_type: 'late_coming', description: 'Student arrived 45 minutes late.', action_taken: 'verbal_warning', reported_by: getUId('t001'), parent_notified: true, is_resolved: true },
        { id: deterministicUUID('disc-002'), student_id: studentsData[2].id, incident_date: '2024-10-12', incident_type: 'misconduct', description: 'Student was disrespectful to a teacher.', action_taken: 'written_warning', reported_by: getUId('t001'), parent_notified: true, is_resolved: true },
        { id: deterministicUUID('disc-003'), student_id: studentsData[4].id, incident_date: '2024-11-03', incident_type: 'truancy', description: 'Absent for 3 days without notification.', action_taken: 'parental_meeting', reported_by: getUId('t002'), parent_notified: true, is_resolved: false }
      ];
      const { error } = await supabase.from('disciplinary_records').upsert(discData, { onConflict: 'id' });
      if (error) throw error;
      console.log(`  Upserted ${discData.length} disciplinary records`);
    });

    await tryInsert('health_records', async () => {
      const healthData = [
        { id: deterministicUUID('hlth-001'), student_id: studentsData[1].id, visit_date: '2024-09-18', complaint: 'Headache and fever', diagnosis: 'Mild fever - likely malaria', treatment: 'Paracetamol given', referred_to_hospital: false, parent_notified: true, attended_by: 'School Nurse' },
        { id: deterministicUUID('hlth-002'), student_id: studentsData[3].id, visit_date: '2024-10-08', complaint: 'Stomach pain', diagnosis: 'Gastroenteritis', treatment: 'ORS administered', referred_to_hospital: true, parent_notified: true, attended_by: 'School Nurse' },
        { id: deterministicUUID('hlth-003'), student_id: studentsData[5].id, visit_date: '2024-10-22', complaint: 'Cut on hand', diagnosis: 'Minor laceration', treatment: 'Wound cleaned and dressed', referred_to_hospital: false, parent_notified: false, attended_by: 'School Nurse' }
      ];
      const { error } = await supabase.from('health_records').upsert(healthData, { onConflict: 'id' });
      if (error) throw error;
      console.log(`  Upserted ${healthData.length} health records`);
    });

    // ==================== SETTINGS ====================
    await supabase.from('settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: settingsError } = await supabase.from('settings').insert([{
      school_name: 'UHAS Basic School',
      school_code: 'UHAS-001',
      current_session: '2024-2025',
      current_term: '1st',
      grading_system: [
        { grade: 'A+', minScore: 90, maxScore: 100, gradePoint: 4.0, remark: 'Excellent' },
        { grade: 'A',  minScore: 80, maxScore: 89,  gradePoint: 3.5, remark: 'Very Good' },
        { grade: 'B+', minScore: 75, maxScore: 79,  gradePoint: 3.3, remark: 'Good' },
        { grade: 'B',  minScore: 70, maxScore: 74,  gradePoint: 3.0, remark: 'Good' },
        { grade: 'C+', minScore: 65, maxScore: 69,  gradePoint: 2.5, remark: 'Credit' },
        { grade: 'C',  minScore: 60, maxScore: 64,  gradePoint: 2.0, remark: 'Credit' },
        { grade: 'D',  minScore: 50, maxScore: 59,  gradePoint: 1.0, remark: 'Pass' },
        { grade: 'F',  minScore: 0,  maxScore: 49,  gradePoint: 0.0, remark: 'Fail' }
      ]
    }]);
    if (settingsError) throw new Error('Settings seed failed: ' + settingsError.message);
    console.log('Inserted settings');

    console.log('\n✅ Seed completed successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Login credentials:');
    console.log('  Admin:     admin001@uhasbasic.edu.gh / admin001uhas_basic_password');
    console.log('  Teacher:   t001@uhasbasic.edu.gh    / t001uhas_basic_password');
    console.log('  Parent:    p001@uhasbasic.edu.gh    / p001uhas_basic_password');
    console.log('  Student:   s001@uhasbasic.edu.gh    / s001uhas_basic_password');
    console.log('  Finance:   f001@uhasbasic.edu.gh    / f001uhas_basic_password');
    console.log('  ITSupport: it001@uhasbasic.edu.gh   / it001uhas_basic_password');

  } catch (e) {
    console.error('Seed error:', e);
    process.exit(1);
  }
};

seedData();
