import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../../utils';
import styles from './AppGrid.module.css';
import { HamburgerIcon } from '@dartfrog/puddle/components/Icons';
import { getPackageName, processToSubdomain } from '../JoinPage';
import { HUB_NODE } from '@dartfrog/puddle/utils';

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
  const baseOrigin = window.origin.split(".").slice(1).join(".");

  const getLink = (): string => {
    if (protocolLink) {
      const packageName = getPackageName(protocolLink)
      if (packageName !== "dartfrog:herobrine.os") {
        return `http://${baseOrigin}/${protocolLink}/`;
      } else {
        const packageSubdomain = processToSubdomain(protocolLink)
        return `http://${packageSubdomain}.${baseOrigin}/${protocolLink}/`;
      }
    } else if (serviceLink) {
      return `http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/join/${serviceLink.slice(5)}`;
    }
    return '#';
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isDialogOpen) {
      const link = getLink();
        window.location.replace(link);
      // if (protocolLink) {
      //   window.location.replace(link);
      // } else if (serviceLink) {
      //   navigate(link);
      // }
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
    <a
      href={getLink()}
      className={`${styles.gridItem}`}
      style={{ 
        backgroundColor, 
        color: textColor, 
        position: 'relative',
        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={(e)=>{
        e.preventDefault();
        handleClick(e)
      }}
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
    </a>
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
    { title: "rumors", backgroundColor: "rgb(187, 119, 221)", textColor: "black", serviceLink: `df://rumors-hub:${HUB_NODE}@rumors:dartfrog:herobrine.os` },
    { title: "forum", backgroundColor: "#444", textColor: "#ccc", serviceLink: `df://forum-hub:${HUB_NODE}@forum:dartfrog:herobrine.os`, imageUrl: "https://i.postimg.cc/MKmrbvDF/forum-icon.png" },
  ];

  return (
    <div
      style={{
        marginTop:"1rem"
      }}
    >

      <div>
        {/* <div
        >
          <button
            style={{
              margin:"4px 0rem"
            }}
          >
            get apps
          </button>
        </div> */}
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
    </div>
  );
};

export default AppGrid;