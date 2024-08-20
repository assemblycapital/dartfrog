import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PROCESS_NAME } from '../../utils';
import styles from './AppGrid.module.css';
import { HamburgerIcon } from '@dartfrog/puddle/components/Icons';

interface AppGridItemProps {
  title: string;
  backgroundColor: string;
  textColor: string;
  link: string;
  imageUrl?: string;
  isDialogOpen: boolean;
  onOpenDialog: () => void;
  onCloseDialog: () => void;
}

const AppGridItem: React.FC<AppGridItemProps> = ({ 
  title, backgroundColor, textColor, link, imageUrl, isDialogOpen, onOpenDialog, onCloseDialog 
}) => {
  const navigate = useNavigate();
  const [showHamburger, setShowHamburger] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!isDialogOpen) {
      navigate(link);
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
            <div>
              button
            </div>
            <div>
              other button
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
      className={`${styles.gridItem} ${styles.newGridItem}`}
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
    { title: "hub", backgroundColor: "#444", textColor: "#ccc", link: "/hub", imageUrl: "https://example.com/hub-image.jpg" },
    { title: "radio", backgroundColor: "#444", textColor: "#ccc", link: "/hub", imageUrl: "https://bwyl.nyc3.digitaloceanspaces.com/radio/radio.png"},
    { title: "rumors", backgroundColor: "rgb(187, 119, 221)", textColor: "black", link: "/rumors", imageUrl: "https://example.com/rumors-image.jpg" },
  ];

  return (
    <div>
      {appGridItems.map((item, index) => (
        <AppGridItem
          key={index}
          {...item}
          isDialogOpen={openDialogIndex === index}
          onOpenDialog={() => handleOpenDialog(index)}
          onCloseDialog={handleCloseDialog}
        />
      ))}
      <NewAppGridItem />
    </div>
  );
};

export default AppGrid;