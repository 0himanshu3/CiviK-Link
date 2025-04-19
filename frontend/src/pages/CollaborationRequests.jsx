import React from 'react';
import CollaborationRequests from '../components/CollaborationRequests';

const CollaborationRequestsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Collaboration Requests</h1>
      <CollaborationRequests />
    </div>
  );
};

export default CollaborationRequestsPage; 