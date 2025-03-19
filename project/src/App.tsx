import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { db, storage } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AdminPage from './AdminPage';

interface Contact {
  phone: string;
  contactName: string;
  relation: string;
  educationQualification?: string;
  nameOfOrganisation?: string;
  designation?: string;
  department?: string;
  photo?: File | null;
  photoURL?: string;
  photoName?: string;
}

function EnrollmentForm() {
  const [formData, setFormData] = useState({
    studentName: '',
    schoolName: '',
    grade: 'Playschool',
    board: 'IGCSE',
    branch: '',
    academicYear: '2024-2025',
    area: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    gender: '',
  });

  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [studentPhotoName, setStudentPhotoName] = useState<string | null>(null);
  const [studentPhotoURL, setStudentPhotoURL] = useState<string | null>(null);
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState<boolean>(false);

  const [contacts, setContacts] = useState<Contact[]>([{
    phone: '',
    contactName: '',
    relation: '',
    photo: null,
  }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Upload student photo if exists
      let studentPhotoURLFinal = studentPhotoURL;
      if (studentPhoto) {
        try {
          studentPhotoURLFinal = await uploadStudentPhoto(studentPhoto);
        } catch (error) {
          console.error('Error uploading student photo:', error);
          studentPhotoURLFinal = null;
        }
      }

      // Upload contact photos and get URLs
      const contactsWithPhotos = await Promise.all(
        contacts.map(async (contact, index) => {
          if (contact.photo) {
            try {
              const photoURL = await uploadContactPhoto(contact.photo, index);
              return { 
                ...contact, 
                photoURL, 
                photo: null // Remove the File object before storing in Firestore
              };
            } catch (error) {
              console.error('Error uploading contact photo:', error);
              return { ...contact, photo: null }; // If upload fails, still continue but without photo
            }
          }
          return { ...contact, photo: null };
        })
      );

      // Prepare the data for Firestore
      const enrollmentData = {
        ...formData,
        studentPhotoURL: studentPhotoURLFinal,
        studentPhotoName: studentPhotoName,
        contacts: contactsWithPhotos.map(contact => ({
          phone: contact.phone,
          contactName: contact.contactName,
          relation: contact.relation,
          educationQualification: contact.educationQualification || null,
          nameOfOrganisation: contact.nameOfOrganisation || null,
          designation: contact.designation || null,
          department: contact.department || null,
          photoURL: contact.photoURL || null,
          photoName: contact.photoName || null,
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to Firestore
      const enrollmentsRef = collection(db, 'enrollments');
      await addDoc(enrollmentsRef, enrollmentData);

      // Reset form
      setFormData({
        studentName: '',
        schoolName: '',
        grade: 'Playschool',
        board: 'IGCSE',
        branch: '',
        academicYear: '2024-2025',
        area: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        dateOfBirth: '',
        gender: '',
      });
      
      setStudentPhoto(null);
      setStudentPhotoName(null);
      setStudentPhotoURL(null);
      
      setContacts([{
        phone: '',
        contactName: '',
        relation: '',
        photo: null,
      }]);
      
      alert('Enrollment submitted successfully!');
    } catch (error) {
      console.error('Error submitting enrollment:', error);
      setSubmitError((error as Error).message || 'Failed to submit enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadStudentPhoto = async (file: File): Promise<string> => {
    setUploadingStudentPhoto(true);
    
    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `student_photos/${timestamp}_${file.name}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, filename);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading student photo:', error);
      throw error;
    } finally {
      setUploadingStudentPhoto(false);
    }
  };
  
  const uploadContactPhoto = async (file: File, contactIndex: number): Promise<string> => {
    setUploadingIndex(contactIndex);
    
    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `contact_photos/${timestamp}_${file.name}`;
      
      // Create a reference to the file location in Firebase Storage
      const storageRef = ref(storage, filename);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading contact photo:', error);
      throw error;
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (index: number, field: string, value: string) => {
    const updatedContacts = contacts.map((contact, i) => {
      if (i === index) {
        return { ...contact, [field]: value };
      }
      return contact;
    });
    setContacts(updatedContacts);
  };

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setStudentPhoto(file);
    setStudentPhotoName(file ? file.name : null);
  };

  const handleContactPhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const updatedContacts = contacts.map((contact, i) => {
      if (i === index) {
        return { 
          ...contact, 
          photo: file,
          photoName: file ? file.name : undefined
        };
      }
      return contact;
    });
    setContacts(updatedContacts);
  };

  const addContact = () => {
    setContacts([...contacts, {
      phone: '',
      contactName: '',
      relation: '',
      photo: null,
    }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Student Enrollment Form</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Please fill out all required fields marked with *</p>
              </div>
              <Link to="/admin" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Admin
              </Link>
            </div>
            
            {submitError && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {/* Student Information Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-6">Student Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      name="studentName"
                      id="studentName"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.studentName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      id="dateOfBirth"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      name="gender"
                      id="gender"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Student Photo Upload */}
                <div className="mt-6">
                  <label htmlFor="student-photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Student Photo
                  </label>
                  <div className="flex items-center">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {studentPhotoName ? 'Change Photo' : 'Upload Photo'}
                      </span>
                      <input 
                        id="student-photo"
                        name="student-photo"
                        type="file" 
                        className="sr-only"
                        accept="image/*"
                        onChange={handleStudentPhotoChange}
                        aria-label="Upload student photo"
                      />
                    </label>
                    {uploadingStudentPhoto && (
                      <span className="ml-3 text-sm text-gray-500">Uploading...</span>
                    )}
                    {studentPhotoName && (
                      <span className="ml-3 text-sm text-gray-500">{studentPhotoName}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-6">Academic Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
                      School Name
                    </label>
                    <input
                      type="text"
                      name="schoolName"
                      id="schoolName"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.schoolName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
                      Grade *
                    </label>
                    <select
                      name="grade"
                      id="grade"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.grade}
                      onChange={handleChange}
                    >
                      <option>Playschool</option>
                      <option>Nursery</option>
                      <option>Jr. KG</option>
                      <option>Sr. KG</option>
                      {[...Array(15)].map((_, i) => (
                        <option key={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="board" className="block text-sm font-medium text-gray-700">
                      Board *
                    </label>
                    <select
                      name="board"
                      id="board"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.board}
                      onChange={handleChange}
                    >
                      <option>IGCSE</option>
                      <option>AS/A Levels</option>
                      <option>IBDP</option>
                      <option>IB</option>
                      <option>CBSE</option>
                      <option>ICSE</option>
                      <option>State Board</option>
                      <option>NIOS</option>
                      <option>Others</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Details Section */}
              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-6">Address Details</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                      Area
                    </label>
                    <input
                      type="text"
                      name="area"
                      id="area"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.area}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="landmark" className="block text-sm font-medium text-gray-700">
                      Landmark
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      id="landmark"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.landmark}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      id="state"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      id="pincode"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-blue-900">Contact Information</h2>
                  <button
                    type="button"
                    onClick={addContact}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Contact
                  </button>
                </div>

                {contacts.map((contact, index) => (
                  <div key={index} className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Contact #{index + 1}</h3>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeContact(index)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
                      <div>
                        <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id={`phone-${index}`}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={contact.phone}
                          onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        />
                      </div>

                      <div>
                        <label htmlFor={`contactName-${index}`} className="block text-sm font-medium text-gray-700">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          id={`contactName-${index}`}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={contact.contactName}
                          onChange={(e) => handleContactChange(index, 'contactName', e.target.value)}
                        />
                      </div>

                      <div>
                        <label htmlFor={`relation-${index}`} className="block text-sm font-medium text-gray-700">
                          Relation *
                        </label>
                        <select
                          id={`relation-${index}`}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          value={contact.relation}
                          onChange={(e) => handleContactChange(index, 'relation', e.target.value)}
                        >
                          <option value="">Select relation</option>
                          <option value="parent">Parent</option>
                          <option value="guardian">Guardian</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Additional fields based on relation */}
                    {contact.relation && contact.relation !== 'student' && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">
                          Additional Information for {contact.relation.charAt(0).toUpperCase()
                            + contact.relation.slice(1)}
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`educationQualification-${index}`} className="block text-sm font-medium text-gray-700">
                              Education Qualification
                            </label>
                            <input
                              type="text"
                              id={`educationQualification-${index}`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={contact.educationQualification || ''}
                              onChange={(e) => handleContactChange(index, 'educationQualification', e.target.value)}
                            />
                          </div>

                          <div>
                            <label htmlFor={`nameOfOrganisation-${index}`} className="block text-sm font-medium text-gray-700">
                              Name of Organisation
                            </label>
                            <input
                              type="text"
                              id={`nameOfOrganisation-${index}`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={contact.nameOfOrganisation || ''}
                              onChange={(e) => handleContactChange(index, 'nameOfOrganisation', e.target.value)}
                            />
                          </div>

                          <div>
                            <label htmlFor={`designation-${index}`} className="block text-sm font-medium text-gray-700">
                              Designation
                            </label>
                            <input
                              type="text"
                              id={`designation-${index}`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={contact.designation || ''}
                              onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                            />
                          </div>

                          <div>
                            <label htmlFor={`department-${index}`} className="block text-sm font-medium text-gray-700">
                              Department
                            </label>
                            <input
                              type="text"
                              id={`department-${index}`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              value={contact.department || ''}
                              onChange={(e) => handleContactChange(index, 'department', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Contact Photo Upload */}
                        <div className="mt-6">
                          <label htmlFor={`contact-photo-${index}`} className="block text-sm font-medium text-gray-700 mb-2">
                            {contact.relation.charAt(0).toUpperCase() + contact.relation.slice(1)}'s Photo
                          </label>
                          <div className="flex items-center">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                              <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                {contact.photoName ? 'Change Photo' : 'Upload Photo'}
                              </span>
                              <input 
                                id={`contact-photo-${index}`}
                                name={`contact-photo-${index}`}
                                type="file" 
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => handleContactPhotoChange(index, e)}
                                aria-label={`Upload ${contact.relation}'s photo`}
                              />
                            </label>
                            {uploadingIndex === index && (
                              <span className="ml-3 text-sm text-gray-500">Uploading...</span>
                            )}
                            {contact.photoName && (
                              <span className="ml-3 text-sm text-gray-500">{contact.photoName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white ${
                    isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/" element={<EnrollmentForm />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;