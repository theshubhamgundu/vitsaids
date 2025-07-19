// src/components/AdminUploader.tsx

import React, { useState } from "react";
import { uploadImageAndAppendData } from "@/server/githubUploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const AdminUploader = () => {
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryTitle, setGalleryTitle] = useState("");

  const [eventFile, setEventFile] = useState<File | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  const [facultyFile, setFacultyFile] = useState<File | null>(null);
  const [facultyName, setFacultyName] = useState("");
  const [facultyDesignation, setFacultyDesignation] = useState("");

  const [placementFile, setPlacementFile] = useState<File | null>(null);
  const [placementCompany, setPlacementCompany] = useState("");
  const [placementStudent, setPlacementStudent] = useState("");

  const handleUpload = async (
    type: "gallery" | "events" | "faculty" | "placements",
    file: File | null,
    metadata: any
  ) => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    try {
      await uploadImageAndAppendData(type, file, metadata);
      toast.success(`${type} uploaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Gallery Upload */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-lg font-bold">Upload to Gallery</h2>
          <Input type="file" onChange={(e) => setGalleryFile(e.target.files?.[0] || null)} />
          <Input placeholder="Title" value={galleryTitle} onChange={(e) => setGalleryTitle(e.target.value)} />
          <Button onClick={() => handleUpload("gallery", galleryFile, { title: galleryTitle })}>Upload Gallery</Button>
        </CardContent>
      </Card>

      {/* Events Upload */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-lg font-bold">Upload Event</h2>
          <Input type="file" onChange={(e) => setEventFile(e.target.files?.[0] || null)} />
          <Input placeholder="Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
          <Input placeholder="Event Description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} />
          <Button onClick={() => handleUpload("events", eventFile, { title: eventTitle, description: eventDescription })}>Upload Event</Button>
        </CardContent>
      </Card>

      {/* Faculty Upload */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-lg font-bold">Upload Faculty</h2>
          <Input type="file" onChange={(e) => setFacultyFile(e.target.files?.[0] || null)} />
          <Input placeholder="Name" value={facultyName} onChange={(e) => setFacultyName(e.target.value)} />
          <Input placeholder="Designation" value={facultyDesignation} onChange={(e) => setFacultyDesignation(e.target.value)} />
          <Button onClick={() => handleUpload("faculty", facultyFile, { name: facultyName, designation: facultyDesignation })}>Upload Faculty</Button>
        </CardContent>
      </Card>

      {/* Placement Upload */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="text-lg font-bold">Upload Placement</h2>
          <Input type="file" onChange={(e) => setPlacementFile(e.target.files?.[0] || null)} />
          <Input placeholder="Student Name" value={placementStudent} onChange={(e) => setPlacementStudent(e.target.value)} />
          <Input placeholder="Company Name" value={placementCompany} onChange={(e) => setPlacementCompany(e.target.value)} />
          <Button onClick={() => handleUpload("placements", placementFile, { student: placementStudent, company: placementCompany })}>Upload Placement</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUploader;
