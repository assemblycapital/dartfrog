import React, { useState, useEffect } from 'react';
import useForumStore from '../store/forum';
// import { getPeerNameColor, getRecencyText, nodeProfileLink, ServiceID } from '@dartfrog/puddle';
import { Routes, Route, useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import PostDetail from './PostDetail';
import HomePage from './HomePage';
import CreatePost from './CreatePost';
import ForumChat from './ForumChat';
import ForumAdmin from './ForumAdmin';
import ForumHeader from './ForumHeader';
import { useServiceStore } from '@dartfrog/puddle';

const Forum: React.FC = () => {
  const { peerMap, serviceMetadata, } = useServiceStore();

  return (
    <div
      style={{
        height:"100vh",
        maxHeight:"100vh",
        width:"100%",
        maxWidth:"100%",
        display:"flex",
        flexDirection:"column",
        padding:"20px",
        boxSizing: "border-box",
      }}
    >
      <Routes>
          <Route path="/post/:postId" element={
            <>
              <ForumHeader includeForumButton />
              <PostDetail />
            </>
            } />
          <Route path="/*" element={
            <>
              <ForumHeader />
              <HomePage />
            </>
          } />
          <Route path="/new" element={
            <>
              <ForumHeader includeForumButton />
              <CreatePost/>
            </>
          } />
          <Route path="/chat" element={
            <>
              <ForumHeader includeForumButton />
              <ForumChat />
            </>
          } />
          <Route path="/admin" element={
            <>
              <ForumHeader includeForumButton />
              <ForumAdmin />
            </>
          } />
          <Route path="/metadata" element={
            <>
              <ForumHeader includeForumButton />
              <div>
              {serviceMetadata ? (
                Object.entries(serviceMetadata).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {JSON.stringify(value)}
                  </div>
                ))
              ) : (
                <p>No metadata available</p>
              )}
              </div>
            </>
          } />
        </Routes>
    </div>
  );
};

export default Forum;