// Photos of the school's activities, served from /public/gallery:
//   /gallery/<id>.jpg        full size (long edge 2000px, ~300-500KB)
//   /gallery/<id>-thumb.jpg  strip thumbnail (long edge 280px)
// Generated from the originals by resizing; to add a photo, drop a pair of files with the next
// number in public/gallery and add a line here.
export const GALLERY_PHOTOS = [
  { id: 'photo-01', w: 2000, h: 1333 },
  { id: 'photo-02', w: 2000, h: 1333 },
  { id: 'photo-03', w: 2000, h: 1333 },
  { id: 'photo-04', w: 2000, h: 1333 },
  { id: 'photo-05', w: 2000, h: 1333 },
  { id: 'photo-06', w: 2000, h: 1333 },
  { id: 'photo-07', w: 1600, h: 1200 },
  { id: 'photo-08', w: 1600, h: 1200 },
  { id: 'photo-09', w: 1600, h: 1200 },
  { id: 'photo-10', w: 1280, h: 577 },
  { id: 'photo-11', w: 1280, h: 960 },
  { id: 'photo-12', w: 1280, h: 960 },
  { id: 'photo-13', w: 1280, h: 960 },
  { id: 'photo-14', w: 1600, h: 1200 },
  { id: 'photo-15', w: 1280, h: 963 },
  { id: 'photo-16', w: 1280, h: 960 },
  { id: 'photo-17', w: 1204, h: 1600 },
  { id: 'photo-18', w: 1200, h: 1600 },
  { id: 'photo-19', w: 1600, h: 1204 },
  { id: 'photo-20', w: 1592, h: 1194 },
  { id: 'photo-21', w: 1280, h: 960 },
  { id: 'photo-22', w: 1280, h: 960 },
  { id: 'photo-23', w: 1600, h: 1200 },
  { id: 'photo-24', w: 1600, h: 1200 },
  { id: 'photo-25', w: 1280, h: 720 },
  { id: 'photo-26', w: 1600, h: 1066 },
  { id: 'photo-27', w: 1600, h: 1066 },
  { id: 'photo-28', w: 1600, h: 1066 },
  { id: 'photo-29', w: 1600, h: 1066 },
  { id: 'photo-30', w: 1600, h: 1066 },
  { id: 'photo-31', w: 1600, h: 1066 },
  { id: 'photo-32', w: 1600, h: 900 },
  { id: 'photo-33', w: 1600, h: 900 },
  { id: 'photo-34', w: 1600, h: 1066 },
  { id: 'photo-35', w: 1600, h: 1066 },
  { id: 'photo-36', w: 1600, h: 1066 },
  { id: 'photo-37', w: 1600, h: 1066 },
];

export const photoUrl = (photo) => `/gallery/${photo.id}.jpg`;
export const thumbUrl = (photo) => `/gallery/${photo.id}-thumb.jpg`;
