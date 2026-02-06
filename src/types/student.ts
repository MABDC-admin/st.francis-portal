export interface Student {
  id: string;
  lrn: string;
  student_name: string;
  level: string;
  school: string | null;
  school_id: string;
  academic_year_id: string;
  birth_date: string | null;
  age: number | null;
  gender: string | null;
  mother_contact: string | null;
  mother_maiden_name: string | null;
  father_contact: string | null;
  father_name: string | null;
  phil_address: string | null;
  uae_address: string | null;
  previous_school: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  has_grades?: boolean;
  grade_quarters?: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
  };
}

export interface StudentDocument {
  id: string;
  student_id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
  slot_number: number;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentFormData {
  lrn: string;
  student_name: string;
  level: string;
  school?: string;
  birth_date?: string;
  age?: number;
  gender?: string;
  mother_contact?: string;
  mother_maiden_name?: string;
  father_contact?: string;
  father_name?: string;
  phil_address?: string;
  uae_address?: string;
  previous_school?: string;
}

export interface CSVStudent {
  level: string;
  lrn: string;
  student_name: string;
  birth_date: string;
  age: string;
  gender: string;
  mother_contact: string;
  mother_maiden_name: string;
  father_contact: string;
  father_name: string;
  phil_address: string;
  uae_address: string;
  previous_school: string;
}
