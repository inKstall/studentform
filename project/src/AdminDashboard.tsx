import React, { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { Download } from 'lucide-react';
import InkstallLogo from './InkstallLogo';
import inkstallLogoImg from './inkstall-logo.svg';

interface Contact {
  phone: string;
  contactName: string;
  relation: string;
  educationQualification?: string | null;
  nameOfOrganisation?: string | null;
  designation?: string | null;
  department?: string | null;
  photoURL?: string | null;
  photoName?: string | null;
}

interface Enrollment {
  id: string;
  studentName: string;
  dateOfBirth: string;
  gender: string;
  schoolName: string;
  grade: string;
  board: string;
  branch: string;
  academicYear: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  studentPhotoURL?: string | null;
  studentPhotoName?: string | null;
  contacts: Contact[];
  createdAt: Timestamp;
}

interface FirebaseError {
  message: string;
  code: string;
}

const AdminDashboard: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [auth, navigate]);

  useEffect(() => {
    // Check if user is admin
    const user = auth.currentUser;
    if (!user || user.email !== 'admin@questo.com') {
      handleLogout();
      return;
    }

    const fetchEnrollments = async () => {
      try {
        const enrollmentsRef = collection(db, 'enrollments');
        const snapshot = await getDocs(enrollmentsRef);
        
        const enrollmentData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Enrollment[];
        
        // Sort by creation date (newest first)
        enrollmentData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });
        
        setEnrollments(enrollmentData);
      } catch (err: unknown) {
        console.error('Error fetching enrollments:', err);
        const firebaseError = err as FirebaseError;
        setError(firebaseError.message || 'Failed to fetch enrollment data');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [auth, navigate, handleLogout]);

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const handleDownloadPhoto = (url: string, filename: string) => {
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <div className="bg-white text-gray-900 py-8 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            {/* Use the InkstallLogo component with fallback to image */}
            <div className="h-16">
              <InkstallLogo />
              <img 
                src={inkstallLogoImg} 
                alt="Inkstall Logo" 
                className="h-16 w-auto hidden" 
                onError={(e) => {
                  e.currentTarget.classList.remove('hidden');
                  const svgElement = e.currentTarget.previousElementSibling;
                  if (svgElement) {
                    svgElement.classList.add('hidden');
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-950">Inkstall Private Tuitions</h1>
              <p className="text-blue-700 text-lg mt-1">Admin Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-950">Admin Dashboard</h2>
            <p className="text-blue-600">Logged in as: {auth.currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading enrollment data...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No enrollment data available.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-800">Enrollments</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Total: {enrollments.length}
                </span>
              </div>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
                  {enrollments.map((enrollment) => (
                    <li 
                      key={enrollment.id}
                      className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors ${
                        selectedEnrollment?.id === enrollment.id ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => setSelectedEnrollment(enrollment)}
                    >
                      <div className="font-medium">{enrollment.studentName}</div>
                      <div className="text-sm text-gray-600">
                        {enrollment.grade} • {enrollment.board}
                      </div>
                      <div className="text-xs text-gray-500">
                        Submitted: {formatDate(enrollment.createdAt)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="w-full md:w-2/3">
              {selectedEnrollment ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4 text-blue-800">
                    Enrollment Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Student Information</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-600">Name:</span> {selectedEnrollment.studentName}</p>
                        <p><span className="text-gray-600">Date of Birth:</span> {selectedEnrollment.dateOfBirth}</p>
                        <p><span className="text-gray-600">Gender:</span> {selectedEnrollment.gender}</p>
                        
                        {/* Student Photo */}
                        {selectedEnrollment.studentPhotoURL && (
                          <div className="mt-4">
                            <p className="text-gray-600 mb-2">Student Photo:</p>
                            <div className="relative group">
                              <img 
                                src={selectedEnrollment.studentPhotoURL} 
                                alt="Student" 
                                className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                onClick={() => handleDownloadPhoto(
                                  selectedEnrollment.studentPhotoURL || '', 
                                  `${selectedEnrollment.studentName}_photo.jpg`
                                )}
                                className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download photo"
                              >
                                <Download className="h-5 w-5 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Academic Information</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-600">School:</span> {selectedEnrollment.schoolName}</p>
                        <p><span className="text-gray-600">Grade:</span> {selectedEnrollment.grade}</p>
                        <p><span className="text-gray-600">Board:</span> {selectedEnrollment.board}</p>
                        <p><span className="text-gray-600">Academic Year:</span> {selectedEnrollment.academicYear}</p>
                        <p><span className="text-gray-600">Branch:</span> {selectedEnrollment.branch}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Address</h3>
                    <p>
                      {selectedEnrollment.area}, {selectedEnrollment.landmark && `${selectedEnrollment.landmark}, `}
                      {selectedEnrollment.city}, {selectedEnrollment.state} - {selectedEnrollment.pincode}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                    {selectedEnrollment.contacts.map((contact, index) => (
                      <div key={index} className="border-t border-gray-200 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p><span className="text-gray-600">Name:</span> {contact.contactName}</p>
                            <p><span className="text-gray-600">Phone:</span> {contact.phone}</p>
                            <p><span className="text-gray-600">Relation:</span> {contact.relation}</p>
                            {contact.educationQualification && (
                              <p><span className="text-gray-600">Education:</span> {contact.educationQualification}</p>
                            )}
                            {contact.nameOfOrganisation && (
                              <p><span className="text-gray-600">Organization:</span> {contact.nameOfOrganisation}</p>
                            )}
                            {contact.designation && (
                              <p><span className="text-gray-600">Designation:</span> {contact.designation}</p>
                            )}
                            {contact.department && (
                              <p><span className="text-gray-600">Department:</span> {contact.department}</p>
                            )}
                          </div>
                          
                          {/* Contact Photo */}
                          {contact.photoURL && (
                            <div>
                              <p className="text-gray-600 mb-2">{contact.relation.charAt(0).toUpperCase() + contact.relation.slice(1)}'s Photo:</p>
                              <div className="relative group">
                                <img 
                                  src={contact.photoURL} 
                                  alt={`${contact.relation}'s photo`} 
                                  className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                />
                                <button
                                  onClick={() => handleDownloadPhoto(
                                    contact.photoURL || '', 
                                    `${contact.contactName}_${contact.relation}_photo.jpg`
                                  )}
                                  className="absolute bottom-2 right-2 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Download photo"
                                >
                                  <Download className="h-5 w-5 text-blue-600" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center h-full flex items-center justify-center">
                  <p className="text-gray-500">Select an enrollment to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
