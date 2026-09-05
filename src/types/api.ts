export interface MeResponse {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  allowed: boolean;
  role: "owner" | "member" | null;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  credits: number;
  attendanceMode: "online" | "presencial" | null;
  birthDate: string | null;
  startDate: string | null;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  attendanceMode?: Student["attendanceMode"];
  birthDate?: string | null;
  startDate?: string | null;
  observations?: string | null;
}

export interface AccessGrant {
  email: string;
  role: "owner" | "member";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
