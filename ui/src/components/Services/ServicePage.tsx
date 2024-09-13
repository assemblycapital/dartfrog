import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import useDartStore from "../../store/dart";
import { PublicService, Service, ServiceID, ServiceEditOptions, EditServiceForm } from '@dartfrog/puddle';
import styles from './ServicePage.module.css';

const ServicePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { localServices, peerMap, requestLocalServiceList, setCurrentPage, editService } = useDartStore();
    const [service, setService] = useState<Service | null>(null);
    const [publicService, setPublicService] = useState<PublicService | null>(null);

    const [availablePeers, setAvailablePeers] = useState<string[]>([]);

    useEffect(() => {
        setAvailablePeers(Array.from(peerMap.keys()));
    }, [peerMap]);

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

    const handleEditService = useCallback((serviceOptions: ServiceEditOptions) => {
        if (service) {
            editService(service.id.toString(), serviceOptions);
        }
    }, [service, editService]);

    const [quickTitle, setQuickTitle] = useState('');
    const [quickDescription, setQuickDescription] = useState('');

    useEffect(() => {
        if (service) {
            setQuickTitle(service.meta.title || '');
            setQuickDescription(service.meta.description || '');
        }
    }, [service]);

    const handleQuickEdit = () => {
        if (service) {
            const serviceOptions: ServiceEditOptions = {
                title: quickTitle,
                description: quickDescription,
                access: service.meta.access,
                visibility: service.meta.visibility,
                whitelist: service.meta.whitelist,
                publishUserPresence: service.meta.publish_user_presence,
                publishSubscribers: service.meta.publish_subscribers,
                publishSubscriberCount: service.meta.publish_subscriber_count,
                publishWhitelist: service.meta.publish_whitelist,
            };
            editService(service.id.toString(), serviceOptions);
        }
    };

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
                overflowY:"scroll",

            }}
        >
            <div
                style={{
                    margin:"1rem"
                }}
            >
                <div >
                    <label htmlFor="quickTitle">Title:</label>
                    <input
                        id="quickTitle"
                        type="text"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className={styles.quickMenuField}>
                    <label htmlFor="quickDescription">Description:</label>
                    <input
                        id="quickDescription"
                        type="text"
                        value={quickDescription}
                        onChange={(e) => setQuickDescription(e.target.value)}
                        autoComplete="off"

                    />
                </div>
                <button onClick={handleQuickEdit}>Update</button>
            </div>
            
            <div
                style={{
                    marginTop:"1rem",
                }}
            >
                {/* full service form: */}
            </div>

            <div
                style={{
                    overflowY:"auto",
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

                <div
                    style={{
                        marginTop:"1rem",
                    }}
                >
                    <EditServiceForm
                        service={service}
                        onSubmit={handleEditService}
                        availablePeers={availablePeers}
                    />
                </div>
            </div>
        </div>
    );
};

export default ServicePage;