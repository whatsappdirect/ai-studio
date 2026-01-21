
export interface Hydrant {
  id: string;
  proposedLocation: string;
  latitude: number;
  longitude: number;
  plusCode: string;
  timestamp: number;
}

export interface SessionData {
  mainAreaLocation: string;
  hydrants: Hydrant[];
  isSetupDone: boolean;
}

export const DEFAULT_MAIN_AREA = "Shaheenabad Main Bazar Gujranwala";
export const STATION_ID = "RS-02";
export const WHATSAPP_NUMBER = "03000710042";
