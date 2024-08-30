import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../../utils';
import styles from './AppGrid.module.css';
import { HamburgerIcon } from '@dartfrog/puddle/components/Icons';
import { getPackageName, processToSubdomain } from '../JoinPage';

interface AppGridItemProps {
  title: string;
  backgroundColor: string;
  textColor: string;
  protocolLink?: string;
  serviceLink?: string;
  imageUrl?: string;
  isDialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
}

const AppGridItem: React.FC<AppGridItemProps> = ({ 
  title, backgroundColor, textColor, protocolLink, serviceLink, imageUrl, isDialogOpen, onOpenDialog, onCloseDialog 
}) => {
  const navigate = useNavigate();
  const [showHamburger, setShowHamburger] = useState(false);

  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isDialogOpen) {
      if (protocolLink) {
        window.location.href = `http://${baseOrigin}/${protocolLink}/`;
        const packageName = getPackageName(protocolLink)
        if (packageName !== "dartfrog:herobrine.os") {
          let url = `http://${baseOrigin}/${protocolLink}/`;
          window.location.replace(url);
        } else {
          const packageSubdomain = processToSubdomain(protocolLink)
          let url = `http://${packageSubdomain}.${baseOrigin}/${protocolLink}/`;
          window.location.replace(url);
        }
      } else if (serviceLink) {
        navigate(`/join/${serviceLink.slice(5)}`);
      }
    }
  };

  const handleHamburgerClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isDialogOpen) {
      onCloseDialog();
    } else {
      onOpenDialog();
    }
  };

  return (
    <div
      className={`${styles.gridItem}`}
      style={{ 
        backgroundColor, 
        color: textColor, 
        position: 'relative',
        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={handleClick}
      onMouseEnter={() => setShowHamburger(true)}
      onMouseLeave={() => setShowHamburger(false)}
    >
      {(isDialogOpen || showHamburger) && (
        <div className={styles.iconWrapper} onClick={handleHamburgerClick}>
          <HamburgerIcon color="gray" />
        </div>
      )}
      {isDialogOpen && (
        <div className={styles.dialog}>
          <div
            style={{
              display:"flex",
              flexDirection:"column",
            }}
          >
            <div className={styles.dialogOption}>
              info
            </div>
            <div className={styles.dialogOption}>
              delete
            </div>
          </div>
        </div>
      )}
      <div className={`${styles.itemTitle}`}>
        {title}
      </div>
    </div>
  );
};

const NewAppGridItem: React.FC = () => {
  return (
    <div
      className={`${styles.newGridItem}`}
    >
      <div className={styles.itemTitle}>
        +
      </div>
    </div>
  );
};
const AppGrid: React.FC = () => {
  const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDialogIndex !== null && !(event.target as Element).closest(`.${styles.gridItem}`)) {
        setOpenDialogIndex(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDialogIndex]);

  const handleOpenDialog = (index: number) => {
    setOpenDialogIndex(index);
  };

  const handleCloseDialog = () => {
    setOpenDialogIndex(null);
  };

  const appGridItems = [
    { title: "radio", backgroundColor: "white", textColor: "black", protocolLink: "radio:dartfrog:herobrine.os", imageUrl: "https://bwyl.nyc3.digitaloceanspaces.com/radio/radio.png"},
    { title: "rumors", backgroundColor: "rgb(187, 119, 221)", textColor: "black", protocolLink: "rumors:dartfrog:herobrine.os" },
    { title: "hub", backgroundColor: "#444", textColor: "#ccc", serviceLink: "df://hub:fake.dev@radio:dartfrog:herobrine.os", imageUrl: "https://i.postimg.cc/MKmrbvDF/forum-icon.png" },
    // { title: "forum", backgroundColor: "#444", textColor: "#ccc", serviceLink: "df://hub:fake.dev@radio:dartfrog:herobrine.os", imageUrl: "https://example.com/hub-image.jpg" },
    // { title: "chess", backgroundColor: "#444", textColor: "#ccc", serviceLink: "df://hub:fake.dev@radio:dartfrog:herobrine.os", imageUrl: "https://example.com/hub-image.jpg" },
    // { title: "piano", backgroundColor: "#444", textColor: "#ccc", serviceLink: "df://hub:fake.dev@radio:dartfrog:herobrine.os", imageUrl: "https://example.com/hub-image.jpg" },
    // { title: "page", backgroundColor: "#444", textColor: "#ccc", serviceLink: "df://hub:fake.dev@radio:dartfrog:herobrine.os", imageUrl: "https://example.com/hub-image.jpg" },
  ];

  return (
    <div>
      <NewAppGridItem />
      {appGridItems.map((item, index) => (
        <AppGridItem
          key={index}
          {...item}
          isDialogOpen={openDialogIndex === index}
          onOpenDialog={() => handleOpenDialog(index)}
          onCloseDialog={handleCloseDialog}
        />
      ))}
    </div>
  );
};

export default AppGrid;