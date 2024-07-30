import React, { useState, useEffect } from 'react';
import useForumStore, { ForumComment } from '../store/forum';
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

const Forum: React.FC = () => {

  return (
    <Routes>
        <Route path="/post/:postId" element={
          <PostDetail />
          } />
        <Route path="/*" element={
          <HomePage />
        } />
        <Route path="/new" element={
          <CreatePost />
        } />
        <Route path="/chat" element={
          <ForumChat />
        } />
        <Route path="/admin" element={
          <ForumAdmin />
        } />
      </Routes>
  );
};

export default Forum;