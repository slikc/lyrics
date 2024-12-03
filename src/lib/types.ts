export interface Track {
  album: {
    images: { url: string; height: number; width: number }[];
    album_type: string;
    artists: Artist[];
    name: string;
    is_playable: boolean;
    release_date: string;
    release_date_precision: string;
    total_tracks: number;
  };
  artists: Artist[];
  disc_number?: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: { isrc: string };
  is_local: boolean;
  popularity: number;
  preview_url: string;
  track_number: number;
  uri: string;
  id: string;
  name: string;
}

interface Artist {
  name: string;
  href: string;
  id: string;
  type: string;
  uri: string;
}
