import React, { useState } from 'react';
import { ServiceCreationOptions, ServiceAccess, ServiceVisibility } from "@dartfrog/puddle";
import { useNavigate } from 'react-router-dom';
import useServiceStore from '@dartfrog/puddle/store/service';
import { PROCESS_NAME } from '../utils';

const CreatePage: React.FC = () => {
  const { createService } = useServiceStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    serviceName: '',
    processName: PROCESS_NAME,
    access: ServiceAccess.Public,
    visibility: ServiceVisibility.Visible,
    whitelist: [],
    title: '',
    description: '',
    publishUserPresence: true,
    publishSubscribers: true,
    publishSubscriberCount: false,
    publishWhitelist: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceOptions: ServiceCreationOptions = {
      ...formData,
    };
    try {
      await createService(serviceOptions);
      let serviceId = `${formData.serviceName}:${window.our?.node}@${PROCESS_NAME}`
      navigate(`/df/service/${serviceId}`);
    } catch (error) {
      console.error('Error creating service:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <div>
      <h2>Create a New Station</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="serviceName">Service Name:</label>
          <input type="text" id="serviceName" name="serviceName" value={formData.serviceName} onChange={handleChange} required />
        </div>
        {/* <div>
          <label htmlFor="access">Access:</label>
          <select id="access" name="access" value={formData.access} onChange={handleChange}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <label htmlFor="visibility">Visibility:</label>
          <select id="visibility" name="visibility" value={formData.visibility} onChange={handleChange}>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div>
          <label htmlFor="whitelist">Whitelist:</label>
          <input type="text" id="whitelist" name="whitelist" value={formData.whitelist} onChange={handleChange} />
        </div> */}
        <div> 
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>
        {/* <div>
          <label>
            <input type="checkbox" name="publishUserPresence" checked={formData.publishUserPresence} onChange={handleChange} />
            Publish User Presence
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="publishSubscribers" checked={formData.publishSubscribers} onChange={handleChange} />
            Publish Subscribers
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="publishSubscriberCount" checked={formData.publishSubscriberCount} onChange={handleChange} />
            Publish Subscriber Count
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" name="publishWhitelist" checked={formData.publishWhitelist} onChange={handleChange} />
            Publish Whitelist
          </label>
        </div> */}
        <button type="submit">Create Station</button>
      </form>
    </div>
  );
};

export default CreatePage;