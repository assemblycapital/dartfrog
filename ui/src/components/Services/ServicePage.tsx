import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useDartStore from "../../store/dart";
import { PublicService, Service, ServiceID, ServiceAccess, ServiceVisibility, ServiceEditOptions } from '@dartfrog/puddle/index';
import styles from './ServicePage.module.css';

const ServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { localServices, peerMap, requestLocalServiceList, setCurrentPage, editService } = useDartStore();
    const [service, setService] = useState<Service | null>(null);
    const [publicService, setPublicService] = useState<PublicService | null>(null);

    const [selectedAccess, setSelectedAccess] = useState<ServiceAccess>(ServiceAccess.Public);
    const [selectedVisibility, setSelectedVisibility] = useState<ServiceVisibility>(ServiceVisibility.Visible);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [publishUserPresence, setPublishUserPresence] = useState(false);
    const [publishSubscribers, setPublishSubscribers] = useState(false);
    const [publishWhitelist, setPublishWhitelist] = useState(false);
    const [publishSubscriberCount, setPublishSubscriberCount] = useState(false);
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [isCustomWhitelist, setIsCustomWhitelist] = useState(false);
    const [customWhitelistPeer, setCustomWhitelistPeer] = useState('');
    const [availablePeers, setAvailablePeers] = useState<string[]>([]);

    useEffect(() => {
        requestLocalServiceList();
    }, [requestLocalServiceList]);
    useEffect(()=>{
      setCurrentPage('services')
    }, [])

    useEffect(() => {
        if (id) {
            const localService = localServices.find(service => service.id.toString() === id);
            if (localService) {
                setService(localService);
            } else {
                const parsedServiceId = ServiceID.fromString(id)
                if (parsedServiceId) {
                  const peer = peerMap.get(parsedServiceId.hostNode());
                  if (peer && peer.peerData) {
                      const hostedService = peer.peerData.hostedServices.find(service => service.id.toString() === id);
                      if (hostedService) {
                          setPublicService(hostedService);
                      }
                  }

                }
            }
        }
    }, [id, localServices, peerMap]);

    useEffect(() => {
        if (service) {
            setSelectedAccess(service.meta.access);
            setSelectedVisibility(service.meta.visibility);
            setTitle(service.meta.title);
            setDescription(service.meta.description);
            setPublishUserPresence(service.meta.publish_user_presence);
            setPublishSubscribers(service.meta.publish_subscribers);
            setPublishWhitelist(service.meta.publish_whitelist);
            setPublishSubscriberCount(service.meta.publish_subscriber_count);
            setWhitelist(service.meta.whitelist);
        }
    }, [service]);

    const handleAccessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAccess(e.target.value as ServiceAccess);
    };

    const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedVisibility(e.target.value as ServiceVisibility);
    };

    const handleRemoveFromWhitelist = (peer: string) => {
        setWhitelist(whitelist.filter(p => p !== peer));
    };

    const handleAddToWhitelist = (value: string) => {
        if (value === 'custom') {
            setIsCustomWhitelist(true);
        } else if (!whitelist.includes(value)) {
            setWhitelist([...whitelist, value]);
        }
    };

    const handleCustomWhitelistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomWhitelistPeer(e.target.value);
    };

    const handleAddCustomWhitelist = () => {
        if (customWhitelistPeer && !whitelist.includes(customWhitelistPeer)) {
            setWhitelist([...whitelist, customWhitelistPeer]);
            setCustomWhitelistPeer('');
            setIsCustomWhitelist(false);
        }
    };

    const handleInputEditClick = useCallback(() => {
        if (service) {
            const serviceOptions: ServiceEditOptions = {
                title: title || undefined,
                description: description || undefined,
                access: selectedAccess,
                visibility: selectedVisibility,
                whitelist: whitelist,
                publishUserPresence,
                publishSubscribers,
                publishWhitelist,
                publishSubscriberCount,
            };

            editService(service.id.toString(), serviceOptions);

            // Refresh the service list after a short delay
            // setTimeout(() => {
            //     requestLocalServiceList();
            // }, 100);
        }
    }, [service, title, description, selectedAccess, selectedVisibility, whitelist,
        publishUserPresence, publishSubscribers, publishWhitelist, publishSubscriberCount,
        editService, requestLocalServiceList]);

    if (!service) {
        if (!publicService) {
          return (
          <div>Loading...</div>
          )
        }
        return (
          <div
            style={{
                marginTop:"1rem",
            }}
          >
            <div className={styles.container}>
                <div className={styles.row}>
                    <div className={styles.bold}>ID:</div>
                    <span>{publicService.id.toString()}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Title:</div>
                    <span>{publicService.meta.title}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Description:</div>
                    <span>{publicService.meta.description}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Last Sent Presence:</div>
                    <span>{new Date(publicService.meta.last_sent_presence * 1000).toLocaleString()}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Subscribers:</div>
                    <span>{publicService.meta.subscribers?.join(', ')}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>User Presence:</div>
                    <span>{JSON.stringify(Array.from(publicService.meta.user_presence?.entries() || []))}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Access:</div>
                    <span>{publicService.meta.access}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Visibility:</div>
                    <span>{publicService.meta.visibility}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Whitelist:</div>
                    <span>{publicService.meta.whitelist?.join(', ')}</span>
                </div>
            </div>
          </div>
        )
    }

    return (
        <div
            style={{
                marginTop:"1rem",
            }}
        >
            <div className={styles.container}>
                <div className={styles.row}>
                    <div className={styles.bold}>ID:</div>
                    <span>{service.id.toString()}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Title:</div>
                    <span>{service.meta.title}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Description:</div>
                    <span>{service.meta.description}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Last Sent Presence:</div>
                    {service.meta.last_sent_presence &&
                        <span>{new Date(service.meta.last_sent_presence * 1000).toLocaleString()}</span>
                    }
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Subscribers:</div>
                    <span>{service.meta.subscribers.join(', ')}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>User Presence:</div>
                    <span>{JSON.stringify(Array.from(service.meta.user_presence.entries()))}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Access:</div>
                    <span>{service.meta.access}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Visibility:</div>
                    <span>{service.meta.visibility}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Whitelist:</div>
                    <span>{service.meta.whitelist.join(', ')}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Publish User Presence:</div>
                    <span>{service.meta.publish_user_presence ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Publish Subscribers:</div>
                    <span>{service.meta.publish_subscribers ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Publish Subscriber Count:</div>
                    <span>{service.meta.publish_subscriber_count ? 'Yes' : 'No'}</span>
                </div>
                <div className={styles.row}>
                    <div className={styles.bold}>Publish Whitelist:</div>
                    <span>{service.meta.publish_whitelist ? 'Yes' : 'No'}</span>
                </div>
            </div>

            <div>
                <div
            style={{
              display:"flex",
              flexDirection:"column",
              gap: "0.6rem",
              fontSize:"0.8rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection:"column",
                gap: "0.6rem"
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Access:</span>
                <select
                  name="serviceAccessOption"
                  id="serviceAccessOption"
                  value={selectedAccess}
                  onChange={handleAccessChange}
                >
                  <option value="Public">Public</option>
                  <option value="Whitelist">Whitelist</option>
                  <option value="HostOnly">Host Only</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Visibility:</span>
                <select
                  name="serviceVisibilityOption"
                  id="serviceVisibilityOption"
                  value={selectedVisibility}
                  onChange={handleVisibilityChange}
                >
                  <option value="Visible">Visible</option>
                  <option value="VisibleToHost">Host Only</option>
                  <option value="Hidden">Hidden</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Title:</span>
                <input
                  type="text"
                  placeholder="Service Title"
                  value={title || ''}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Description:</span>
                <input
                  type="text"
                  placeholder="Service Description"
                  value={description || ''}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Publish User Presence:</span>
                <input
                  type="checkbox"
                  checked={publishUserPresence}
                  onChange={(e) => setPublishUserPresence(e.target.checked)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Publish Subscribers:</span>
                <input
                  type="checkbox"
                  checked={publishSubscribers}
                  onChange={(e) => setPublishSubscribers(e.target.checked)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Publish Whitelist:</span>
                <input
                  type="checkbox"
                  checked={publishWhitelist}
                  onChange={(e) => setPublishWhitelist(e.target.checked)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Publish Subscriber Count:</span>
                <input
                  type="checkbox"
                  checked={publishSubscriberCount}
                  onChange={(e) => setPublishSubscriberCount(e.target.checked)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ marginBottom: "0.5rem" }}>Whitelist:</span>
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
                  {whitelist.map(peer => (
                    <div key={peer} style={{ padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {peer}
                      <button onClick={() => handleRemoveFromWhitelist(peer)} style={{ width:"auto", marginLeft: "0.5rem", background: "none", border: "none", color: "red", cursor: "pointer" }}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: "0.5rem", gap: "0.5rem" }}>
                  <select
                    onChange={(e) => handleAddToWhitelist(e.target.value)}
                    value=""
                    style={{ width:"auto" }}
                  >
                    <option value="" disabled>Add peer to whitelist</option>
                    <option value="custom">custom</option>
                    {availablePeers.filter(peer => !whitelist.includes(peer)).map(peer => (
                      <option key={peer} value={peer}>{peer}</option>
                    ))}
                  </select>
                  {isCustomWhitelist && (
                    <>
                      <input
                        type="text"
                        value={customWhitelistPeer}
                        onChange={handleCustomWhitelistChange}
                        placeholder="Enter custom peer"
                        style={{ width: 'auto' }}
                      />
                      <button onClick={handleAddCustomWhitelist} style={{ width: 'auto' }}>Add</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              style={{
                cursor: 'pointer',
                justifyContent: 'center',
              }}
              onClick={handleInputEditClick}
            >
              edit
            </button>
          </div>
            </div>
        </div>
    );
};

export default ServicePage;