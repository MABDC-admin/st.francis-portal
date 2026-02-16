import { TeacherFormData } from './TeacherApplicationForm';

const firstNames = ['Maria', 'Juan', 'Ana', 'Jose', 'Patricia', 'Mark', 'Grace', 'Carlo', 'Jasmine', 'Rafael'];
const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Rivera', 'Gonzales', 'Bautista'];
const middleNames = ['Lopez', 'Dela Cruz', 'Ramos', 'Villanueva', 'Aquino', 'Pascual'];
const barangays = ['San Antonio', 'San Jose', 'Poblacion', 'Santo Niño', 'San Isidro'];
const cities = ['Quezon City', 'Manila', 'Makati', 'Pasig', 'Taguig', 'Cebu City', 'Davao City'];
const provinces = ['Metro Manila', 'Cebu', 'Davao del Sur', 'Pampanga', 'Laguna', 'Bulacan'];
const subjects = ['Mathematics', 'Science', 'English', 'Filipino', 'Social Studies', 'MAPEH', 'TLE', 'Values Education'];
const positions = ['Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher'];
const levels = ['Elementary', 'Junior High School', 'Senior High School'];
const schools = ['University of the Philippines', 'Ateneo de Manila', 'De La Salle University', 'UST', 'FEU', 'Polytechnic University'];
const courses = ['Bachelor of Secondary Education', 'Bachelor of Elementary Education', 'Bachelor of Science in Education'];
const majors = ['Mathematics', 'English', 'Science', 'Social Studies', 'Filipino'];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randDigits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const randDate = (startYear: number, endYear: number) => {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear));
  const m = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const generateTestData = (): TeacherFormData => {
  const hasPrc = Math.random() > 0.3;
  const hasExp = Math.random() > 0.3;
  const specCount = Math.floor(Math.random() * 3) + 1;
  const selectedSubjects = [...new Set(Array.from({ length: specCount }, () => pick(subjects)))];

  return {
    first_name: pick(firstNames),
    middle_name: pick(middleNames),
    last_name: pick(lastNames),
    suffix: Math.random() > 0.8 ? 'Jr.' : '',
    gender: Math.random() > 0.5 ? 'Male' : 'Female',
    date_of_birth: randDate(1980, 2000),
    place_of_birth: pick(cities),
    civil_status: pick(['Single', 'Married']),
    nationality: 'Filipino',
    photo_url: '',
    mobile_number: `09${randDigits(9)}`,
    alternate_mobile: Math.random() > 0.5 ? `09${randDigits(9)}` : '',
    email: `teacher.test${randDigits(4)}@example.com`,
    house_street: `${Math.floor(Math.random() * 999) + 1} ${pick(['Rizal', 'Mabini', 'Bonifacio', 'Luna'])} St.`,
    barangay: pick(barangays),
    city_municipality: pick(cities),
    province: pick(provinces),
    zip_code: randDigits(4),
    country: 'Philippines',
    position_applied: pick(positions),
    subject_specialization: selectedSubjects,
    preferred_level: pick(levels),
    has_prc_license: hasPrc,
    prc_license_number: hasPrc ? randDigits(7) : '',
    prc_expiration_date: hasPrc ? randDate(2025, 2028) : '',
    prc_license_url: '',
    education: [
      {
        level: 'Bachelor',
        course: pick(courses),
        major: pick(majors),
        school: pick(schools),
        year_graduated: String(2005 + Math.floor(Math.random() * 15)),
        honors: Math.random() > 0.6 ? 'Cum Laude' : '',
      },
    ],
    has_experience: hasExp,
    experience: hasExp
      ? [
          {
            school: pick(schools) + ' Academy',
            position: pick(positions),
            subjects: pick(subjects),
            start_date: randDate(2015, 2020),
            end_date: randDate(2021, 2024),
            status: 'Completed',
          },
        ]
      : [],
    resume_url: '',
    transcript_url: '',
    diploma_url: '',
    valid_id_url: '',
    certificates_url: [],
    why_join: 'I am passionate about education and want to contribute to the holistic development of students through innovative teaching methodologies.',
    teaching_philosophy: 'I believe every student has unique potential. My approach centers on differentiated instruction and creating an inclusive learning environment.',
    expected_salary: '',
    available_start_date: randDate(2026, 2027),
  };
};
