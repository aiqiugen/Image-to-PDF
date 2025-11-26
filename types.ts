export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  name: string;
  type: string;
}

export enum PageSize {
  A4 = 'A4',
  LETTER = 'LETTER',
  FIT_IMAGE = 'FIT_IMAGE', // Page size equals image size
}

export enum PageOrientation {
  PORTRAIT = 'p',
  LANDSCAPE = 'l',
  AUTO = 'auto', // Decided by image dimensions
}

export enum ImageFit {
  CONTAIN = 'CONTAIN', // Scale to fit within margins
  FILL = 'FILL', // Stretch to fill (not recommended for lossless but useful)
  ORIGINAL = 'ORIGINAL', // Use original pixel size (might be huge on A4)
}

export interface PdfSettings {
  pageSize: PageSize;
  orientation: PageOrientation;
  margin: number; // in mm
  imageFit: ImageFit;
  filename: string;
}
