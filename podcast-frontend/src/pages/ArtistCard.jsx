import React from 'react';
import './ArtistCard.css';
import { Mic } from 'lucide-react';

const ArtistCard = ({ artist }) => {
  return (
    <div className="artist-card">
      <div className="artist-image-wrapper">
        <img 
          src={artist.image} 
          alt={artist.name} 
          className="artist-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x200/1a1a1a/ffffff?text=' + artist.name.charAt(0);
          }}
        />
        <div className="artist-overlay">
          <Mic size={32} className="play-icon" />
        </div>
      </div>
      <h3 className="artist-name">{artist.name}</h3>
    </div>
  );
};

export default ArtistCard;