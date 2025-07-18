export type GalleryItem = {
  title: string;
  description: string;
  image: string; // just filename
  uploadedAt: string;
};

export type EventItem = {
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  uploadedAt: string;
};

export type FacultyItem = {
  name: string;
  designation: string;
  qualification: string;
  contact: string;
  email: string;
  research: string;
  image: string;
  uploadedAt: string;
};

export type PlacementItem = {
  studentName: string;
  company: string;
  package: string;
  role: string;
  image: string;
  uploadedAt: string;
};
