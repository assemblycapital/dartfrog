import React, { useState, useEffect } from 'react';
import useForumStore from '../store/forum';
import useChatStore from '@dartfrog/puddle/store/chat';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';
import { getPeerNameColor, getRecencyText, nodeProfileLink, ServiceID } from '@dartfrog/puddle';
import { Routes, Route, useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';
import PostDetail from './PostDetail';
import HomePage from './HomePage';
import CreatePost from './CreatePost';
import ForumChat from './ForumChat';
import ForumAdmin from './ForumAdmin';
import ForumHeader from './ForumHeader';

const Forum: React.FC = () => {

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
        </Routes>
    </div>
  );
};

export default Forum;